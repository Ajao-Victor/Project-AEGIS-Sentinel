import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AegisMonitorService } from './aegis-monitor.service';
import { RulesEngineService } from './rules-engine.service';

@Controller('simulate')
export class SimulatorController {
  constructor(
    private monitorService: AegisMonitorService,
    private rulesEngine: RulesEngineService,
  ) {}

  @Post('lab')
  async simulateLabResult(@Body() mockLabData: { system: string, code: string, value: string, unit: string }) {
    const twin = this.monitorService.getActiveTwin();
    
    if (!twin) {
      throw new HttpException('Aegis is not connected to a twin', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const simulatedEvent = {
      eventType: 'lab_result',
      system: mockLabData.system || 'cardiovascular',
      data: mockLabData,
      timestamp: new Date().toISOString(),
    };

    // Strictly processes the incoming lab event against the live read-only twin
    const engineResult = await this.rulesEngine.processLabEvent(twin, simulatedEvent);

    return { 
      status: 'Ingested', 
      event: simulatedEvent,
      ...engineResult 
    };
  }

  @Get('status')
  async getSystemStatus() {
    const twin = this.monitorService.getActiveTwin();
    if (!twin) {
      return { connected: false, twinId: null, medications: [] };
    }

    let medications: any[] = [];
    
    try {
      if (twin.events && typeof twin.events.list === 'function') {
        const events = await twin.events.list();
        const medEvents = events.filter((e: any) => e.eventType === 'medication');
        
        medications = medEvents.map((e: any) => ({
          code: e.data?.rxNorm || 'Unknown',
          name: e.title || 'Unnamed Rx'
        }));
      }
    } catch (e: any) {
      console.error('[Controller] Ontomorph SDK Error:', e.message);
    }

    return {
      connected: true,
      twinId: twin.id,
      authMode: 'OAuth2 Live Synchronized',
      medications, // Pure, live data straight from Ontomorph
    };
  }
}