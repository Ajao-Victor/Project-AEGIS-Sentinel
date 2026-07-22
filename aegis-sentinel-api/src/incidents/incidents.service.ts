import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  async logIncident(data: Partial<Incident>): Promise<Incident> {
    const incident = this.incidentRepository.create(data);
    return await this.incidentRepository.save(incident);
  }

  async getIncidentsByTwin(twinId: string): Promise<Incident[]> {
    return this.incidentRepository.find({
      where: { twinId },
      order: { createdAt: 'DESC' },
    });
  }
}