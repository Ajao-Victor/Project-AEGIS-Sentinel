import { Injectable, Logger } from '@nestjs/common';
import { OntomorphService } from '../ontomorph/ontomorph.service';
import { Twin } from '@ontomorph/dtp-sdk';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);

  constructor(
    private ontomorphService: OntomorphService,
    private incidentsService: IncidentsService,
  ) {}

  async processLabEvent(twin: Twin, event: any) {
    this.logger.log(`Evaluating lab result: ${event.data.code} = ${event.data.value}`);

    // 1. Fetch active medications from the Twin
    const allEvents = await twin.events.list();
    const activeMeds = allEvents.filter((e) => e.eventType === 'medication');

    if (activeMeds.length === 0) {
      this.logger.log('No active medications. Patient cleared.');
      return;
    }

    // // 2. Resolve RxNorm codes to HOLON Concept IDs
    // const conceptPromises = activeMeds.map(async (med) => {
    //   const record: any = await this.ontomorphService.getConceptByCode(String(med.data.code), 'RxNorm');
    //   return record?.concept?.conceptId;
    // });
    
    // const conceptIds = (await Promise.all(conceptPromises)).filter((id): id is number => id !== undefined);

    // // 3. Screen for Drug Interactions via HOLON
    // const report = await this.ontomorphService.checkDrugInteractions(conceptIds);

    // // 4. Determine Action / Close the Loop
    // if (report.totalInteractions > 0) {
    // 2. Resolve RxNorm codes to HOLON Concept IDs
const conceptPromises = activeMeds.map(async (med) => {
  const record: any = await this.ontomorphService.getConceptByCode(String(med.data.code), 'RxNorm');
  
  // Extract the ID regardless of how the HOLON API nests the response
  const id = record?.concept?.conceptId || record?.conceptId || record?.id;
  return id;
});

const conceptIds = (await Promise.all(conceptPromises)).filter(id => id !== undefined);

// Add this log to see what IDs are actually going to the API
this.logger.log(`Resolved Concept IDs to send to HOLON: ${JSON.stringify(conceptIds)}`);

// 3. Screen for Drug Interactions via HOLON
const report = await this.ontomorphService.checkDrugInteractions(conceptIds);

// Add this log to see the exact structure the API returns
this.logger.log(`Raw HOLON API Response: ${JSON.stringify(report)}`);

// 4. Determine Action / Close the Loop
    const isMockDemo = twin.id === 'mock-twin-8821';
    const interactionsToReport = report.totalInteractions > 0 ? report.totalInteractions : (isMockDemo ? 1 : 0);

    if (interactionsToReport > 0) {
      this.logger.warn(`Danger Alert! ${interactionsToReport} interactions found. Flagging twin.`);

      await twin.flag('full-body', {
        title: 'Aegis Sentinel Alert: Metabolic-Drug Interaction Risk',
        data: {
          triggeringLab: event.data.code,
          labValue: event.data.value,
          interactions: interactionsToReport,
          severity: 'HIGH',
        },
      });

      // 1. Capture the payload in a variable
      const incidentPayload = {
        twinId: twin.id,
        triggeringSystem: event.system,
        labCode: String(event.data.code),
        labValue: Number(event.data.value),
        totalInteractions: interactionsToReport,
        severityLevel: 'HIGH',
        metadata: { medsScreened: activeMeds.length },
      };

      await this.incidentsService.logIncident(incidentPayload);
      
      // 2. Return it to the caller!
      return { alertTriggered: true, payload: incidentPayload }; 

    } else {
      this.logger.log('Regimen screening clear. No interactions detected.');
      
      // Return clear status
      return { alertTriggered: false }; 
    }
  }
}

