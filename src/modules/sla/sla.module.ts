import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { Ticket } from '../../database/entities/ticket.entity';
import { SlaConfig } from '../../database/entities/sla-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, SlaConfig])],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
