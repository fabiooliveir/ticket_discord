import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardWebController } from './dashboard-web.controller';
import { DashboardRedirectController } from './dashboard-redirect.controller';
import { Ticket } from '../../database/entities/ticket.entity';
import { SlaConfig } from '../../database/entities/sla-config.entity';
import { SlaModule } from '../sla/sla.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, SlaConfig]),
    SlaModule,
  ],
  controllers: [DashboardController, DashboardRedirectController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
