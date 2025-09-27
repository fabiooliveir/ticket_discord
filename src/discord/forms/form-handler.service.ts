import { Injectable, Logger } from '@nestjs/common';
import {
  ModalSubmitInteraction,
  ButtonInteraction,
} from 'discord.js';
import { CorrectionTaggingService } from '../../modules/tickets/categories/correction-tagging/correction-tagging.service';
import { TicketCategoryService } from '../../modules/tickets/categories/ticket-category.service';
import { CorrectionTaggingForm } from '../../modules/tickets/categories/correction-tagging/correction-tagging.form';
import { CorrectionTaggingFormData } from '../../modules/tickets/categories/correction-tagging/correction-tagging.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from '../../database/entities/ticket.entity';

@Injectable()
export class FormHandlerService {
  private readonly logger = new Logger(FormHandlerService.name);
  private userSessions: Map<string, any> = new Map();

  constructor(
    private readonly correctionTaggingService: CorrectionTaggingService,
    private readonly ticketCategoryService: TicketCategoryService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    const customId = interaction.customId;

    if (customId.startsWith('correction_tagging_form_')) {
      await this.handleCorrectionTaggingModal(interaction);
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
    } else if (customId.startsWith('select_team_')) {
      await this.handleTeamSelection(interaction);
    } else if (customId.startsWith('select_priority_')) {
      await this.handlePrioritySelection(interaction);
    } else if (customId === 'confirm_ticket') {
      await this.handleTicketConfirmation(interaction);
    } else if (customId === 'cancel_ticket') {
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

      // Extrair dados do formulário
      const formData: CorrectionTaggingFormData = {
        website: interaction.fields.getTextInputValue('website'),
        problemDescription:
          interaction.fields.getTextInputValue('problemDescription'),
        additionalInfo:
          interaction.fields.getTextInputValue('additionalInfo') || undefined,
        team: interaction.fields.getTextInputValue('team'),
        priority: interaction.fields.getTextInputValue('priority') as
          | 'low'
          | 'medium'
          | 'high',
      };

      // Validar dados
      const validation =
        this.correctionTaggingService.validateFormData(formData);
      if (!validation.isValid) {
        await interaction.reply({
          content: `❌ Dados inválidos:\n${validation.errors.join('\n')}`,
          ephemeral: true,
        });
        return;
      }

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

      // Construir dados do ticket
      const ticketData = this.correctionTaggingService.buildTicketData(
        clientId,
        client.name,
        formData,
      );

      // Salvar sessão do usuário
      this.userSessions.set(interaction.user.id, {
        type: 'correction-tagging',
        clientId,
        clientName: client.name,
        formData,
        ticketData,
      });

      // Mostrar confirmação
      const embed = CorrectionTaggingForm.createConfirmationEmbed(ticketData);
      const buttons = CorrectionTaggingForm.createConfirmationButtons();

      await interaction.reply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true,
      });
    } catch (error) {
      this.logger.error(
        'Erro ao processar modal de correção de tagueamento:',
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

      // Validar cliente
      const isValid =
        await this.correctionTaggingService.validateClient(clientId);
      if (!isValid) {
        await interaction.reply({
          content: '❌ Cliente inválido!',
          ephemeral: true,
        });
        return;
      }

      // Mostrar formulário
      const modal = CorrectionTaggingForm.createModal(clientId);
      await interaction.showModal(modal);
    } catch (error) {
      this.logger.error('Erro ao processar seleção de cliente:', error);
      await interaction.reply({
        content: '❌ Erro ao processar seleção!',
        ephemeral: true,
      });
    }
  }

  private async handleTeamSelection(
    interaction: ButtonInteraction,
  ): Promise<void> {
    // Implementar se necessário para fluxo mais complexo
    await interaction.reply({
      content: 'Seleção de time processada!',
      ephemeral: true,
    });
  }

  private async handlePrioritySelection(
    interaction: ButtonInteraction,
  ): Promise<void> {
    // Implementar se necessário para fluxo mais complexo
    await interaction.reply({
      content: 'Seleção de prioridade processada!',
      ephemeral: true,
    });
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

      // Criar ticket usando o serviço de categorias
      const ticket = await this.ticketCategoryService.createTicketWithCategory(
        'correction-tagging',
        session.ticketData as any,
        interaction.user.id,
        interaction.channelId,
      );

      await interaction.reply({
        content: `✅ Ticket de correção de tagueamento criado com sucesso!\n**ID:** ${ticket.id}\n**Cliente:** ${session.clientName}\n**Site:** ${session.formData.website}`,
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

  getUserSession(userId: string): any {
    return this.userSessions.get(userId);
  }

  clearUserSession(userId: string): void {
    this.userSessions.delete(userId);
  }
}
