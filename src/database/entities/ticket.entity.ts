import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

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
}
