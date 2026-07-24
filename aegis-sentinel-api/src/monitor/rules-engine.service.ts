// import { Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { OntomorphService } from '../ontomorph/ontomorph.service';
// import { Incident } from '../incidents/incident.entity';
// import { Twin } from '@ontomorph/dtp-sdk';

// @Injectable()
// export class RulesEngineService {
//   private readonly logger = new Logger(RulesEngineService.name);

//   constructor(
//     private readonly ontomorphService: OntomorphService,
//     @InjectRepository(Incident)
//     private readonly incidentRepo: Repository<Incident>,
//   ) {}

// /**
//    * Evaluates incoming lab results against active medications and clinical reference ranges
//    */
//   async processLabEvent(twin: Twin, event: any) {
//     // 🚀 ADD THIS LINE RIGHT HERE TO INSPECT THE RAW LAB DATA:
//     console.log('RAW LAB EVENT PAYLOAD:', JSON.stringify(event, null, 2));

//     const labData = event.data || {};
//     const labCode = labData.code || '2823-3';
//     const labValue = parseFloat(labData.value) || 0;
//     const system = event.system || labData.system || 'cardiovascular';

//     this.logger.log(`Evaluating lab result [LOINC: ${labCode}, Value: ${labValue}] for Twin ID: ${twin.id}`);

//     // 1. Fetch active medication events strictly from the Digital Twin (Read-Only)
//     let activeMedicationCodes: number[] = [];
    
//     try {
//       const twinEvents = await twin.events.list();
//       const medEvents = twinEvents.filter((e: any) => e.eventType === 'medication');

//       activeMedicationCodes = medEvents
//         .map((e: any) => parseInt(e.data?.rxNorm, 10))
//         .filter((code: number) => !isNaN(code));
        
//       this.logger.log(`Live Twin Regimen extracted: [${activeMedicationCodes.join(', ')}]`);
//     } catch (e: any) {
//       this.logger.error(`Failed to fetch twin event history: ${e.message}`);
//     }

//     // 2. Query HOLON API for live Drug-Drug Interactions (DDIs) across active regimen
//     let totalInteractions = 0;
//     let holonInteractions: any[] = [];

//     try {
//       // 🚀 THE FIX: Only check if the patient is on 2 or more drugs
//       if (activeMedicationCodes.length > 1) {
//         const ddiCheck = await this.ontomorphService.dtp.holon.interactions.checkList(activeMedicationCodes);
//         totalInteractions = ddiCheck.totalInteractions || 0;
//         holonInteractions = (ddiCheck as any).pairs || (ddiCheck as any).interactions || []; 
//         this.logger.log(`HOLON Screening Complete: ${totalInteractions} interaction(s) detected.`);
//       } else {
//         this.logger.log(`HOLON Screening Skipped: Patient is on ${activeMedicationCodes.length} medication(s). No DDI possible.`);
//       }
//     } catch (error: any) {
//       // If it fails, log it and proceed to the lab check natively
//       this.logger.error(`HOLON DDI Lookup Failed: ${error.message}. Proceeding with metabolic threshold check.`);
//     }

//     // 3. Clinical Rule Evaluation (Lab Value Thresholds + DDI Presence)
//     const isCriticalLabValue = labCode === '2823-3' && labValue >= 5.5;
//     const alertTriggered = totalInteractions > 0 || isCriticalLabValue;

//     let severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
//     if (alertTriggered) {
//       if (labValue > 6.0 || totalInteractions >= 2) {
//         severityLevel = 'CRITICAL';
//       } else if (labValue >= 5.5 || totalInteractions === 1) {
//         severityLevel = 'HIGH';
//       } else {
//         severityLevel = 'MEDIUM';
//       }
//     }

//     const payload = {
//       twinId: twin.id,
//       triggeringSystem: system,
//       labCode,
//       labValue,
//       totalInteractions,
//       severityLevel,
//       interactionsDetail: holonInteractions,
//       evaluatedAt: new Date().toISOString(),
//     };

//     // 4. Persistent PostgreSQL Audit Logging via TypeORM
//     if (alertTriggered) {
//       try {
//         const incident = this.incidentRepo.create({
//           twinId: twin.id,
//           system,
//           labCode,
//           labValue,
//           severity: severityLevel,
//           payload: JSON.stringify(payload),
//           createdAt: new Date(),
//         }); 
        
