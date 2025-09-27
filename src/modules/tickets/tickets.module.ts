import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from '../../database/entities/ticket.entity';
import { LeadfyModule } from '../leadfy/leadfy.module';
import { TicketCategoryService } from './categories/ticket-category.service';
import { CorrectionTaggingService } from './categories/correction-tagging/correction-tagging.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), forwardRef(() => LeadfyModule)],
  providers: [TicketsService, TicketCategoryService, CorrectionTaggingService],
  controllers: [TicketsController],
  exports: [TicketsService, TicketCategoryService, CorrectionTaggingService],
})
export class TicketsModule {}
