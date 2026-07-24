// import { Module } from '@nestjs/common';
// import { AegisMonitorService } from './aegis-monitor.service';
// import { RulesEngineService } from './rules-engine.service';
// import { SimulatorController } from './simulator.controller';
// import { OntomorphModule } from '../ontomorph/ontomorph.module';
// import { IncidentsModule } from '../incidents/incidents.module';

// @Module({
//   imports: [OntomorphModule, IncidentsModule],
//   providers: [AegisMonitorService, RulesEngineService],
//   controllers: [SimulatorController],
// })
// export class MonitorModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { SimulatorController } from './simulator.controller';
import { AegisMonitorService } from './aegis-monitor.service';
import { RulesEngineService } from './rules-engine.service';
import { OntomorphService } from '../ontomorph/ontomorph.service'; 
import { Incident } from '../incidents/incident.entity'; // 

@Module({
  imports: [
   
    TypeOrmModule.forFeature([Incident]) 
  ],
  controllers: [SimulatorController],
  providers: [
    AegisMonitorService, 
    RulesEngineService, 
    OntomorphService
  ],
})
export class MonitorModule {}