import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('sla_configs')
export class SlaConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  priority: string;

  @Column({ type: 'int' })
  responseTimeTarget: number; // em minutos

  @Column({ type: 'int' })
  resolutionTimeTarget: number; // em minutos

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;
}
