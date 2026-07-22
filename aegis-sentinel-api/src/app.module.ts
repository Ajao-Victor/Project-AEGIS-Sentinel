import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OntomorphModule } from './ontomorph/ontomorph.module';
import { MonitorModule } from './monitor/monitor.module';
import { IncidentsModule } from './incidents/incidents.module';
import { Incident } from './incidents/incident.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [Incident],
        synchronize: true, // Use only in dev/hackathon!
      }),
    }),
    OntomorphModule,
    MonitorModule,
    IncidentsModule,
  ],
})
export class AppModule {}