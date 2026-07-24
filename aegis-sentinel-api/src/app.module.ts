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
      useFactory: (config: ConfigService) => {
        // 1. Check if we are in production (Render provides this URL)
        const databaseUrl = config.get<string>('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [Incident],
            synchronize: true, // Automatically creates tables for the hackathon
            ssl: {
              rejectUnauthorized: false, // Required for Render PostgreSQL connections
            },
          };
        }

        // 2. Fallback to local variables for your development environment
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST') || 'localhost',
          port: config.get<number>('DB_PORT') || 5432,
          username: config.get<string>('DB_USER') || 'postgres',
          password: config.get<string>('DB_PASS') || 'postgres',
          database: config.get<string>('DB_NAME') || 'aegis',
          entities: [Incident],
          synchronize: true,
        };
      },
    }),
    OntomorphModule,
    MonitorModule,
    IncidentsModule,
  ],
})
export class AppModule {}