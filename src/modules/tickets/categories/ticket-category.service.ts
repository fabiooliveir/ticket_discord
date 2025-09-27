import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../../database/entities/ticket.entity';
import {
  TicketCategory,
  CategoryTicketData,
} from './ticket-category.interface';

@Injectable()
export class TicketCategoryService {
  private readonly logger = new Logger(TicketCategoryService.name);
  private categories: Map<string, TicketCategory> = new Map();

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    // Categoria: Correção de Tagueamento
    const correctionTagging: TicketCategory = {
      id: 'correction-tagging',
      name: 'Correção de Tagueamento',
      description: 'Tickets para correção de problemas de tagueamento',
      team: 'suporte',
      priority: 'medium',
      requiresClient: true,
      formFields: [
        {
          id: 'website',
          label: 'Site que precisa de correção',
          type: 'text',
          required: true,
          placeholder: 'https://exemplo.com',
        },
        {
          id: 'problemDescription',
          label: 'Descrição do problema',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva detalhadamente o problema de tagueamento...',
        },
        {
          id: 'additionalInfo',
          label: 'Informações adicionais (opcional)',
          type: 'textarea',
          required: false,
          placeholder: 'Qualquer informação adicional relevante...',
        },
        {
          id: 'team',
          label: 'Time responsável',
          type: 'select',
          required: true,
          options: [
            { label: 'Suporte Técnico', value: 'suporte' },
            { label: 'Customer Success', value: 'cs' },
            { label: 'Tráfego Pago', value: 'trafico' },
          ],
        },
        {
          id: 'priority',
          label: 'Prioridade',
          type: 'select',
          required: true,
          options: [
            { label: '🔴 Alta', value: 'high' },
            { label: '🟡 Média', value: 'medium' },
            { label: '🟢 Baixa', value: 'low' },
          ],
        },
      ],
    };

    this.categories.set('correction-tagging', correctionTagging);
    this.logger.log(`Categoria 'correction-tagging' inicializada`);
  }

  getCategory(categoryId: string): TicketCategory | null {
    return this.categories.get(categoryId) || null;
  }

  getAllCategories(): TicketCategory[] {
    return Array.from(this.categories.values());
  }

  async createTicketWithCategory(
    categoryId: string,
    data: CategoryTicketData,
    discordUserId: string,
    discordChannelId?: string,
  ): Promise<Ticket> {
    const category = this.getCategory(categoryId);
    if (!category) {
      throw new Error(`Categoria '${categoryId}' não encontrada`);
    }

    // Validar se categoria requer cliente
    if (category.requiresClient && !data.clientId) {
      throw new Error(`Categoria '${categoryId}' requer seleção de cliente`);
    }

    const ticket = this.ticketRepository.create({
      title: `${category.name} - ${data.clientName || 'Cliente'}`,
      description: this.buildDescription(categoryId, data),
      status: 'open',
      priority: data.priority || category.priority,
      discordUserId,
      discordChannelId,
      clientId: data.clientId,
      categoryId,
      website: data.website,
      metadata: {
        createdBy: 'Discord User',
        createdAt: new Date().toISOString(),
        assignedTeam: data.team || category.team,
        category: categoryId,
        categoryData: data,
      },
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    this.logger.log(
      `Ticket ${savedTicket.id} criado com categoria '${categoryId}'`,
    );

    return savedTicket;
  }

  private buildDescription(
    categoryId: string,
    data: CategoryTicketData,
  ): string {
    switch (categoryId) {
      case 'correction-tagging':
        return this.buildCorrectionTaggingDescription(data);
      default:
        return `Ticket da categoria ${categoryId}`;
    }
  }

  private buildCorrectionTaggingDescription(data: CategoryTicketData): string {
    let description = `**Cliente:** ${data.clientName}\n`;
    description += `**Site:** ${data.website}\n`;
    description += `**Problema:** ${data.problemDescription}\n`;

    if (data.additionalInfo) {
      description += `**Informações adicionais:** ${data.additionalInfo}\n`;
    }

    description += `**Time responsável:** ${data.team}\n`;
    description += `**Prioridade:** ${data.priority}`;

    return description;
  }
}
