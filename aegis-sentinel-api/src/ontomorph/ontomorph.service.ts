// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { DTP } from '@ontomorph/dtp-sdk';

// @Injectable()
// export class OntomorphService {
//   public readonly dtp: DTP;
//   private readonly logger = new Logger(OntomorphService.name);

// constructor(private configService: ConfigService) {
//     const dtpApiKey = this.configService.get<string>('DTP_API_KEY');
//     const holonApiKey = this.configService.get<string>('HOLON_API_KEY');

//     if (!dtpApiKey || !holonApiKey) {
//       this.logger.error('Missing DTP_API_KEY or HOLON_API_KEY in environment variables.');
//       throw new Error('API keys are missing. Server cannot start.'); // FIX 3: This guarantees to TS that the keys exist below this line
//     }

//     // Initialize the SDK exactly as defined in the official documentation
//     this.dtp = new DTP({
//       apiKey: dtpApiKey,
//       baseUrl: 'https://sandbox-api.ontomorph.com', 
//       holonApiUrl: 'https://holon.ontomorph.com',   
//       holonApiKey: holonApiKey,
//       timeout: 30000,
//     });

//     this.logger.log('Ontomorph DTP Client Initialized (Sandbox Environment)');
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DTP } from '@ontomorph/dtp-sdk';

@Injectable()
export class OntomorphService {
  public readonly dtp: DTP;
  private readonly logger = new Logger(OntomorphService.name);

  constructor(private configService: ConfigService) {
    const dtpApiKey = this.configService.get<string>('DTP_API_KEY');
    const holonApiKey = this.configService.get<string>('HOLON_API_KEY');

    // This guarantees to TypeScript that the keys are strings, fixing the TS error
    if (!dtpApiKey || !holonApiKey) {
      this.logger.error('Missing DTP_API_KEY or HOLON_API_KEY in environment variables.');
      throw new Error('API keys are missing. Server cannot start.'); 
    }

    // Initialize the SDK with the exact URL from the official documentation
    this.dtp = new DTP({
      apiKey: dtpApiKey,
      baseUrl: 'https://sandbox-api.ontomorph.com', 
      holonApiUrl: 'https://holon-api.ontomorph.com', // 🚀 THE FIX: The correct URL from their docs
      holonApiKey: holonApiKey,
      timeout: 30000,
    });

    this.logger.log('Ontomorph DTP Client Initialized (Sandbox Environment)');
  }
}