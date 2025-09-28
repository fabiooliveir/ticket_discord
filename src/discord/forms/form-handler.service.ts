import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ModalSubmitInteraction, ButtonInteraction } from 'discord.js';
import { CorrectionTaggingService } from '../../modules/tickets/categories/correction-tagging/correction-tagging.service';
import { NewTaggingService } from '../../modules/tickets/categories/new-tagging/new-tagging.service';
import { BudgetAdjustmentService } from '../../modules/tickets/categories/budget-adjustment/budget-adjustment.service';
import { TicketCategoryService } from '../../modules/tickets/categories/ticket-category.service';
import { CorrectionTaggingForm } from '../../modules/tickets/categories/correction-tagging/correction-tagging.form';
import { NewTaggingForm } from '../../modules/tickets/categories/new-tagging/new-tagging.form';
import { BudgetAdjustmentForm } from '../../modules/tickets/categories/budget-adjustment/budget-adjustment.form';
import { CorrectionTaggingFormData } from '../../modules/tickets/categories/correction-tagging/correction-tagging.interface';
import { NewTaggingFormData } from '../../modules/tickets/categories/new-tagging/new-tagging.interface';
import { BudgetAdjustmentFormData } from '../../modules/tickets/categories/budget-adjustment/budget-adjustment.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from '../../database/entities/ticket.entity';
import { DiscordService } from '../discord.service';
import { TicketsService } from '../../modules/tickets/tickets.service';

@Injectable()
export class FormHandlerService {
  private readonly logger = new Logger(FormHandlerService.name);
  private userSessions: Map<string, any> = new Map();

  constructor(
    private readonly correctionTaggingService: CorrectionTaggingService,
    private readonly newTaggingService: NewTaggingService,
    private readonly budgetAdjustmentService: BudgetAdjustmentService,
    private readonly ticketCategoryService: TicketCategoryService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
    private readonly ticketsService: TicketsService,
  ) {}

  async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    const customId = interaction.customId;

