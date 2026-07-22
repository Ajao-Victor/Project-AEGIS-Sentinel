import { Module } from '@nestjs/common';
import { AegisMonitorService } from './aegis-monitor.service';
import { RulesEngineService } from './rules-engine.service';
import { SimulatorController } from './simulator.controller';
import { OntomorphModule } from '../ontomorph/ontomorph.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [OntomorphModule, IncidentsModule],
  providers: [AegisMonitorService, RulesEngineService],
  controllers: [SimulatorController],
})
export class MonitorModule {}