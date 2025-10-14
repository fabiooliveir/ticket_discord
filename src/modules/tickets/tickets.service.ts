import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../database/entities/ticket.entity';
import { LeadfyService } from '../leadfy/leadfy.service';
import { CreateC7AutoTaskDto } from './dto/create-c7auto-task.dto';
import { TaskType } from '../../shared/enums/task-type.enum';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @Inject(forwardRef(() => LeadfyService))
    private readonly leadfyService: LeadfyService,
  ) {}

  async createTicket(createTicketDto: {
    title: string;
    description?: string;
    discordUserId: string;
    discordChannelId?: string;
    priority?: string;
    clientId?: string;
    metadata?: Record<string, any>;
  }): Promise<Ticket> {
    // Validar cliente se fornecido
    if (createTicketDto.clientId) {
      const isValidClient = await this.leadfyService.validateClient(
        createTicketDto.clientId,
      );
      if (!isValidClient) {
        throw new Error(
          `Cliente ${createTicketDto.clientId} não encontrado na Leadfy`,
        );
      }
    }

    const ticket = this.ticketRepository.create({
      title: createTicketDto.title,
      description: createTicketDto.description,
      status: 'open',
      priority: createTicketDto.priority || 'medium',
      discordUserId: createTicketDto.discordUserId,
      discordChannelId: createTicketDto.discordChannelId,
      clientId: createTicketDto.clientId,
      metadata: createTicketDto.metadata,
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    this.logger.log(
      `Ticket ${savedTicket.id} criado por ${createTicketDto.discordUserId}`,
    );

    return savedTicket;
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(discordUserId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { discordUserId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({ where: { id } });
  }

  async updateTicket(
    id: string,
    updateData: Partial<Ticket>,
  ): Promise<Ticket | null> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) return null;

    Object.assign(ticket, updateData);
    return this.ticketRepository.save(ticket);
  }

  async closeTicket(id: string, closedBy?: string): Promise<Ticket | null> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) return null;

    ticket.status = 'closed';
    ticket.metadata = {
      ...ticket.metadata,
      closedBy,
      closedAt: new Date().toISOString(),
    };

    return this.ticketRepository.save(ticket);
  }

  async getTicketStats(): Promise<{
    total: number;
    open: number;
    closed: number;
    byPriority: Record<string, number>;
  }> {
    const tickets = await this.ticketRepository.find();

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
      byPriority: {
        high: tickets.filter((t) => t.priority === 'high').length,
        medium: tickets.filter((t) => t.priority === 'medium').length,
        low: tickets.filter((t) => t.priority === 'low').length,
      },
    };

    return stats;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = await this.ticketRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async createC7AutoTask(
    createC7AutoTaskDto: CreateC7AutoTaskDto,
    discordUserId: string,
    discordChannelId?: string,
    authorTag?: string,
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      title: createC7AutoTaskDto.title,
      description: createC7AutoTaskDto.description,
      status: 'open',
      priority: 'medium',
      type: TaskType.C7_AUTO,
      categoryId: 'c7-auto', // ADICIONAR: categoria padrão
      discordUserId,
      discordChannelId,
      metadata: {
        clientName: createC7AutoTaskDto.clientName,
        category: 'C7 Auto', // ADICIONAR: nome da categoria para exibição
        createdVia: 'c7_auto_command',
        authorTag: authorTag || discordUserId,
        formData: { // ADICIONAR: dados do formulário estruturados
          title: createC7AutoTaskDto.title,
          clientName: createC7AutoTaskDto.clientName,
          description: createC7AutoTaskDto.description,
        },
      },
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    this.logger.log(
      `Ticket C7 Auto ${savedTicket.id} criado por ${discordUserId}`,
    );

    return savedTicket;
  }
}
