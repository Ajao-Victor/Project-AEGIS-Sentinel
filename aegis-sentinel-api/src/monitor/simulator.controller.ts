import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
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

    // 1. Capture the result directly from the Rules Engine
    const engineResult = await this.rulesEngine.processLabEvent(twin, simulatedEvent);

    // 2. Return both the ingestion status AND the engine's result to the frontend
    return { 
      status: 'Ingested', 
      event: simulatedEvent,
      ...engineResult // This spreads { alertTriggered: true/false, payload: {...} } into the response
    };
  }
}