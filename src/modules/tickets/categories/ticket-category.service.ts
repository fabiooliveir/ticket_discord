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

    // Categoria: Novo Tagueamento
    const newTagging: TicketCategory = {
      id: 'new-tagging',
      name: 'Novo Tagueamento',
      description: 'Tickets para configuração de novos sistemas de tagueamento',
      team: 'trafico',
      priority: 'medium',
      requiresClient: true,
      formFields: [
        {
          id: 'metaAccountId',
          label: 'ID de Conta Meta',
          type: 'text',
          required: true,
          placeholder: 'Ex: 123456789',
        },
        {
          id: 'googleAdsAccountId',
          label: 'ID de Conta Google Ads',
          type: 'text',
          required: true,
          placeholder: 'Ex: 123-456-7890',
        },
        {
          id: 'facebookPixelId',
          label: 'ID de Pixel Facebook',
          type: 'text',
          required: true,
          placeholder: 'Ex: 123456789012345',
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

    // Categoria: Ajuste de Verba
    const budgetAdjustment: TicketCategory = {
      id: 'budget-adjustment',
      name: 'Ajuste de Verba',
      description: 'Tickets para solicitação de ajustes de verba em campanhas',
      team: 'trafico',
      priority: 'medium',
      requiresClient: true,
      formFields: [
        {
          id: 'adjustmentReason',
          label: 'Motivo do Ajuste',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva detalhadamente o motivo do ajuste de verba...',
        },
        {
          id: 'requestedAmount',
          label: 'Valor Solicitado',
          type: 'text',
          required: true,
          placeholder: 'Ex: R$ 1.500,00 ou 15% ou 1500 reais',
        },
        {
          id: 'campaignInfo',
          label: 'Informações da Campanha (opcional)',
          type: 'textarea',
          required: false,
          placeholder: 'ID da campanha, período, plataforma, etc...',
        },
      ],
    };

    this.categories.set('correction-tagging', correctionTagging);
    this.categories.set('new-tagging', newTagging);
    this.categories.set('budget-adjustment', budgetAdjustment);
    this.logger.log(`Categoria 'correction-tagging' inicializada`);
    this.logger.log(`Categoria 'new-tagging' inicializada`);
    this.logger.log(`Categoria 'budget-adjustment' inicializada`);
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
      case 'new-tagging':
        return this.buildNewTaggingDescription(data);
      case 'budget-adjustment':
        return this.buildBudgetAdjustmentDescription(data);
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

  private buildNewTaggingDescription(data: CategoryTicketData): string {
    let description = `**Cliente:** ${data.clientName}\n`;
    description += `**Meta Account ID:** ${data.metaAccountId}\n`;
    description += `**Google Ads ID:** ${data.googleAdsAccountId}\n`;
    description += `**Facebook Pixel ID:** ${data.facebookPixelId}\n`;

    if (data.additionalInfo) {
      description += `**Informações adicionais:** ${data.additionalInfo}\n`;
    }

    description += `**Time responsável:** ${data.team}\n`;
    description += `**Prioridade:** ${data.priority}`;

    return description;
  }

  private buildBudgetAdjustmentDescription(data: CategoryTicketData): string {
    let description = `**Cliente:** ${data.clientName}\n`;
    description += `**Motivo do Ajuste:** ${data.adjustmentReason}\n`;
    description += `**Valor Solicitado:** ${data.requestedAmount}\n`;

    if (data.campaignInfo) {
      description += `**Informações da Campanha:** ${data.campaignInfo}\n`;
    }

    description += `**Time responsável:** ${data.team}\n`;
    description += `**Prioridade:** ${data.priority}`;

    return description;
  }
}
