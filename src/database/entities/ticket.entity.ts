import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TaskType } from '../../shared/enums/task-type.enum';
import { TicketMessage } from './ticket-message.interface';

@Entity('tickets')
export class Ticket extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'varchar', length: 100 })
  priority: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.LEADFY,
  })
  type: TaskType;

  @Column({ type: 'varchar', length: 255 })
  discordUserId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  discordChannelId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoryId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'json', nullable: true })
  categoryData: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  messages: TicketMessage[];

  // Campos para SLA (Service Level Agreement)
  @Column({ type: 'timestamp', nullable: true })
  firstResponseAt: Date;

  @Column({ type: 'boolean', default: false })
  firstResponseCaptured: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'int', nullable: true })
  responseTimeMinutes: number;

  @Column({ type: 'int', nullable: true })
  resolutionTimeMinutes: number;

  // Campos para SLA de Duração Total (criação até arquivamento)
  @Column({ type: 'int', nullable: true })
  durationTimeMinutes: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  durationSlaStatus: string;

  @Column({ type: 'varchar', length: 50, default: 'business_hours' })
  slaCategory: string;
}
