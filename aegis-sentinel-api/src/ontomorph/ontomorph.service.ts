import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DTP } from '@ontomorph/dtp-sdk';

@Injectable()
export class OntomorphService implements OnModuleInit {
  public dtp!: DTP;
  private readonly logger = new Logger(OntomorphService.name);

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  onModuleInit() {
    this.dtp = new DTP({
      apiKey: this.configService.getOrThrow<string>('DTP_KEY'),
      holonApiUrl: this.configService.get<string>('HOLON_API_URL', 'https://holon-api.ontomorph.com'),
      holonApiKey: this.configService.getOrThrow<string>('HOLON_KEY'),
    });
    this.logger.log('Ontomorph DTP Client initialized.');
  }

  async getConceptByCode(code: string, vocabulary: string): Promise<any> {
    const cacheKey = `concept:${vocabulary}:${code}`;
    const cachedConcept = await this.cacheManager.get(cacheKey);
    
    if (cachedConcept) return cachedConcept;

    try {
      const concept = await this.dtp.holon.concepts.getByCode(code, vocabulary);
      await this.cacheManager.set(cacheKey, concept, 86400000); // 24hr cache
      return concept;
    } catch (error: any) {
      this.logger.error(`Failed to resolve code ${code} in ${vocabulary}`, error.message);
      return null;
    }
  }

  async checkDrugInteractions(conceptIds: number[]): Promise<any> {
    if (!conceptIds || conceptIds.length === 0) return { totalInteractions: 0 };

    const sortedIds = [...conceptIds].sort().join(',');
    const cacheKey = `interactions:${sortedIds}`;

    const cachedReport = await this.cacheManager.get<any>(cacheKey);
    if (cachedReport) return cachedReport;

    const report = await this.dtp.holon.interactions.checkList(conceptIds);
    await this.cacheManager.set(cacheKey, report, 86400000);
    return report;
  }
}