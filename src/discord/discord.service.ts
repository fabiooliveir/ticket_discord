import { Injectable, Logger } from '@nestjs/common';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ThreadChannel,
} from 'discord.js';
import { Inject } from '@nestjs/common';
import { DiscordBot } from './discord.bot';
import { TeamsService } from './teams.service';
import { FormHandlerService } from './forms/form-handler.service';
import { DatabaseService } from '../database/database.service';
import { Ticket } from '../database/entities/ticket.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketCategoryService } from '../modules/tickets/categories/ticket-category.service';
import { CorrectionTaggingService } from '../modules/tickets/categories/correction-tagging/correction-tagging.service';
import { CorrectionTaggingForm } from '../modules/tickets/categories/correction-tagging/correction-tagging.form';
import { NewTaggingService } from '../modules/tickets/categories/new-tagging/new-tagging.service';
import { NewTaggingForm } from '../modules/tickets/categories/new-tagging/new-tagging.form';
import { BudgetAdjustmentService } from '../modules/tickets/categories/budget-adjustment/budget-adjustment.service';
import { BudgetAdjustmentForm } from '../modules/tickets/categories/budget-adjustment/budget-adjustment.form';
import { MessageHandlerService } from './message-handler.service';
import { SlaCalculator } from '../shared/utils/sla-calculator.util';
import {
  SlaCategories,
  TicketPriority,
} from '../shared/enums/sla-categories.enum';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private userSessions: Map<string, any> = new Map();

  getUserSession(sessionKey: string): any {
    return this.userSessions.get(sessionKey);
  }

  constructor(
    @Inject('DISCORD_CONFIG') private readonly config: any,
    private readonly databaseService: DatabaseService,
    private readonly teamsService: TeamsService,
    private readonly formHandlerService: FormHandlerService,
    private readonly ticketCategoryService: TicketCategoryService,
    private readonly correctionTaggingService: CorrectionTaggingService,
    private readonly newTaggingService: NewTaggingService,
    private readonly budgetAdjustmentService: BudgetAdjustmentService,
    private readonly messageHandlerService: MessageHandlerService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async getSlashCommands() {
    return [
      {
        name: 'criar-ticket',
        description: 'Cria um novo ticket para qualquer equipe',
        options: [
          {
            name: 'cliente',
            description: 'Selecione o cliente para o ticket',
            type: 3, // STRING
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        name: 'ajuda',
        description: 'Como usar os tickets e os botões',
        options: [
          {
            name: 'topico',
            description: 'Escolha um tópico de ajuda',
            type: 3, // STRING
            required: false,
            choices: [
              { name: 'Geral', value: 'geral' },
              { name: 'Criar', value: 'criar' },
              { name: 'Botões', value: 'botoes' },
            ],
          },
        ],
      },
    ];
  }

  async handleSlashCommand(interaction: any) {
    const { commandName, options } = interaction;

    switch (commandName) {
      case 'criar-ticket':
        await this.handleCreateTicketSlash(interaction, options);
        break;
      case 'ajuda':
        await this.handleHelpCommand(interaction, options);
        break;
      default:
        await interaction.reply({
          content: '❌ Comando não reconhecido!',
          ephemeral: true,
        });
    }
  }

  async handleAutocomplete(interaction: any) {
    const commandName = interaction.commandName;
    const options = interaction.options;

    if (commandName === 'criar-ticket') {
      // Tentar diferentes formas de obter a query
      let query = '';

      try {
        const focusedOption = options.getFocused();
        if (focusedOption) {
          // getFocused() retorna o valor diretamente, não um objeto
          query = String(focusedOption);
        }
      } catch (error) {
        this.logger.warn('Erro ao obter query do autocomplete:', error.message);
        query = '';
      }

      this.logger.log(
        `🔍 Autocomplete - Command: ${commandName}, Query: "${query}"`,
      );
      await this.handleClientAutocomplete(interaction, query);
    }
  }

  private async handleClientAutocomplete(interaction: any, query: string) {
    try {
      this.logger.log(`🔍 Autocomplete solicitado para query: "${query}"`);

      // Buscar clientes com base na query
      const clients = await this.correctionTaggingService.searchClients(
        query || '',
      );

      this.logger.log(`📋 Encontrados ${clients.length} clientes`);

      // Limitar a 25 opções (limite do Discord)
      const choices = clients.slice(0, 25).map((client) => ({
        name: client.name,
        value: client.name, // Usar o nome como valor também
      }));

      this.logger.log(`✅ Enviando ${choices.length} opções para o Discord`);
      await interaction.respond(choices);
    } catch (error) {
      this.logger.error('Erro no autocomplete de clientes:', error);
      await interaction.respond([]);
    }
  }

  private async handleCreateTicketSlash(interaction: any, options: any) {
    try {
      // Defer a resposta para dar tempo de processar
      await interaction.deferReply({ ephemeral: true });

      // Obter o cliente selecionado
      const clientName = options.getString('cliente');

      if (!clientName) {
        await interaction.editReply({
          content: '❌ Cliente não selecionado. Tente novamente.',
        });
        return;
      }

      // Buscar dados do cliente pelo nome
      const clients = await this.correctionTaggingService.getAllClients();
      const selectedClient = clients.find(
        (client) => client.name === clientName,
      );

      if (!selectedClient) {
        await interaction.editReply({
          content: '❌ Cliente não encontrado. Tente novamente.',
        });
        return;
      }

      // Determinar equipe baseada no canal onde o comando foi executado
      const channelId = interaction.channelId;
      const teams = this.teamsService.getTeamsConfig();
      const currentTeam = teams.find(team => team.channelId === channelId);
      
      if (!currentTeam) {
        await interaction.editReply({
          content: '❌ Este comando só pode ser usado nos canais das equipes (Suporte, CS ou Tráfego).',
        });
        return;
      }

      // Verificar se o usuário tem acesso ao canal da equipe
      const hasAccess = await this.teamsService.hasChannelAccess(interaction.user.id, currentTeam);
      if (!hasAccess) {
        await interaction.editReply({
          content: `❌ Você não tem permissão para abrir tickets no canal da equipe ${currentTeam.name}. Verifique se tem o cargo apropriado.`,
        });
        return;
      }

      // Armazenar dados da sessão com a equipe correta
      const sessionKey = `${interaction.user.id}_${selectedClient.id}`;
      this.userSessions.set(sessionKey, {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        team: this.getTeamKeyByChannelId(channelId),
        priority: 'medium',
        category: 'correction-tagging', // Padrão para slash command
      });

      // Prosseguir com a criação do ticket usando o cliente selecionado
      await this.handleClientSelected(interaction, selectedClient.id);
    } catch (error) {
      this.logger.error('Erro ao criar ticket via slash command:', error);
      
      let errorMessage = '❌ Erro interno ao criar ticket. Tente novamente.';
      
      if (error?.message?.includes('Missing Access') || error?.message?.includes('Missing Permissions')) {
        errorMessage = '❌ Você não tem permissão para acessar o canal da equipe.';
      } else if (error?.message?.includes('Canal') && error?.message?.includes('não encontrado')) {
        errorMessage = '❌ Canal da equipe não encontrado. Verifique a configuração.';
      }
      
      await interaction.editReply({
        content: errorMessage,
      });
    }
  }

  // Método para criar thread do ticket
  private async createTicketThread(
    team: any,
    ticketData: {
      id: string;
      title: string;
      clientName: string;
      category: string;
      priority: string;
      author: string;
      formData?: any; // Dados do formulário
    },
  ): Promise<ThreadChannel | null> {
    try {
      const channel = await this.teamsService.discordBot.client.channels.fetch(
        team.channelId,
      );

      if (!channel || !channel.isTextBased()) {
        this.logger.error(
          `Canal ${team.channelId} não encontrado ou não é de texto`,
        );
        return null;
      }

      // Verificar se é um canal de texto ou notícias (que suportam threads)
      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildNews
      ) {
        this.logger.error(`Canal ${team.channelId} não suporta threads`);
        return null;
      }

      // Criar thread com nome do ticket
      const threadName = `🔴 🎫 ${ticketData.clientName}`.substring(0, 100);

      const thread = await (channel as any).threads.create({
        name: threadName,
        autoArchiveDuration: 10080, // 7 dias (máximo permitido pelo Discord)
        reason: `Ticket criado por ${ticketData.author}`,
      });

      // Criar embed inicial do ticket
      let embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketData.id}`)
        .setDescription(
          `**Cliente:** ${ticketData.clientName}\n**Categoria:** ${ticketData.category}\n**Prioridade:** ${ticketData.priority}`,
        )
        .addFields(
          {
            name: 'Status',
            value: '🔴 **NA FILA** - Aguardando atendimento',
            inline: true,
          },
          { name: 'Equipe', value: team.name, inline: true },
          { name: 'Responsável', value: 'Aguardando atribuição', inline: true },
        )
        .setColor(0xff0000) // Vermelho para fila
        .setTimestamp()
        .setFooter({ text: `Criado por ${ticketData.author}` });

      // Adicionar campos específicos baseados na categoria
      if (ticketData.category === 'new-tagging' && ticketData.formData) {
        embed = embed.addFields(
          {
            name: 'Meta Account ID',
            value: ticketData.formData.metaAccountId || 'N/A',
            inline: false,
          },
          {
            name: 'Google Ads ID',
            value: ticketData.formData.googleAdsAccountId || 'N/A',
            inline: false,
          },
          {
            name: 'Facebook Pixel ID',
            value: ticketData.formData.facebookPixelId || 'N/A',
            inline: false,
          },
          {
            name: 'Informações Adicionais',
            value: ticketData.formData.additionalInfo || 'Nenhuma',
            inline: false,
          },
        );
      } else if (
        ticketData.category === 'correction-tagging' &&
        ticketData.formData
      ) {
        embed = embed.addFields(
          {
            name: 'Site',
            value: ticketData.formData.website || 'N/A',
            inline: false,
          },
          {
            name: 'Descrição do Problema',
            value: ticketData.formData.problemDescription || 'N/A',
            inline: false,
          },
          {
            name: 'Informações Adicionais',
            value: ticketData.formData.additionalInfo || 'Nenhuma',
            inline: false,
          },
        );
      } else if (
        ticketData.category === 'Ajuste de Verba' &&
        ticketData.formData
      ) {
        embed = embed.addFields(
          {
            name: 'Motivo do Ajuste',
            value: ticketData.formData.adjustmentReason || 'N/A',
            inline: false,
          },
          {
            name: 'Valor Solicitado',
            value: ticketData.formData.requestedAmount || 'N/A',
            inline: false,
          },
          {
            name: 'Informações da Campanha',
            value: ticketData.formData.campaignInfo || 'Nenhuma',
            inline: false,
          },
        );
      }

      // Botão para puxar ticket
      const pullButton = new ButtonBuilder()
        .setCustomId(`pull_ticket_${ticketData.id}`)
        .setLabel('Puxar para mim')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👤');

      // Botão para arquivar thread
      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketData.id}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        pullButton,
        archiveButton,
      );

      // Enviar mensagem inicial na thread
      await thread.send({
        content: `<@&${team.roleId}> - Novo ticket criado!`,
        embeds: [embed],
        components: [buttonRow],
      });

      this.logger.log(`Thread criada: ${thread.name} (${thread.id})`);
      return thread;
    } catch (error) {
      this.logger.error('Erro ao criar thread do ticket:', error);
      
      // Re-lançar erro com mensagem específica para ser capturada pelo handler
      if (error?.code === 50001 || error?.code === 50013) {
        throw new Error('Missing Access: Você não tem permissão para criar threads neste canal.');
      } else if (error?.code === 10003) {
        throw new Error('Canal não encontrado: O canal da equipe não existe ou foi removido.');
      } else if (error?.message?.includes('Missing Access')) {
        throw new Error('Missing Access: Acesso negado ao canal da equipe.');
      } else if (error?.message?.includes('Missing Permissions')) {
        throw new Error('Missing Permissions: Permissões insuficientes para criar thread.');
      }
      
      throw error; // Re-lançar erro original se não for mapeado
    }
  }

  // Método para obter equipe por nome
  private getTeamByName(teamValue: string): any {
    const teams = this.teamsService.getTeamsConfig();

    // Mapear valores do select para nomes das equipes
    const teamMapping = {
      suporte: 'Suporte Técnico',
      cs: 'Customer Success',
      trafico: 'Tráfego Pago',
    };

    const teamName = teamMapping[teamValue] || teamValue;
    return teams.find((team) => team.name === teamName) || teams[0]; // Fallback para suporte
  }

  // Método para obter chave da equipe por ID do canal
  private getTeamKeyByChannelId(channelId: string): string {
    const teams = this.teamsService.getTeamsConfig();
    const team = teams.find(t => t.channelId === channelId);
    
    if (!team) return 'suporte'; // Fallback
    
    // Mapear nome da equipe para chave
    const nameToKey = {
      'Suporte Técnico': 'suporte',
      'Customer Success': 'cs',
      'Tráfego Pago': 'trafico',
    };
    
    return nameToKey[team.name] || 'suporte';
  }

  async handleButtonInteraction(interaction: any) {
    const customId = interaction.customId;

    if (customId.startsWith('priority_high_')) {
      const ticketId = customId.replace('priority_high_', '');
      await this.setTicketPriority(interaction, ticketId, 'high');
    } else if (customId.startsWith('select_client_')) {
      const clientId = customId.replace('select_client_', '');
      await this.handleClientSelected(interaction, clientId);
    } else if (customId.startsWith('open_form_')) {
      const clientId = customId.replace('open_form_', '');
      await this.handleOpenForm(interaction, clientId);
    } else if (customId.startsWith('pull_ticket_')) {
      const ticketId = customId.replace('pull_ticket_', '');
      await this.handlePullTicket(interaction, ticketId);
    } else if (customId.startsWith('waiting_client_')) {
      const ticketId = customId.replace('waiting_client_', '');
      await this.handleTicketStatusChange(interaction, ticketId);
    } else if (customId.startsWith('archive_thread_')) {
      const ticketId = customId.replace('archive_thread_', '');
      await this.handleArchiveThread(interaction, ticketId);
    } else {
      // Delegar para FormHandlerService para outros tipos de botões
      await this.formHandlerService.handleButtonInteraction(interaction);
    }
  }

  private async handlePullTicket(interaction: any, ticketId: string) {
    try {
      // Buscar ticket no banco de dados
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.reply({
          content: '❌ Ticket não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Verificar se o ticket já foi atribuído
      if (ticket.assignedTo) {
        await interaction.reply({
          content: `❌ Este ticket já foi atribuído a <@${ticket.assignedTo}>!`,
          ephemeral: true,
        });
        return;
      }

      // Verificar se o usuário pertence à equipe (por enquanto, permitir qualquer usuário)
      // TODO: Implementar verificação de permissões da equipe

      // Atribuir ticket ao usuário
      await this.assignTicketToUser(ticketId, interaction.user.id);

      // Atualizar nome da thread para indicar que foi atribuído
      if (interaction.channel && interaction.channel.isThread()) {
        const newThreadName = `🟢 🎫 ${ticket.metadata?.clientName || 'Cliente'}`;
        await interaction.channel.setName(newThreadName);
      }

      // Atualizar embed da thread
      let updatedEmbed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.id}`)
        .setDescription(
          `**Cliente:** ${ticket.metadata?.clientName || 'N/A'}\n**Categoria:** ${ticket.metadata?.category || 'N/A'}\n**Prioridade:** ${ticket.priority}`,
        )
        .addFields(
          {
            name: 'Status',
            value: '🟢 **ATRIBUÍDO** - Responsável definido',
            inline: true,
          },
          {
            name: 'Equipe',
            value: ticket.metadata?.team || 'N/A',
            inline: true,
          },
          {
            name: 'Responsável',
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
        )
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({ text: `Atribuído por ${interaction.user.tag}` });

      // Adicionar campos específicos baseados na categoria
      if (
        ticket.metadata?.category === 'new-tagging' &&
        ticket.metadata?.formData
      ) {
        updatedEmbed = updatedEmbed.addFields(
          {
            name: 'Meta Account ID',
            value: ticket.metadata.formData.metaAccountId || 'N/A',
            inline: false,
          },
          {
            name: 'Google Ads ID',
            value: ticket.metadata.formData.googleAdsAccountId || 'N/A',
            inline: false,
          },
          {
            name: 'Facebook Pixel ID',
            value: ticket.metadata.formData.facebookPixelId || 'N/A',
            inline: false,
          },
          {
            name: 'Informações Adicionais',
            value: ticket.metadata.formData.additionalInfo || 'Nenhuma',
            inline: false,
          },
        );
      } else if (
        ticket.metadata?.category === 'correction-tagging' &&
        ticket.metadata?.formData
      ) {
        updatedEmbed = updatedEmbed.addFields(
          {
            name: 'Site',
            value: ticket.metadata.formData.website || 'N/A',
            inline: false,
          },
          {
            name: 'Descrição do Problema',
            value: ticket.metadata.formData.problemDescription || 'N/A',
            inline: false,
          },
          {
            name: 'Informações Adicionais',
            value: ticket.metadata.formData.additionalInfo || 'Nenhuma',
            inline: false,
          },
        );
      } else if (
        ticket.metadata?.category === 'Ajuste de Verba' &&
        ticket.metadata?.formData
      ) {
        updatedEmbed = updatedEmbed.addFields(
          {
            name: 'Motivo do Ajuste',
            value: ticket.metadata.formData.adjustmentReason || 'N/A',
            inline: false,
          },
          {
            name: 'Valor Solicitado',
            value: ticket.metadata.formData.requestedAmount || 'N/A',
            inline: false,
          },
          {
            name: 'Informações da Campanha',
            value: ticket.metadata.formData.campaignInfo || 'Nenhuma',
            inline: false,
          },
        );
      }

      // Botões atualizados
      const waitingClientButton = new ButtonBuilder()
        .setCustomId(`waiting_client_${ticketId}`)
        .setLabel('Aguardando cliente')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏳');

      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketId}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        waitingClientButton,
        archiveButton,
      );

      await interaction.update({
        embeds: [updatedEmbed],
        components: [buttonRow],
      });

      // Notificar no canal da equipe
      await this.notifyTeamAssignment(ticket, interaction.user);
    } catch (error) {
      this.logger.error('Erro ao puxar ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao puxar ticket. Tente novamente.',
        ephemeral: true,
      });
    }
  }

  private async assignTicketToUser(
    ticketId: string,
    userId: string,
  ): Promise<void> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new Error('Ticket não encontrado');
    }

    await this.ticketRepository.update(ticketId, {
      status: 'assigned',
      assignedTo: userId,
      metadata: {
        ...ticket.metadata,
        assignedAt: new Date().toISOString(),
      } as Record<string, any>,
    });

    // Invalidar cache do ticket após atualização
    this.messageHandlerService.invalidateTicketCache(ticketId);
  }

  private async notifyTeamAssignment(ticket: any, user: any): Promise<void> {
    try {
      // Enviar notificação no canal da equipe
      const team = this.getTeamByName(
        ticket.metadata?.team || 'Suporte Técnico',
      );
      if (team?.channelId) {
        const channel =
          await this.teamsService.discordBot.client.channels.fetch(
            team.channelId,
          );
        if (channel && channel.isTextBased() && 'send' in channel) {
          await (channel as any).send({
            content: `🎯 **Ticket #${ticket.id}** foi atribuído a <@${user.id}> por <@${user.id}>!`,
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `**Cliente:** ${ticket.metadata?.clientName || 'N/A'}\n**Status:** Atribuído`,
                )
                .setColor(0x00ff00)
                .setTimestamp(),
            ],
          });
        }
      }
    } catch (error) {
      this.logger.error('Erro ao notificar atribuição:', error);
    }
  }

  private async handleTicketStatusChange(interaction: any, ticketId: string) {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.reply({
          content: '❌ Ticket não encontrado!',
          ephemeral: true,
        });
        return;
      }

      // Verificar se o usuário é o responsável pelo ticket
      if (ticket.assignedTo !== interaction.user.id) {
        await interaction.reply({
          content: '❌ Apenas o responsável pelo ticket pode alterar o status!',
          ephemeral: true,
        });
        return;
      }

      // Atualizar status do ticket
      await this.ticketRepository.update(ticketId, {
        status: 'waiting_client',
        metadata: {
          ...ticket.metadata,
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: interaction.user.id,
        } as Record<string, any>,
      });

      // Atualizar embed da thread
      const statusEmoji = '⏳';
      const statusText = '**AGUARDANDO CLIENTE** - Resposta pendente';

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.id}`)
        .setDescription(
          `**Cliente:** ${ticket.metadata?.clientName || 'N/A'}\n**Categoria:** ${ticket.metadata?.category || 'N/A'}\n**Prioridade:** ${ticket.priority}`,
        )
        .addFields(
          {
            name: 'Status',
            value: `${statusEmoji} ${statusText}`,
            inline: true,
          },
          {
            name: 'Equipe',
            value: ticket.metadata?.team || 'N/A',
            inline: true,
          },
          {
            name: 'Responsável',
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
        )
        .setColor(0xffaa00)
        .setTimestamp()
        .setFooter({ text: `Status alterado por ${interaction.user.tag}` });

      // Botões atualizados
      const waitingClientButton = new ButtonBuilder()
        .setCustomId(`waiting_client_${ticketId}`)
        .setLabel('Aguardando cliente')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏳');

      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketId}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        waitingClientButton,
        archiveButton,
      );

      await interaction.update({
        embeds: [updatedEmbed],
        components: [buttonRow],
      });

      // Atualizar nome da thread baseado no status
      if (interaction.channel && interaction.channel.isThread()) {
        const statusEmoji = '⏳';
        const newThreadName = `${statusEmoji} 🎫 ${ticket.metadata?.clientName || 'Cliente'}`;
        await interaction.channel.setName(newThreadName);
      }
    } catch (error) {
      this.logger.error('Erro ao alterar status do ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao alterar status. Tente novamente.',
        ephemeral: true,
      });
    }
  }

  private async handleArchiveThread(interaction: any, ticketId: string) {
    try {
      // Defer a resposta imediatamente para evitar timeout
      await interaction.deferReply({ ephemeral: true });

      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.editReply({
          content: '❌ Ticket não encontrado!',
        });
        return;
      }

      // Verificar se o usuário tem permissão para arquivar
      // Criador, responsável ou admin podem arquivar
      const canArchive =
        ticket.discordUserId === interaction.user.id ||
        ticket.assignedTo === interaction.user.id;
      // TODO: Adicionar verificação de admin

      if (!canArchive) {
        await interaction.editReply({
          content:
            '❌ Apenas o criador, responsável ou admin podem arquivar a thread!',
        });
        return;
      }

      // Arquivar a thread
      if (interaction.channel && interaction.channel.isThread()) {
        // Calcular SLA de duração antes de arquivar
        const closedAt = new Date();
        const durationTimeMinutes = SlaCalculator.calculateDurationTime(
          ticket.createdAt,
          closedAt,
          ticket.slaCategory as SlaCategories,
        );
        const durationSlaStatus = SlaCalculator.getDurationSlaStatus(
          durationTimeMinutes,
          ticket.priority as TicketPriority,
        );

        // Atualizar status do ticket com SLA de duração
        await this.ticketRepository.update(ticketId, {
          status: 'closed', // Mudança: 'closed' em vez de 'archived'
          closedAt: closedAt,
          durationTimeMinutes: durationTimeMinutes,
          durationSlaStatus: durationSlaStatus,
          metadata: {
            ...ticket.metadata,
            archivedBy: interaction.user.id,
            archivedAt: closedAt.toISOString(),
            durationSlaCalculated: true,
            durationSlaMethod: 'discord_archive',
          } as Record<string, any>,
        });

        this.logger.log(
          `📊 Ticket ${ticketId} arquivado - Duração: ${durationTimeMinutes}min, Status: ${durationSlaStatus}`,
        );

        // Arquivar a thread
        await interaction.channel.setArchived(true);

        // Confirmar sucesso
        await interaction.editReply({
          content: '✅ Thread arquivada com sucesso!',
        });
      } else {
        // Se não for thread, apenas responder
        await interaction.editReply({
          content: '❌ Este comando só pode ser usado em threads!',
        });
      }
    } catch (error) {
      this.logger.error('Erro ao arquivar thread:', error);

      // Tentar responder apenas se a interação ainda estiver ativa
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ Erro ao arquivar thread. Tente novamente.',
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ Erro ao arquivar thread. Tente novamente.',
          });
        }
      } catch (replyError) {
        this.logger.error('Erro ao responder interação:', replyError);
      }
    }
  }

  private async setTicketPriority(
    interaction: any,
    ticketId: string,
    priority: string,
  ) {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.reply({
          content: '❌ Ticket não encontrado!',
          ephemeral: true,
        });
        return;
      }

      ticket.priority = priority;
      ticket.metadata = {
        ...ticket.metadata,
        priorityChangedBy: interaction.user.tag,
        priorityChangedAt: new Date().toISOString(),
      };

      await this.ticketRepository.save(ticket);

      const embed = new EmbedBuilder()
        .setTitle('🎫 Prioridade Alterada')
        .setDescription(
          `Prioridade do ticket **${ticket.title}** alterada para **Alta**!`,
        )
        .setColor(0xffaa00)
        .setTimestamp();

      await interaction.update({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Erro ao alterar prioridade do ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao alterar prioridade!',
        ephemeral: true,
      });
    }
  }

  private async handleClientSelectionFlow(interaction: any) {
    try {
      // Buscar clientes na Leadfy (usando qualquer um dos serviços)
      const clients = await this.correctionTaggingService.getAllClients();

      if (clients.length === 0) {
        await interaction.editReply({
          content:
            '❌ Nenhum cliente encontrado na Leadfy. Tente novamente mais tarde.',
        });
        return;
      }

      // Mostrar seleção de cliente
      const embed = new EmbedBuilder()
        .setTitle('🔍 Seleção de Cliente')
        .setDescription('Escolha o cliente para o qual deseja criar o ticket')
        .setColor(0x0099ff)
        .setFooter({ text: `Total de ${clients.length} clientes encontrados` });

      const buttonRows = this.createClientSelectionButtons(clients);

      await interaction.editReply({
        embeds: [embed],
        components: buttonRows,
      });
    } catch (error) {
      this.logger.error('Erro no fluxo de seleção de cliente:', error);
      await interaction.editReply({
        content: '❌ Erro ao buscar clientes. Tente novamente.',
      });
    }
  }

  private createClientSelectionButtons(
    clients: any[],
  ): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const maxButtonsPerRow = 5;

    for (let i = 0; i < clients.length; i += maxButtonsPerRow) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const clientBatch = clients.slice(i, i + maxButtonsPerRow);

      clientBatch.forEach((client) => {
        const button = new ButtonBuilder()
          .setCustomId(`select_client_${client.id}`)
          .setLabel(
            client.name.length > 20
              ? client.name.substring(0, 17) + '...'
              : client.name,
          )
          .setStyle(ButtonStyle.Primary);

        row.addComponents(button);
      });

      rows.push(row);
    }

    return rows;
  }

  private async handleClientSelected(interaction: any, clientId: string) {
    try {
      // Buscar dados do cliente
      const clients = await this.correctionTaggingService.getAllClients();
      const selectedClient = clients.find((client) => client.id == clientId);

      if (!selectedClient) {
        await interaction.editReply({
          content: '❌ Cliente não encontrado. Tente novamente.',
        });
        return;
      }

      // Criar embed com informações do cliente selecionado
      const embed = new EmbedBuilder()
        .setTitle('🎫 Configuração do Ticket')
        .setDescription(`Cliente selecionado: **${selectedClient.name}**`)
        .setColor(0x00ff00)
        .addFields(
          {
            name: '🆔 ID do Cliente',
            value: String(selectedClient.id),
            inline: true,
          },
          { name: '📝 Nome', value: selectedClient.name, inline: true },
        )
        .setFooter({ text: 'Configure as opções do ticket abaixo' });

      // Criar menus de seleção
      const categorySelect = this.createCategorySelectMenu(clientId);
      const teamSelect = this.createTeamSelectMenu(clientId);
      const prioritySelect = this.createPrioritySelectMenu(clientId);

      await interaction.editReply({
        embeds: [embed],
        components: [categorySelect, teamSelect, prioritySelect],
      });
    } catch (error) {
      this.logger.error('Erro ao processar seleção de cliente:', error);
      await interaction.editReply({
        content: '❌ Erro ao processar seleção. Tente novamente.',
      });
    }
  }

  private createCategorySelectMenu(
    clientId: string,
    selectedCategory?: string,
  ): ActionRowBuilder<StringSelectMenuBuilder> {
    const select = new StringSelectMenuBuilder()
      .setCustomId(`select_category_${clientId}`)
      .setPlaceholder(
        selectedCategory
          ? `Categoria: ${
              selectedCategory === 'correction-tagging'
                ? 'Correção'
                : selectedCategory === 'new-tagging'
                  ? 'Novo'
                  : selectedCategory === 'budget-adjustment'
                    ? 'Ajuste de Verba'
                    : 'Desconhecida'
            }`
          : 'Selecione a categoria do ticket',
      )
      .setDisabled(false) // Sempre habilitado para permitir mudança
      .addOptions([
        {
          label: 'Correção de Tagueamento',
          description: 'Corrigir problemas de tagueamento existente',
          value: 'correction-tagging',
          emoji: '🔧',
          default: selectedCategory === 'correction-tagging',
        },
        {
          label: 'Novo Tagueamento',
          description: 'Configurar novo sistema de tagueamento',
          value: 'new-tagging',
          emoji: '🆕',
          default: selectedCategory === 'new-tagging',
        },
        {
          label: 'Ajuste de Verba',
          description: 'Solicitar ajustes de verba em campanhas',
          value: 'budget-adjustment',
          emoji: '💰',
          default: selectedCategory === 'budget-adjustment',
        },
      ]);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select,
    );
  }

  private createTeamSelectMenu(
    clientId: string,
    selectedTeam?: string,
  ): ActionRowBuilder<StringSelectMenuBuilder> {
    const select = new StringSelectMenuBuilder()
      .setCustomId(`select_team_${clientId}`)
      .setPlaceholder(
        selectedTeam
          ? `Equipe: ${this.getTeamDisplayName(selectedTeam)}`
          : 'Selecione a equipe responsável',
      )
      .setDisabled(false) // Sempre habilitado para permitir mudança
      .addOptions([
        {
          label: 'Suporte Técnico',
          description: 'Equipe de suporte técnico',
          value: 'suporte',
          emoji: '🔧',
          default: selectedTeam === 'suporte',
        },
        {
          label: 'Customer Success',
          description: 'Equipe de Customer Success',
          value: 'cs',
          emoji: '💼',
          default: selectedTeam === 'cs',
        },
        {
          label: 'Tráfego Pago',
          description: 'Equipe de tráfego pago',
          value: 'trafico',
          emoji: '📈',
          default: selectedTeam === 'trafico',
        },
      ]);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select,
    );
  }

  private createPrioritySelectMenu(
    clientId: string,
    selectedPriority?: string,
  ): ActionRowBuilder<StringSelectMenuBuilder> {
    const select = new StringSelectMenuBuilder()
      .setCustomId(`select_priority_${clientId}`)
      .setPlaceholder(
        selectedPriority
          ? `Prioridade: ${this.getPriorityDisplayName(selectedPriority)}`
          : 'Selecione a prioridade do ticket',
      )
      .setDisabled(false) // Sempre habilitado para permitir mudança
      .addOptions([
        {
          label: 'Alta',
          description: 'Prioridade alta - urgente',
          value: 'high',
          emoji: '🔴',
          default: selectedPriority === 'high',
        },
        {
          label: 'Média',
          description: 'Prioridade média - normal',
          value: 'medium',
          emoji: '🟡',
          default: selectedPriority === 'medium',
        },
        {
          label: 'Baixa',
          description: 'Prioridade baixa - pode aguardar',
          value: 'low',
          emoji: '🟢',
          default: selectedPriority === 'low',
        },
      ]);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select,
    );
  }

  private async handleCorrectionTaggingFlow(interaction: any) {
    try {
      // Buscar clientes na Leadfy
      const clients = await this.correctionTaggingService.getAllClients();

      if (clients.length === 0) {
        await interaction.editReply({
          content:
            '❌ Nenhum cliente encontrado na Leadfy. Tente novamente mais tarde.',
        });
        return;
      }

      // Mostrar seleção de cliente
      const embed = CorrectionTaggingForm.createClientSelectionEmbed(clients);
      const buttonRows =
        CorrectionTaggingForm.createClientSelectionButtons(clients);

      await interaction.editReply({
        embeds: [embed],
        components: buttonRows,
      });
    } catch (error) {
      this.logger.error('Erro no fluxo de correção de tagueamento:', error);
      await interaction.editReply({
        content: '❌ Erro ao buscar clientes. Tente novamente.',
      });
    }
  }

  private async handleNewTaggingFlow(interaction: any) {
    try {
      // Buscar clientes na Leadfy
      const clients = await this.newTaggingService.getAllClients();

      if (clients.length === 0) {
        await interaction.editReply({
          content:
            '❌ Nenhum cliente encontrado na Leadfy. Tente novamente mais tarde.',
        });
        return;
      }

      // Mostrar seleção de cliente
      const embed = NewTaggingForm.createClientSelectionEmbed(clients);
      const buttonRows = NewTaggingForm.createClientSelectionButtons(clients);

      await interaction.editReply({
        embeds: [embed],
        components: buttonRows,
      });
    } catch (error) {
      this.logger.error('Erro no fluxo de novo tagueamento:', error);
      await interaction.editReply({
        content: '❌ Erro ao buscar clientes. Tente novamente.',
      });
    }
  }

  async handleSelectMenuInteraction(interaction: any) {
    const customId = interaction.customId;

    if (customId.startsWith('select_category_')) {
      const clientId = customId.replace('select_category_', '');
      const category = interaction.values[0];
      await this.handleCategorySelected(interaction, clientId, category);
    } else if (customId.startsWith('select_team_')) {
      const clientId = customId.replace('select_team_', '');
      const team = interaction.values[0];
      await this.handleTeamSelected(interaction, clientId, team);
    } else if (customId.startsWith('select_priority_')) {
      const clientId = customId.replace('select_priority_', '');
      const priority = interaction.values[0];
      await this.handlePrioritySelected(interaction, clientId, priority);
    } else {
      // Para outros tipos de seleção, responder com erro
      await interaction.reply({
        content: '❌ Tipo de seleção não reconhecido.',
        ephemeral: true,
      });
    }
  }

  private async handleCategorySelected(
    interaction: any,
    clientId: string,
    category: string,
  ) {
    try {
      // Defer a resposta para select menus
      await interaction.deferUpdate();

      // Armazenar a categoria selecionada na sessão do usuário
      const sessionKey = `${interaction.user.id}_${clientId}`;
      if (!this.userSessions.has(sessionKey)) {
        this.userSessions.set(sessionKey, { clientId });
      }
      const session = this.userSessions.get(sessionKey);
      session.category = category;
      // Limpar seleções anteriores ao trocar categoria
      delete session.team;
      delete session.priority;
      this.userSessions.set(sessionKey, session);

      // Buscar dados do cliente
      const clients = await this.correctionTaggingService.getAllClients();
      const selectedClient = clients.find((client) => client.id == clientId);

      if (!selectedClient) {
        await interaction.editReply({
          content: '❌ Cliente não encontrado. Tente novamente.',
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Configuração do Ticket')
        .setDescription(
          `Cliente: **${selectedClient.name}**\nCategoria: **${
            category === 'correction-tagging'
              ? 'Correção de Tagueamento'
              : category === 'new-tagging'
                ? 'Novo Tagueamento'
                : category === 'budget-adjustment'
                  ? 'Ajuste de Verba'
                  : 'Desconhecida'
          }**\n\n⚠️ Categoria alterada! Selecione novamente a equipe e prioridade.`,
        )
        .setColor(0xffaa00)
        .setFooter({ text: 'Configure a equipe e prioridade' });

      // Mostrar todos os menus, mas com categoria desabilitada
      const categorySelect = this.createCategorySelectMenu(clientId, category);
      const teamSelect = this.createTeamSelectMenu(clientId);
      const prioritySelect = this.createPrioritySelectMenu(clientId);

      await interaction.editReply({
        embeds: [embed],
        components: [categorySelect, teamSelect, prioritySelect],
      });
    } catch (error) {
      this.logger.error('Erro ao processar seleção de categoria:', error);
      await interaction.editReply({
        content: '❌ Erro ao processar seleção. Tente novamente.',
      });
    }
  }

  private async handleTeamSelected(
    interaction: any,
    clientId: string,
    team: string,
  ) {
    try {
      // Defer a resposta para select menus
      await interaction.deferUpdate();

      // Armazenar a equipe selecionada na sessão do usuário
      const sessionKey = `${interaction.user.id}_${clientId}`;
      if (!this.userSessions.has(sessionKey)) {
        this.userSessions.set(sessionKey, { clientId });
      }
      const session = this.userSessions.get(sessionKey);
      session.team = team;
      this.userSessions.set(sessionKey, session);

      // Buscar dados do cliente
      const clients = await this.correctionTaggingService.getAllClients();
      const selectedClient = clients.find((client) => client.id == clientId);

      if (!selectedClient) {
        await interaction.editReply({
          content: '❌ Cliente não encontrado. Tente novamente.',
        });
        return;
      }

      const categoryText =
        session?.category === 'correction-tagging'
          ? 'Correção de Tagueamento'
          : session?.category === 'new-tagging'
            ? 'Novo Tagueamento'
            : session?.category === 'budget-adjustment'
              ? 'Ajuste de Verba'
              : 'Desconhecida';

      const embed = new EmbedBuilder()
        .setTitle('🎫 Configuração do Ticket')
        .setDescription(
          `Cliente: **${selectedClient.name}**\nCategoria: **${categoryText}**\nEquipe: **${team}**`,
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Configure a prioridade' });

      // Mostrar todos os menus, mas com equipe desabilitada
      const categorySelect = this.createCategorySelectMenu(
        clientId,
        session?.category,
      );
      const teamSelect = this.createTeamSelectMenu(clientId, team);
      const prioritySelect = this.createPrioritySelectMenu(clientId);

      await interaction.editReply({
        embeds: [embed],
        components: [categorySelect, teamSelect, prioritySelect],
      });
    } catch (error) {
      this.logger.error('Erro ao processar seleção de equipe:', error);
      await interaction.editReply({
        content: '❌ Erro ao processar seleção. Tente novamente.',
      });
    }
  }

  private async handlePrioritySelected(
    interaction: any,
    clientId: string,
    priority: string,
  ) {
    try {
      // Defer a resposta para select menus
      await interaction.deferUpdate();

      // Armazenar a prioridade selecionada na sessão do usuário
      const sessionKey = `${interaction.user.id}_${clientId}`;
      if (!this.userSessions.has(sessionKey)) {
        this.userSessions.set(sessionKey, { clientId });
      }
      const session = this.userSessions.get(sessionKey);
      session.priority = priority;
      this.userSessions.set(sessionKey, session);

      // Buscar dados do cliente
      const clients = await this.correctionTaggingService.getAllClients();
      const selectedClient = clients.find((client) => client.id == clientId);

      if (!selectedClient) {
        await interaction.editReply({
          content: '❌ Cliente não encontrado. Tente novamente.',
        });
        return;
      }

      const categoryText =
        session?.category === 'correction-tagging'
          ? 'Correção de Tagueamento'
          : session?.category === 'new-tagging'
            ? 'Novo Tagueamento'
            : session?.category === 'budget-adjustment'
              ? 'Ajuste de Verba'
              : 'Desconhecida';
      const priorityText =
        priority === 'high'
          ? 'Alta'
          : priority === 'medium'
            ? 'Média'
            : 'Baixa';

      const embed = new EmbedBuilder()
        .setTitle('🎫 Configuração Completa')
        .setDescription(
          `Cliente: **${selectedClient.name}**\nCategoria: **${categoryText}**\nEquipe: **${session?.team}**\nPrioridade: **${priorityText}**`,
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Agora preencha o formulário específico' });

      // Mostrar todos os menus desabilitados e botão para formulário
      const categorySelect = this.createCategorySelectMenu(
        clientId,
        session?.category,
      );
      const teamSelect = this.createTeamSelectMenu(clientId, session?.team);
      const prioritySelect = this.createPrioritySelectMenu(clientId, priority);

      // Criar botão para abrir o formulário
      const button = new ButtonBuilder()
        .setCustomId(`open_form_${clientId}`)
        .setLabel('Preencher Formulário')
        .setStyle(ButtonStyle.Success);

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        button,
      );

      await interaction.editReply({
        embeds: [embed],
        components: [categorySelect, teamSelect, prioritySelect, buttonRow],
      });
    } catch (error) {
      this.logger.error('Erro ao processar seleção de prioridade:', error);
      await interaction.editReply({
        content: '❌ Erro ao processar seleção. Tente novamente.',
      });
    }
  }

  private async handleOpenForm(interaction: any, clientId: string) {
    try {
      // Buscar dados da sessão do usuário
      const sessionKey = `${interaction.user.id}_${clientId}`;
      const session = this.userSessions.get(sessionKey);

      if (!session) {
        await interaction.reply({
          content: '❌ Sessão expirada. Tente criar o ticket novamente.',
          ephemeral: true,
        });
        return;
      }

      const category = session.category || 'correction-tagging';
      const team = session.team || 'suporte';
      const priority = session.priority || 'medium';

      // Buscar dados do cliente baseado na categoria
      let clients;
      if (category === 'budget-adjustment') {
        clients = await this.budgetAdjustmentService.getAllClients();
      } else {
        clients = await this.correctionTaggingService.getAllClients();
      }
      const selectedClient = clients.find((client) => client.id == clientId);

      if (!selectedClient) {
        await interaction.reply({
          content: '❌ Cliente não encontrado. Tente novamente.',
          ephemeral: true,
        });
        return;
      }

      // Criar modal baseado na categoria
      if (category === 'correction-tagging') {
        const modal = CorrectionTaggingForm.createModal(
          clientId,
          selectedClient,
          team,
          priority,
        );
        await interaction.showModal(modal);
      } else if (category === 'new-tagging') {
        const modal = NewTaggingForm.createModal(
          clientId,
          selectedClient,
          team,
          priority,
        );
        await interaction.showModal(modal);
      } else if (category === 'budget-adjustment') {
        const modal = BudgetAdjustmentForm.createFormModal();
        await interaction.showModal(modal);
      } else {
        await interaction.reply({
          content: '❌ Categoria não reconhecida.',
          ephemeral: true,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao abrir formulário:', error);
      await interaction.reply({
        content: '❌ Erro ao abrir formulário. Tente novamente.',
        ephemeral: true,
      });
    }
  }

  async handleModalSubmit(interaction: any) {
    await this.formHandlerService.handleModalSubmit(interaction);
  }

  private getTeamDisplayName(team: string): string {
    switch (team) {
      case 'suporte':
        return 'Suporte Técnico';
      case 'cs':
        return 'Customer Success';
      case 'trafico':
        return 'Tráfego Pago';
      default:
        return 'Desconhecida';
    }
  }

  private getPriorityDisplayName(priority: string): string {
    switch (priority) {
      case 'high':
        return '🔴 Alta';
      case 'medium':
        return '🟡 Média';
      case 'low':
        return '🟢 Baixa';
      default:
        return 'Desconhecida';
    }
  }

  private buildHelpEmbed(topic: string) {
    const embed = new EmbedBuilder();

    if (topic === 'criar') {
      embed
        .setTitle('🎟️ Criar ticket')
        .setDescription('Use o comando abaixo para abrir um ticket e falar com a equipe.')
        .addFields(
          {
            name: 'Sintaxe',
            value: '`/criar-ticket cliente:<nome>`\nEscolha o cliente pelo autocomplete.',
          },
          {
            name: 'Exemplo',
            value: '`/criar-ticket cliente: ACME Ltd`',
          },
          {
            name: 'Como funciona',
            value:
              'Após criar, uma thread é aberta para conversar com a equipe. Escreva suas mensagens dentro da thread.',
          },
          {
            name: 'Erros comuns',
            value:
              '• Cliente não selecionado → selecione uma opção do autocomplete.\n• Canal inválido → use o canal indicado pela equipe (se aplicável).',
          },
        )
        .setColor(0x5865f2);
      return embed;
    }

    if (topic === 'botoes') {
      embed
        .setTitle('🔘 Botões do ticket')
        .setDescription('Gerencie seu ticket usando os botões na mensagem do ticket ou na thread.')
        .addFields(
          {
            name: 'Ações padrão',
            value:
              '• 👤 **Puxar para mim**: você se torna o responsável pelo ticket.\n• ⏳ **Aguardando cliente**: marca que estamos aguardando resposta do cliente.\n• 📁 **Arquivar**: encerra o ticket e arquiva a thread.',
          },
          {
            name: 'Ações contextuais',
            value:
              '• **Prioridade** (ex.: Alta) e **Formulários** podem aparecer conforme o fluxo.',
          },
          {
            name: 'Regras e dicas',
            value:
              '• Arquivar encerra o ticket (status fechado).\n• Algumas ações exigem permissões.\n• Confira se está na thread correta antes de clicar.',
          },
        )
        .setColor(0x5865f2);
      return embed;
    }

    // padrão: geral
    embed
      .setTitle('🎫 Como usar tickets')
      .setDescription(
        'Crie um ticket com `/criar-ticket cliente:<nome>`, converse com a equipe na thread criada e use os botões para gerenciar.',
      )
      .addFields(
        {
          name: 'Passo a passo',
          value:
            '1) Use `/criar-ticket` e selecione o cliente pelo autocomplete.\n2) Fale com a equipe na thread do ticket.\n3) Use os botões (👤 Puxar, ⏳ Aguardando cliente, 📁 Arquivar) quando necessário.',
        },
        {
          name: 'Dicas rápidas',
          value:
            '• Um ticket por assunto.\n• Evite dados sensíveis.\n• Se um botão não responder, tente novamente ou avise a equipe.',
        },
      )
      .setColor(0x5865f2);
    return embed;
  }

  private async handleHelpCommand(interaction: any, options: any) {
    try {
      const topic = options?.getString?.('topico') || 'geral';
      const embed = this.buildHelpEmbed(topic);

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      this.logger.error('Erro ao exibir ajuda:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ Não foi possível exibir a ajuda no momento.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: '❌ Não foi possível exibir a ajuda no momento.',
          ephemeral: true,
        });
      }
    }
  }
}
