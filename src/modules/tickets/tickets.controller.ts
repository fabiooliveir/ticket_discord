import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketCategoryService } from './categories/ticket-category.service';
import { Ticket } from '../../database/entities/ticket.entity';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly ticketCategoryService: TicketCategoryService,
  ) {}

  @Post()
  create(
    @Body()
    createTicketDto: {
      title: string;
      description?: string;
      discordUserId: string;
      discordChannelId?: string;
      priority?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.ticketsService.createTicket(createTicketDto);
  }

  @Get('stats')
  getStats() {
    return this.ticketsService.getTicketStats();
  }

  @Get('categories')
  getCategories() {
    return this.ticketCategoryService.getAllCategories();
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('clientId') clientId?: string,
  ) {
    if (userId) {
      return this.ticketsService.findByUser(userId);
    }
    if (clientId) {
      return this.ticketsService.findByClient(clientId);
    }
    return this.ticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: Partial<Ticket>) {
    return this.ticketsService.updateTicket(id, updateTicketDto);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Body('closedBy') closedBy?: string) {
    return this.ticketsService.closeTicket(id, closedBy);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.deleteTicket(id);
  }
}
