// import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { OntomorphService } from '../ontomorph/ontomorph.service';
// import { RulesEngineService } from './rules-engine.service';
// import { Twin } from '@ontomorph/dtp-sdk';

// @Injectable()
// export class AegisMonitorService implements OnApplicationBootstrap {
//   private readonly logger = new Logger(AegisMonitorService.name);
//   private activeTwin: Twin | null = null;

//   constructor(
//     private configService: ConfigService,
//     private ontomorphService: OntomorphService,
//     private rulesEngine: RulesEngineService,
//   ) {}

//   async onApplicationBootstrap() {
//     const grantToken = this.configService.get<string>('PATIENT_GRANT_TOKEN');

//     if (!grantToken) {
//       this.logger.warn('No PATIENT_GRANT_TOKEN found in .env. Falling back to local mock twin mode.');
//       this.initializeMockTwin();
//       return;
//     }

//     try {
//       this.activeTwin = await this.ontomorphService.dtp.twins.connect(grantToken);
//       this.logger.log(`Aegis attached to Digital Twin: ${this.activeTwin.id}`);

//       this.subscribeToStream('cardiovascular');
//       this.subscribeToStream('endocrine');
//     } catch (error: any) {
//       this.logger.error(`Failed to attach to digital twin: ${error.message}`);
//       this.logger.warn('Initializing offline mock twin for local simulator testing...');
//       this.initializeMockTwin();
//     }
//   }


// private initializeMockTwin() {
//     this.activeTwin = {
//       id: 'mock-twin-8821',
//       events: {
//       list: async () => [
//           // Universal RxNorm codes for Warfarin and Ibuprofen
//           { eventType: 'medication', data: { code: '11289', name: 'Warfarin' } },
//           { eventType: 'medication', data: { code: '5640', name: 'Ibuprofen' } },
//         ],
//         stream: () => ({ stop: () => {} }),
//       },
//       flag: async (system: string, payload: any) => {
//         this.logger.log(`[TWIN WRITE-BACK] Flag written to ${system}: \n${JSON.stringify(payload, null, 2)}`);
//       },
//     } as unknown as Twin;

//     this.logger.log('Mock Twin initialized with active medication regimen (Sildenafil + Nitroglycerin).');
//   }

//   private subscribeToStream(system: 'cardiovascular' | 'endocrine') {
//     if (!this.activeTwin) return;
//     const twin = this.activeTwin;

//     twin.events.stream({ system }, async (event) => {
//       if (event.eventType === 'lab_result') {
//         await this.rulesEngine.processLabEvent(twin, event);
//       }
//     });
//   }

//   public getActiveTwin(): Twin | null {
//     return this.activeTwin;
//   }
// }

import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OntomorphService } from '../ontomorph/ontomorph.service';
import { RulesEngineService } from './rules-engine.service';
import { Twin } from '@ontomorph/dtp-sdk';

@Injectable()
export class AegisMonitorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AegisMonitorService.name);
  private activeTwin: Twin | null = null;

  constructor(
    private configService: ConfigService,
    private ontomorphService: OntomorphService,
    private rulesEngine: RulesEngineService,
  ) {}

  async onApplicationBootstrap() {
    const grantToken = this.configService.get<string>('PATIENT_GRANT_TOKEN');

    if (!grantToken) {
      this.logger.error('CRITICAL: No PATIENT_GRANT_TOKEN found in .env! Live mode requires a valid token.');
      throw new Error('PATIENT_GRANT_TOKEN is missing in environment variables.');
    }

    try {
      // Establish secure OAuth2/Grant connection to the live DTP network
      this.activeTwin = await this.ontomorphService.dtp.twins.connect(grantToken);
      this.logger.log(`Aegis successfully attached to Live Digital Twin: ${this.activeTwin.id}`);

      this.subscribeToStream('cardiovascular');
      this.subscribeToStream('endocrine');
    } catch (error: any) {
      this.logger.error(`Failed to attach to live digital twin: ${error.message}`);
      throw error; // Fail fast in live production mode so you know immediately if credentials are invalid
    }
  }

  private subscribeToStream(system: 'cardiovascular' | 'endocrine') {
    if (!this.activeTwin) return;
    const twin = this.activeTwin;

    // Listen to real-time telemetry streams from the live twin
    twin.events.stream({ system }, async (event) => {
      if (event.eventType === 'lab_result') {
        await this.rulesEngine.processLabEvent(twin, event);
      }
    });
  }

  public getActiveTwin(): Twin | null {
    return this.activeTwin;
  }
}