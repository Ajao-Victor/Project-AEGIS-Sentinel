import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OntomorphService } from '../ontomorph/ontomorph.service';
import { Incident } from '../incidents/incident.entity';
import { Twin } from '@ontomorph/dtp-sdk';

@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);

  constructor(
    private readonly ontomorphService: OntomorphService,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  /**
   * Evaluates incoming lab results against active medications and clinical reference ranges
   */
  async processLabEvent(twin: Twin, event: any) {
    const labData = event.data || {};
    const labCode = labData.code || '2823-3';
    const labValue = parseFloat(labData.value) || 0;
    const system = event.system || labData.system || 'cardiovascular';

    this.logger.log(`Evaluating lab result [LOINC: ${labCode}, Value: ${labValue}] for Twin ID: ${twin.id}`);

    // 1. Fetch active medication events strictly from the Digital Twin (Read-Only)
    let activeMedicationCodes: number[] = [];
    
    try {
      const twinEvents = await twin.events.list();
      const medEvents = twinEvents.filter((e: any) => e.eventType === 'medication');

      activeMedicationCodes = medEvents
        .map((e: any) => parseInt(e.data?.rxNorm, 10))
        .filter((code: number) => !isNaN(code));
        
      this.logger.log(`Live Twin Regimen extracted: [${activeMedicationCodes.join(', ')}]`);
    } catch (e: any) {
      this.logger.error(`Failed to fetch twin event history: ${e.message}`);
    }

    // 2. Query HOLON API for live Drug-Drug Interactions (DDIs) across active regimen
    let totalInteractions = 0;
    let holonInteractions: any[] = [];

    try {
      // 🚀 THE FIX: Only check if the patient is on 2 or more drugs
      if (activeMedicationCodes.length > 1) {
        const ddiCheck = await this.ontomorphService.dtp.holon.interactions.checkList(activeMedicationCodes);
        totalInteractions = ddiCheck.totalInteractions || 0;
        holonInteractions = (ddiCheck as any).pairs || (ddiCheck as any).interactions || []; 
        this.logger.log(`HOLON Screening Complete: ${totalInteractions} interaction(s) detected.`);
      } else {
        this.logger.log(`HOLON Screening Skipped: Patient is on ${activeMedicationCodes.length} medication(s). No DDI possible.`);
      }
    } catch (error: any) {
      // If it fails, log it and proceed to the lab check natively
      this.logger.error(`HOLON DDI Lookup Failed: ${error.message}. Proceeding with metabolic threshold check.`);
    }

    // 3. Clinical Rule Evaluation (Lab Value Thresholds + DDI Presence)
    const isCriticalLabValue = labCode === '2823-3' && labValue >= 5.5;
    const alertTriggered = totalInteractions > 0 || isCriticalLabValue;

    let severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (alertTriggered) {
      if (labValue > 6.0 || totalInteractions >= 2) {
        severityLevel = 'CRITICAL';
      } else if (labValue >= 5.5 || totalInteractions === 1) {
        severityLevel = 'HIGH';
      } else {
        severityLevel = 'MEDIUM';
      }
    }

    const payload = {
      twinId: twin.id,
      triggeringSystem: system,
      labCode,
      labValue,
      totalInteractions,
      severityLevel,
      interactionsDetail: holonInteractions,
      evaluatedAt: new Date().toISOString(),
    };

    // 4. Persistent PostgreSQL Audit Logging via TypeORM
    if (alertTriggered) {
      try {
        const incident = this.incidentRepo.create({
          twinId: twin.id,
          system,
          labCode,
          labValue,
          severity: severityLevel,
          payload: JSON.stringify(payload),
          createdAt: new Date(),
        }); 
        
        await this.incidentRepo.save(incident);
        this.logger.log(`[PostgreSQL] Incident audit record written successfully for Twin ID: ${twin.id}`);
      } catch (dbError: any) {
        this.logger.error(`Failed to write incident audit to PostgreSQL: ${dbError.message}`);
      }
    }

    return {
      alertTriggered,
      payload,
    };
  }
}