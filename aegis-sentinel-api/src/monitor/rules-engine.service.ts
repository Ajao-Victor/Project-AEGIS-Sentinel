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
    const LAB_THRESHOLDS: Record<string, { name: string; high: number; critical: number; unit?: string }> = {
      // --- Electrolytes & Renal ---
      '2823-3': { name: 'Potassium', high: 5.5, critical: 6.0, unit: 'mEq/L' },
      '2951-2': { name: 'Sodium', high: 145, critical: 155, unit: 'mEq/L' },
      '3094-0': { name: 'BUN (Blood Urea Nitrogen)', high: 20, critical: 40, unit: 'mg/dL' },
      '2160-0': { name: 'Creatinine', high: 1.5, critical: 2.5, unit: 'mg/dL' },
      '2069-3': { name: 'Chloride', high: 108, critical: 115, unit: 'mEq/L' },
      '2028-9': { name: 'Carbon Dioxide (CO2)', high: 32, critical: 40, unit: 'mEq/L' },

      // --- Metabolic & Endocrinology ---
      '2345-7': { name: 'Glucose (Random/Fasting)', high: 200, critical: 400, unit: 'mg/dL' },
      '4548-4': { name: 'HbA1c', high: 6.5, critical: 9.0, unit: '%' },
      '17861-6': { name: 'Calcium', high: 10.5, critical: 12.0, unit: 'mg/dL' },
      '2777-1': { name: 'Phosphate', high: 4.5, critical: 6.0, unit: 'mg/dL' },
      '2913-2': { name: 'Magnesium', high: 2.4, critical: 3.0, unit: 'mg/dL' },

      // --- Cardiac Biomarkers ---
      '33762-6': { name: 'Troponin I', high: 0.04, critical: 0.1, unit: 'ng/mL' },
      '10839-9': { name: 'Troponin T', high: 0.01, critical: 0.05, unit: 'ng/mL' },
      '3016-3': { name: 'BNP (B-type Natriuretic Peptide)', high: 100, critical: 400, unit: 'pg/mL' },
      '42637-9': { name: 'NT-proBNP', high: 450, critical: 1800, unit: 'pg/mL' },

      // --- Liver Function Tests (LFTs) & Hepatic ---
      '1742-6': { name: 'ALT (Alanine Aminotransferase)', high: 55, critical: 200, unit: 'U/L' },
      '1920-8': { name: 'AST (Aspartate Aminotransferase)', high: 48, critical: 200, unit: 'U/L' },
      '6768-6': { name: 'Alkaline Phosphatase (ALP)', high: 140, critical: 300, unit: 'U/L' },
      '1975-2': { name: 'Bilirubin (Total)', high: 1.2, critical: 3.0, unit: 'mg/dL' },
      '1751-7': { name: 'Albumin', high: 5.0, critical: 5.5, unit: 'g/dL' },

      // --- Hematology & Coagulation ---
      '718-7': { name: 'Hemoglobin', high: 17.5, critical: 20.0, unit: 'g/dL' },
      '4544-3': { name: 'Hematocrit', high: 50, critical: 60, unit: '%' },
      '789-8': { name: 'Erythrocytes (RBC)', high: 6.0, critical: 7.0, unit: '10*6/uL' },
      '6690-2': { name: 'Leukocytes (WBC)', high: 11.0, critical: 20.0, unit: '10*3/uL' },
      '777-3': { name: 'Platelets', high: 450, critical: 600, unit: '10*3/uL' },
      '5902-2': { name: 'Prothrombin Time (PT)', high: 13.5, critical: 20.0, unit: 's' },
      '6301-6': { name: 'INR', high: 1.2, critical: 3.5, unit: 'ratio' },

      // --- Inflammatory Markers ---
      '1988-5': { name: 'C-Reactive Protein (CRP)', high: 3.0, critical: 10.0, unit: 'mg/L' },
      '30525-0': { name: 'C-Reactive Protein (High Sensitivity)', high: 3.0, critical: 10.0, unit: 'mg/L' },
      '30341-3': { name: 'Erythrocyte Sedimentation Rate (ESR)', high: 20, critical: 50, unit: 'mm/h' },
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