//         await this.incidentRepo.save(incident);
//         this.logger.log(`[PostgreSQL] Incident audit record written successfully for Twin ID: ${twin.id}`);
//       } catch (dbError: any) {
//         this.logger.error(`Failed to write incident audit to PostgreSQL: ${dbError.message}`);
//       }
//     }

//     return {
//       alertTriggered,
//       payload,
//     };
//   }
// }

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
    // 🚀 Keep the raw event inspector log
    console.log('RAW LAB EVENT PAYLOAD:', JSON.stringify(event, null, 2));

    const labData = event.data || {};
    const labCode: string = labData.code || '2823-3';
    const labValue: number = parseFloat(labData.value) || 0;
    const system: string = event.system || labData.system || 'cardiovascular';

    this.logger.log(`Evaluating lab result [LOINC: ${labCode}, Value: ${labValue}] for Twin ID: ${twin.id}`);

    // 1. Dynamic Clinical Reference Threshold Dictionary
    const LAB_THRESHOLDS: Record<string, { name: string; high: number; critical: number }> = {
      '2823-3': { name: 'Potassium', high: 5.5, critical: 6.0 },   // mEq/L
      '2951-2': { name: 'Sodium', high: 145, critical: 155 },      // mEq/L
      '2160-0': { name: 'Creatinine', high: 1.5, critical: 2.5 },  // mg/dL
      '2345-7': { name: 'Glucose', high: 250, critical: 400 },     // mg/dL
    };

    // 2. Fetch active medication events strictly from the Digital Twin (Read-Only)
    let activeMedicationCodes: number[] = [];
    
    try {
      const twinEvents: any[] = await twin.events.list();
      const medEvents = twinEvents.filter((e: any) => e.eventType === 'medication');

      activeMedicationCodes = medEvents
        .map((e: any) => parseInt(e.data?.rxNorm, 10))
        .filter((code: number) => !isNaN(code));
        
      this.logger.log(`Live Twin Regimen extracted: [${activeMedicationCodes.join(', ')}]`);
    } catch (e: any) {
      this.logger.error(`Failed to fetch twin event history: ${e.message}`);
    }

    // 3. Query HOLON API for live Drug-Drug Interactions (DDIs) across active regimen
    let totalInteractions = 0;
    let holonInteractions: any[] = [];

    try {
      if (activeMedicationCodes.length > 1) {
        const ddiCheck: any = await this.ontomorphService.dtp.holon.interactions.checkList(activeMedicationCodes);
        totalInteractions = ddiCheck.totalInteractions || 0;
        holonInteractions = ddiCheck.pairs || ddiCheck.interactions || []; 
        this.logger.log(`HOLON Screening Complete: ${totalInteractions} interaction(s) detected.`);
      } else {
        this.logger.log(`HOLON Screening Skipped: Patient is on ${activeMedicationCodes.length} medication(s). No DDI possible.`);
      }
    } catch (error: any) {
      this.logger.error(`HOLON DDI Lookup Failed: ${error.message}. Proceeding with metabolic threshold check.`);
    }

    // 4. Dynamic Rule Evaluation (Dictionary Lookup + Weighting)
    const thresholdRule = LAB_THRESHOLDS[labCode];
    let isCriticalLabValue = false;
    let labSeverityWeight = 0; // 0 = Normal, 1 = High, 2 = Critical

    if (thresholdRule) {
      if (labValue >= thresholdRule.critical) {
        isCriticalLabValue = true;
        labSeverityWeight = 2;
      } else if (labValue >= thresholdRule.high) {
        isCriticalLabValue = true;
        labSeverityWeight = 1;
      }
    }

    const alertTriggered = totalInteractions > 0 || isCriticalLabValue;
    let severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (alertTriggered) {
      if (labSeverityWeight === 2 || totalInteractions >= 2) {
        severityLevel = 'CRITICAL';
      } else if (labSeverityWeight === 1 || totalInteractions === 1) {
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

    // 5. Persistent PostgreSQL Audit Logging via TypeORM
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