    if (customId.startsWith('correction_tagging_form_')) {
      await this.handleCorrectionTaggingModal(interaction);
    } else if (customId.startsWith('new_tagging_form_')) {
      await this.handleNewTaggingModal(interaction);
    } else if (customId === 'budget_adjustment_form') {
      await this.handleBudgetAdjustmentModal(interaction);
    } else {
      this.logger.warn(`Modal não reconhecido: ${customId}`);
      await interaction.reply({
        content: '❌ Formulário não reconhecido!',
        ephemeral: true,
      });
    }
  }

  async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;

    if (customId.startsWith('select_client_')) {
      await this.handleClientSelection(interaction);
    } else if (customId.startsWith('select_client_new_tagging_')) {
      await this.handleNewTaggingClientSelection(interaction);
    } else if (
      customId === 'confirm_ticket' ||
      customId.startsWith('confirm_ticket_') ||
      customId === 'confirm_new_tagging_ticket' ||
      customId === 'confirm_budget_adjustment'
    ) {
      await this.handleTicketConfirmation(interaction);
    } else if (
      customId === 'cancel_ticket' ||
      customId.startsWith('cancel_ticket_') ||
      customId === 'cancel_new_tagging_ticket' ||
      customId === 'cancel_budget_adjustment'
    ) {
      await this.handleTicketCancellation(interaction);
    } else {
      this.logger.warn(`Botão não reconhecido: ${customId}`);
      await interaction.reply({
        content: '❌ Ação não reconhecida!',
        ephemeral: true,
      });
    }
  }

  private async handleCorrectionTaggingModal(
    interaction: ModalSubmitInteraction,
  ): Promise<void> {
    try {
      const clientId = interaction.customId.replace(
        'correction_tagging_form_',
        '',
      );
      // Buscar dados da sessão do DiscordService
      const sessionKey = `${interaction.user.id}_${clientId}`;
      const discordSession = this.discordService.getUserSession(sessionKey);

      const formData: CorrectionTaggingFormData = {
        website: interaction.fields.getTextInputValue('website'),
        problemDescription:
          interaction.fields.getTextInputValue('problemDescription'),
        additionalInfo: interaction.fields.getTextInputValue('additionalInfo'),
        team: discordSession?.team || 'suporte',
        priority: discordSession?.priority || 'medium',
      };

      // Buscar dados do cliente
      const client =
        await this.correctionTaggingService.getClientById(clientId);
      if (!client) {
        await interaction.reply({
          content: '❌ Cliente não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Armazenar dados da sessão
      this.userSessions.set(interaction.user.id, {
        clientId,
        clientName: client.name,
        formData,
        ticketData: {
          clientId,
          clientName: client.name,
          category: discordSession?.category || 'correction-tagging',
          team: discordSession?.team || 'suporte',
          priority: discordSession?.priority || 'medium',
        },
      });

      // Mostrar confirmação
      const embed = CorrectionTaggingForm.createConfirmationEmbed({
        clientId,
        clientName: client.name,
        website: formData.website,
        problemDescription: formData.problemDescription,
        team: formData.team,
        priority: formData.priority,
      });

      const confirmButton = CorrectionTaggingForm.createConfirmationButtons();

      await interaction.reply({
        embeds: [embed],
        components: [confirmButton],
        ephemeral: true,
      });
    } catch (error) {
      this.logger.error('Erro ao processar formulário de correção:', error);
      await interaction.reply({
        content: '❌ Erro ao processar formulário!',
        ephemeral: true,
      });
    }
  }

  private async handleNewTaggingModal(
    interaction: ModalSubmitInteraction,
  ): Promise<void> {
    try {
      const clientId = interaction.customId.replace('new_tagging_form_', '');
      const formData: NewTaggingFormData = {
        metaAccountId: interaction.fields.getTextInputValue('metaAccountId'),
        googleAdsAccountId:
          interaction.fields.getTextInputValue('googleAdsAccountId'),
        facebookPixelId:
          interaction.fields.getTextInputValue('facebookPixelId'),
        additionalInfo: interaction.fields.getTextInputValue('additionalInfo'),
        team: 'suporte',
        priority: 'medium',
      };

      // Buscar dados do cliente
      const client = await this.newTaggingService.getClientById(clientId);
      if (!client) {
        await interaction.reply({
          content: '❌ Cliente não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Buscar dados da sessão do Discord para team e priority
      const sessionKey = `${interaction.user.id}_${clientId}`;
      const discordSession = this.discordService.getUserSession(sessionKey);

      // Armazenar dados da sessão
      this.userSessions.set(interaction.user.id, {
        clientId,
        clientName: client.name,
        formData,
        ticketData: {
          clientId,
          clientName: client.name,
          category: 'new-tagging',
          team: discordSession?.team || 'suporte',
          priority: discordSession?.priority || 'medium',
        },
      });

      // Mostrar confirmação
      const embed = NewTaggingForm.createConfirmationEmbed({
        clientId,
        clientName: client.name,
        team: discordSession?.team || 'suporte',
        priority: discordSession?.priority || 'medium',
        metaAccountId: formData.metaAccountId,
        googleAdsAccountId: formData.googleAdsAccountId,
        facebookPixelId: formData.facebookPixelId,
        additionalInfo: formData.additionalInfo,
      });

      const confirmButton = NewTaggingForm.createConfirmationButtons();

      await interaction.reply({
        embeds: [embed],
        components: [confirmButton],
        ephemeral: true,
      });
    } catch (error) {
      this.logger.error(
        'Erro ao processar formulário de novo tagueamento:',
        error,
      );
      await interaction.reply({
        content: '❌ Erro ao processar formulário!',
        ephemeral: true,
      });
    }
  }

  private async handleClientSelection(
    interaction: ButtonInteraction,
  ): Promise<void> {
    try {
      const clientId = interaction.customId.replace('select_client_', '');

      // Buscar dados do cliente
      const clients = await this.correctionTaggingService.getAllClients();
      const client = clients.find((c) => c.id === clientId);

      if (!client) {
        await interaction.reply({
          content: '❌ Cliente não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Criar modal para correção de tagueamento
      const modal = CorrectionTaggingForm.createModal(
        clientId,
        client,
        'suporte',
        'medium',
      );

      await interaction.showModal(modal);
    } catch (error) {
      this.logger.error('Erro ao processar seleção de cliente:', error);
      await interaction.reply({
        content: '❌ Erro ao processar seleção!',
        ephemeral: true,
      });
    }
  }

  private async handleNewTaggingClientSelection(
    interaction: ButtonInteraction,
  ): Promise<void> {
    try {
      const clientId = interaction.customId.replace(
        'select_client_new_tagging_',
        '',
      );

      // Buscar dados do cliente
      const clients = await this.newTaggingService.getAllClients();
      const client = clients.find((c) => c.id === clientId);

      if (!client) {
        await interaction.reply({
          content: '❌ Cliente não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Criar modal para novo tagueamento
      const modal = NewTaggingForm.createModal(
        clientId,
        client,
        'suporte',
        'medium',
      );

      await interaction.showModal(modal);
    } catch (error) {
      this.logger.error('Erro ao processar seleção de cliente:', error);
      await interaction.reply({
        content: '❌ Erro ao processar seleção!',
        ephemeral: true,
      });
    }
  }

  private async handleTicketConfirmation(
    interaction: ButtonInteraction,
  ): Promise<void> {
    try {
      const session = this.userSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ Sessão expirada! Crie um novo ticket.',
          ephemeral: true,
        });
        return;
      }

      // Determinar categoria baseada na sessão
      const category = session.ticketData?.category || 'correction-tagging';

      // Criar ticket usando o serviço de categorias
      const ticket = await this.ticketCategoryService.createTicketWithCategory(
        category,
        session.ticketData,
        interaction.user.id,
        interaction.channelId,
      );

      // Obter equipe baseada na seleção da sessão
      const teamName = session.ticketData?.team || 'suporte';
      const team = this.discordService['getTeamByName'](teamName);

      // Determinar texto da categoria
      const categoryText =
        category === 'correction-tagging'
          ? 'Correção de Tagueamento'
          : category === 'new-tagging'
          ? 'Novo Tagueamento'
          : category === 'budget-adjustment'
          ? 'Ajuste de Verba'
          : 'Desconhecida';

      // Criar thread do ticket
      const thread = await this.discordService['createTicketThread'](team, {
        id: ticket.id,
        title: ticket.title,
        clientName: session.clientName,
        category: categoryText,
        priority: session.ticketData.priority || 'medium',
        author: interaction.user.tag,
        formData: session.formData, // Passar dados do formulário
      });

      // Atualizar ticket com informações da thread
      if (thread) {
        await this.ticketsService.updateTicket(ticket.id, {
          metadata: {
            ...ticket.metadata,
            clientName: session.clientName,
            category: categoryText,
            team: teamName,
            formData: session.formData, // Salvar dados do formulário
            threadId: thread.id,
            threadUrl: `https://discord.com/channels/${interaction.guildId}/${thread.id}`,
          },
        });
      }

      // Determinar informações específicas baseadas na categoria
      let specificInfo = '';
      if (category === 'correction-tagging') {
        specificInfo = `\n**Site:** ${session.formData.website}`;
      } else if (category === 'new-tagging') {
        specificInfo = `\n**Meta Account ID:** ${session.formData.metaAccountId}`;
      } else if (category === 'budget-adjustment') {
        specificInfo = `\n**Valor Solicitado:** ${session.formData.requestedAmount}`;
      }

      await interaction.reply({
        content: `✅ Ticket de ${categoryText.toLowerCase()} criado com sucesso!\n**ID:** ${ticket.id}\n**Cliente:** ${session.clientName}${specificInfo}${thread ? `\n**Thread:** <#${thread.id}>` : ''}`,
        ephemeral: true,
      });

      // Limpar sessão
      this.userSessions.delete(interaction.user.id);
    } catch (error) {
      this.logger.error('Erro ao confirmar ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao confirmar ticket!',
        ephemeral: true,
      });
    }
  }

  private async handleNewTaggingConfirmation(
    interaction: ButtonInteraction,
  ): Promise<void> {
    try {
      const session = this.userSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ Sessão expirada! Crie um novo ticket.',
          ephemeral: true,
        });
        return;
      }

      // Criar ticket usando o serviço de categorias
      const ticket = await this.ticketCategoryService.createTicketWithCategory(
        'new-tagging',
        session.ticketData,
        interaction.user.id,
        interaction.channelId,
      );

      // Obter equipe baseada na seleção (usar valores padrão por enquanto)
      const team = this.discordService['getTeamByName']('Suporte Técnico');

      // Criar thread do ticket
      const thread = await this.discordService['createTicketThread'](team, {
        id: ticket.id,
        title: ticket.title,
        clientName: session.clientName,
        category: 'Novo Tagueamento',
        priority: session.ticketData.priority || 'medium',
        author: interaction.user.tag,
      });

      // Atualizar ticket com informações da thread
      if (thread) {
        await this.ticketsService.updateTicket(ticket.id, {
          metadata: {
            ...ticket.metadata,
            clientName: session.clientName,
            threadId: thread.id,
            threadUrl: `https://discord.com/channels/${interaction.guildId}/${thread.id}`,
          },
        });
      }

      await interaction.reply({
        content: `✅ Ticket de novo tagueamento criado com sucesso!\n**ID:** ${ticket.id}\n**Cliente:** ${session.clientName}\n**Site:** ${session.formData.website}${thread ? `\n**Thread:** <#${thread.id}>` : ''}`,
        ephemeral: true,
      });

      // Limpar sessão
      this.userSessions.delete(interaction.user.id);
    } catch (error) {
      this.logger.error('Erro ao confirmar ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao confirmar ticket!',
        ephemeral: true,
      });
    }
  }

  private async handleBudgetAdjustmentModal(
    interaction: ModalSubmitInteraction,
  ): Promise<void> {
    try {
      // Buscar dados da sessão do DiscordService
      // Precisamos encontrar o clientId correto
      let clientId = null;
      let discordSession: any = null;
      
      // Tentar encontrar a sessão do usuário no DiscordService
      for (const [key, session] of this.discordService['userSessions']) {
        if (key.startsWith(`${interaction.user.id}_`)) {
          clientId = session.clientId;
          discordSession = session;
          break;
        }
      }

      if (!clientId || !discordSession) {
        await interaction.reply({
          content: '❌ Sessão expirada. Tente novamente.',
          ephemeral: true,
        });
        return;
      }

      const clientName = discordSession.clientName || 'Cliente';
      const category = discordSession.category || 'budget-adjustment';
      const team = discordSession.team || 'trafico';
      const priority = discordSession.priority || 'medium';

      const formData: BudgetAdjustmentFormData = {
        adjustmentReason: interaction.fields.getTextInputValue('adjustmentReason'),
        requestedAmount: interaction.fields.getTextInputValue('requestedAmount'),
        campaignInfo: interaction.fields.getTextInputValue('campaignInfo') || undefined,
      };

      // Validar dados do formulário
      const validation = this.budgetAdjustmentService.validateFormData(formData);
      if (!validation.isValid) {
        await interaction.reply({
          content: `❌ Erro de validação:\n${validation.errors.join('\n')}`,
          ephemeral: true,
        });
        return;
      }

      // Buscar dados do cliente
      const client = await this.budgetAdjustmentService.getClientById(clientId);
      if (!client) {
        await interaction.reply({
          content: '❌ Cliente não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Armazenar dados da sessão no FormHandlerService
      this.userSessions.set(interaction.user.id, {
        clientId,
        clientName: client.name,
        formData,
        ticketData: {
          clientId,
          clientName: client.name,
          category: category,
          team: team,
          priority: priority,
        },
      });

      // Mostrar confirmação
      const embed = BudgetAdjustmentForm.createConfirmationEmbed(
        clientName,
        formData,
      );

      const confirmButton = BudgetAdjustmentForm.createConfirmationButtons();

      await interaction.reply({
        embeds: [embed],
        components: [confirmButton],
        ephemeral: true,
      });
    } catch (error) {
      this.logger.error('Erro ao processar formulário de ajuste de verba:', error);
      await interaction.reply({
        content: '❌ Erro ao processar formulário!',
        ephemeral: true,
      });
    }
  }

  private async handleTicketCancellation(
    interaction: ButtonInteraction,
  ): Promise<void> {
    // Limpar sessão
    this.userSessions.delete(interaction.user.id);

    await interaction.reply({
      content: '❌ Criação do ticket cancelada.',
      ephemeral: true,
    });
  }
}
