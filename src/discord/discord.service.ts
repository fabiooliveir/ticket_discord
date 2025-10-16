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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
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
import { GeneralForm } from '../modules/tickets/categories/general/general.form';
import { MessageHandlerService } from './message-handler.service';
import { MessageCaptureService } from './services/message-capture.service';
import { SlaCalculator } from '../shared/utils/sla-calculator.util';
import {
  SlaCategories,
  TicketPriority,
} from '../shared/enums/sla-categories.enum';
import { TaskType } from '../shared/enums/task-type.enum';

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
    private readonly messageCaptureService: MessageCaptureService,
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
        name: 'criar-ticket-c7auto',
        description: 'Cria um novo ticket para C7 Auto',
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
      case 'criar-ticket-c7auto':
        await this.handleCreateC7AutoTicketSlash(interaction);
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
      const currentTeam = teams.find((team) => team.channelId === channelId);

      if (!currentTeam) {
        await interaction.editReply({
          content:
            '❌ Este comando só pode ser usado nos canais das equipes (Suporte, CS ou Tráfego).',
        });
        return;
      }

      // Verificar se o usuário tem acesso ao canal da equipe
      const hasAccess = await this.teamsService.hasChannelAccess(
        interaction.user.id,
        currentTeam,
      );
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

      if (
        error?.message?.includes('Missing Access') ||
        error?.message?.includes('Missing Permissions')
      ) {
        errorMessage =
          '❌ Você não tem permissão para acessar o canal da equipe.';
      } else if (
        error?.message?.includes('Canal') &&
        error?.message?.includes('não encontrado')
      ) {
        errorMessage =
          '❌ Canal da equipe não encontrado. Verifique a configuração.';
      }

      await interaction.editReply({
        content: errorMessage,
      });
    }
  }

  // Método para lidar com o comando criar-ticket-c7auto
  private async handleCreateC7AutoTicketSlash(interaction: any) {
    try {
      // Verificar se o canal C7 Auto está configurado
      const c7AutoChannelId = this.config.DISCORD_C7AUTO_CHANNEL_ID;
      if (!c7AutoChannelId) {
        await interaction.reply({
          content:
            '❌ Canal C7 Auto não configurado. Entre em contato com o administrador.',
          ephemeral: true,
        });
        return;
      }

      // Criar modal para capturar os dados
      const modal = new ModalBuilder()
        .setCustomId('c7auto_ticket_modal')
        .setTitle('Criar Ticket C7 Auto');

      // Campo título
      const titleInput = new TextInputBuilder()
        .setCustomId('c7auto_title')
        .setLabel('Título do Ticket')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Digite um título descritivo para o ticket')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(100);

      // Campo nome do cliente
      const clientNameInput = new TextInputBuilder()
        .setCustomId('c7auto_client_name')
        .setLabel('Nome do Cliente')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Digite o nome do cliente da C7 Auto')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(100);

      // Campo descrição
      const descriptionInput = new TextInputBuilder()
        .setCustomId('c7auto_description')
        .setLabel('Descrição')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Descreva detalhadamente a demanda do cliente')
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(1000);

      // Adicionar componentes ao modal
      const titleRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          titleInput,
        );
      const clientNameRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          clientNameInput,
        );
      const descriptionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          descriptionInput,
        );

      modal.addComponents(titleRow, clientNameRow, descriptionRow);

      // Mostrar o modal
      await interaction.showModal(modal);

      this.logger.log(`Modal C7 Auto exibido para ${interaction.user.tag}`);
    } catch (error) {
      this.logger.error('Erro ao exibir modal C7 Auto:', error);

      let errorMessage = '❌ Erro interno ao criar ticket C7 Auto.';

      if (error?.code === 50001 || error?.code === 50013) {
        errorMessage = '❌ Permissões insuficientes para criar ticket C7 Auto.';
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: errorMessage,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
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
      authorId: string; // novo
      formData?: any; // Dados do formulário
    },
  ): Promise<ThreadChannel | null> {
    try {
      // Determinar canal baseado na categoria
      let targetChannelId = team.channelId;
      
      // Canal específico para tickets de Ativação
      if (ticketData.category === 'Ativação') {
        const activationChannelId = this.config.DISCORD_ACTIVATION_CHANNEL_ID;
        if (activationChannelId) {
          targetChannelId = activationChannelId;
          this.logger.log(`Ticket de Ativação direcionado para canal específico: ${targetChannelId}`);
        } else {
          this.logger.warn('Canal de Ativação não configurado, usando canal padrão da equipe');
        }
      }
      
      const channel = await this.teamsService.discordBot.client.channels.fetch(
        targetChannelId,
      );

      if (!channel || !channel.isTextBased()) {
        this.logger.error(
          `Canal ${targetChannelId} não encontrado ou não é de texto`,
        );
        return null;
      }

      // Verificar se é um canal de texto ou notícias (que suportam threads)
      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildNews
      ) {
        this.logger.error(`Canal ${targetChannelId} não suporta threads`);
        return null;
      }

      // Criar thread com nome do ticket
      const threadName = `🔴 🎫 ${ticketData.clientName}`.substring(0, 100);

      let thread: ThreadChannel;
      try {
        // Tentar criar thread privada primeiro
        thread = await (channel as any).threads.create({
          name: threadName,
          autoArchiveDuration: 10080, // 7 dias (máximo permitido pelo Discord)
          reason: `Ticket criado por ${ticketData.author}`,
          type: ChannelType.PrivateThread,
        });
      } catch (privateError) {
        this.logger.warn(
          `Não foi possível criar thread privada, criando thread pública: ${String(privateError)}`,
        );
        // Fallback para thread pública se não tiver permissão para thread privada
        thread = await (channel as any).threads.create({
          name: threadName,
          autoArchiveDuration: 10080,
          reason: `Ticket criado por ${ticketData.author}`,
        });
      }

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

      // Adicionar campos do formulário de forma genérica para TODAS as categorias
      if (ticketData.formData) {
        // Obter a categoria para mapear os campos
        const categoryId = this.getCategoryIdByName(ticketData.category);
        const category = this.ticketCategoryService.getCategory(categoryId);
        
        if (category && category.formFields) {
          // Adicionar campos baseados na configuração da categoria
          category.formFields.forEach(field => {
            const value = ticketData.formData[field.id];
            if (value !== undefined && value !== null && value !== '') {
              embed = embed.addFields({
                name: field.label,
                value: value.toString(),
                inline: false,
              });
            }
          });
        } else {
          // Fallback: adicionar todos os campos disponíveis no formData
          Object.entries(ticketData.formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              // Capitalizar a primeira letra e substituir camelCase por espaços
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              embed = embed.addFields({
                name: label,
                value: value.toString(),
                inline: false,
              });
            }
          });
        }
      }

      // Botão para puxar ticket
      const pullButton = new ButtonBuilder()
        .setCustomId(`pull_ticket_${ticketData.id}`)
        .setLabel('Puxar para mim')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👤');

      // Botão para transferir ticket
      const transferButton = new ButtonBuilder()
        .setCustomId(`transfer_ticket_${ticketData.id}`)
        .setLabel('Transferir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄');

      // Botão para arquivar thread
      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketData.id}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        pullButton,
        transferButton,
        archiveButton,
      );

      // Adicionar o autor como membro da thread privada
      try {
        if (ticketData.authorId && thread.type === ChannelType.PrivateThread) {
          await thread.members.add(ticketData.authorId);
          this.logger.log(
            `Autor ${ticketData.authorId} adicionado à thread privada ${thread.id}`,
          );
        }
      } catch (addErr) {
        this.logger.warn(
          `Não foi possível adicionar o autor à thread: ${String(addErr)}`,
        );
      }

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
        throw new Error(
          'Missing Access: Você não tem permissão para criar threads neste canal.',
        );
      } else if (error?.code === 10003) {
        throw new Error(
          'Canal não encontrado: O canal da equipe não existe ou foi removido.',
        );
      } else if (error?.message?.includes('Missing Access')) {
        throw new Error('Missing Access: Acesso negado ao canal da equipe.');
      } else if (error?.message?.includes('Missing Permissions')) {
        throw new Error(
          'Missing Permissions: Permissões insuficientes para criar thread.',
        );
      }

      throw error; // Re-lançar erro original se não for mapeado
    }
  }

  // Método para criar thread específica para C7 Auto
  async createC7AutoThread(ticketData: {
    id: string;
    title: string;
    clientName: string;
    description: string;
    author: string;
    authorId: string;
  }): Promise<ThreadChannel | null> {
    try {
      const c7AutoChannelId = this.config.DISCORD_C7AUTO_CHANNEL_ID;
      const suporteRoleId = this.config.SUPORTE_ROLE_ID;

      if (!c7AutoChannelId || !suporteRoleId) {
        this.logger.error(
          'DISCORD_C7AUTO_CHANNEL_ID ou SUPORTE_ROLE_ID não configurados',
        );
        return null;
      }

      const channel =
        await this.teamsService.discordBot.client.channels.fetch(
          c7AutoChannelId,
        );

      if (!channel || !channel.isTextBased()) {
        this.logger.error(
          `Canal C7 Auto ${c7AutoChannelId} não encontrado ou não é de texto`,
        );
        return null;
      }

      // Verificar se é um canal de texto ou notícias (que suportam threads)
      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildNews
      ) {
        this.logger.error(
          `Canal C7 Auto ${c7AutoChannelId} não suporta threads`,
        );
        return null;
      }

      // Criar thread com nome do ticket
      const threadName =
        `🔴 🎫 ${ticketData.title} — ${ticketData.clientName}`.substring(
          0,
          100,
        );

      let thread: ThreadChannel;
      try {
        // Criar thread privada
        thread = await (channel as any).threads.create({
          name: threadName,
          autoArchiveDuration: 10080, // 7 dias (máximo permitido pelo Discord)
          reason: `Ticket C7 Auto criado por ${ticketData.author}`,
          type: ChannelType.PrivateThread,
        });
      } catch (privateError) {
        this.logger.warn(
          `Não foi possível criar thread privada C7 Auto, criando thread pública: ${String(privateError)}`,
        );
        // Fallback para thread pública se não tiver permissão para thread privada
        thread = await (channel as any).threads.create({
          name: threadName,
          autoArchiveDuration: 10080,
          reason: `Ticket C7 Auto criado por ${ticketData.author}`,
        });
      }

      // Criar embed inicial do ticket C7 Auto
      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket C7 Auto #${ticketData.id}`)
        .setDescription(
          `**Cliente:** ${ticketData.clientName}\n**Título:** ${ticketData.title}`,
        )
        .addFields(
          {
            name: 'Descrição',
            value: ticketData.description,
            inline: false,
          },
          {
            name: 'Status',
            value: '🔴 **NA FILA** - Aguardando atendimento',
            inline: true,
          },
          { name: 'Equipe', value: 'Suporte', inline: true },
          { name: 'Responsável', value: 'Aguardando atribuição', inline: true },
        )
        .setColor(0xff0000) // Vermelho para fila
        .setTimestamp()
        .setFooter({ text: `Criado por ${ticketData.author}` });

      // Botões padrão (mesmos dos demais tickets)
      const pullButton = new ButtonBuilder()
        .setCustomId(`pull_ticket_${ticketData.id}`)
        .setLabel('Puxar para mim')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👤');

      const transferButton = new ButtonBuilder()
        .setCustomId(`transfer_ticket_${ticketData.id}`)
        .setLabel('Transferir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄');

      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketData.id}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        pullButton,
        transferButton,
        archiveButton,
      );

      // Configurar permissões da thread privada
      try {
        if (thread.type === ChannelType.PrivateThread) {
          // Adicionar o autor como membro da thread
          await thread.members.add(ticketData.authorId);
          this.logger.log(
            `Autor ${ticketData.authorId} adicionado à thread privada C7 Auto ${thread.id}`,
          );

          // Configurar permissões para a equipe de suporte
          await (thread as any).permissionOverwrites.create(suporteRoleId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });

          // Negar acesso para @everyone
          await (thread as any).permissionOverwrites.create(
            thread.guild.roles.everyone,
            {
              ViewChannel: false,
            },
          );

          this.logger.log(
            `Permissões configuradas para thread C7 Auto ${thread.id}`,
          );
        }
      } catch (permError) {
        this.logger.warn(
          `Erro ao configurar permissões da thread C7 Auto: ${String(permError)}`,
        );
      }

      // Enviar mensagem inicial na thread
      await thread.send({
        content: `<@&${suporteRoleId}> - Novo ticket C7 Auto criado!`,
        embeds: [embed],
        components: [buttonRow],
      });

      this.logger.log(`Thread C7 Auto criada: ${thread.name} (${thread.id})`);
      return thread;
    } catch (error) {
      this.logger.error('Erro ao criar thread C7 Auto:', error);

      // Re-lançar erro com mensagem específica para ser capturada pelo handler
      if (error?.code === 50001 || error?.code === 50013) {
        throw new Error(
          'Missing Access: Você não tem permissão para criar threads no canal C7 Auto.',
        );
      } else if (error?.code === 10003) {
        throw new Error(
          'Canal não encontrado: O canal C7 Auto não existe ou foi removido.',
        );
      } else if (error?.message?.includes('Missing Access')) {
        throw new Error('Missing Access: Acesso negado ao canal C7 Auto.');
      } else if (error?.message?.includes('Missing Permissions')) {
        throw new Error(
          'Missing Permissions: Permissões insuficientes para criar thread C7 Auto.',
        );
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
      trafego: 'Tráfego Pago',
      financeiro: 'Financeiro',
    };

    const teamName = teamMapping[teamValue] || teamValue;
    return teams.find((team) => team.name === teamName) || teams[0]; // Fallback para suporte
  }

  // Método para obter chave da equipe por ID do canal
  private getTeamKeyByChannelId(channelId: string): string {
    const teams = this.teamsService.getTeamsConfig();
    const team = teams.find((t) => t.channelId === channelId);

    if (!team) return 'suporte'; // Fallback

    // Mapear nome da equipe para chave
    const nameToKey = {
      'Suporte Técnico': 'suporte',
      'Customer Success': 'cs',
      'Tráfego Pago': 'trafego',
      Financeiro: 'financeiro',
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
    } else if (customId.startsWith('toggle_pause_')) {
      const ticketId = customId.replace('toggle_pause_', '');
      await this.handleTogglePause(interaction, ticketId);
    } else if (customId.startsWith('waiting_client_')) {
      // Compatibilidade com mensagens antigas: tratar como toggle de pausa
      const ticketId = customId.replace('waiting_client_', '');
      await this.handleTogglePause(interaction, ticketId);
    } else if (customId.startsWith('transfer_ticket_')) {
      const ticketId = customId.replace('transfer_ticket_', '');
      await this.handleTransferTicket(interaction, ticketId);
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

      // Atualizar nome da thread para indicar que foi atribuído (emoji verde ativo)
      if (interaction.channel && interaction.channel.isThread()) {
        const username =
          interaction.user.username || interaction.user.tag.split('#')[0];
        const newThreadName = `🟢 🎫 ${username} | ${ticket.metadata?.clientName || 'Cliente'}`;
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
            value: ticket.metadata?.assignedTeam || 'N/A',
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

      // Adicionar campos do formulário de forma genérica para TODAS as categorias
      if (ticket.metadata?.formData) {
        // Obter a categoria para mapear os campos
        const categoryId = this.getCategoryIdByName(ticket.metadata.category);
        const category = this.ticketCategoryService.getCategory(categoryId);
        
        if (category && category.formFields) {
          // Adicionar campos baseados na configuração da categoria
          category.formFields.forEach(field => {
            const value = ticket.metadata.formData[field.id];
            if (value !== undefined && value !== null && value !== '') {
              updatedEmbed = updatedEmbed.addFields({
                name: field.label,
                value: value.toString(),
                inline: false,
              });
            }
          });
        } else {
          // Fallback: adicionar todos os campos disponíveis no formData
          Object.entries(ticket.metadata.formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              // Capitalizar a primeira letra e substituir camelCase por espaços
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              updatedEmbed = updatedEmbed.addFields({
                name: label,
                value: value.toString(),
                inline: false,
              });
            }
          });
        }
      }

      // Botões atualizados (toggle pausa)
      const isPaused =
        ticket.status === 'pause' || ticket.status === 'waiting_client';
      const togglePauseButton = new ButtonBuilder()
        .setCustomId(`toggle_pause_${ticketId}`)
        .setLabel(isPaused ? 'Retomar' : 'Pausar')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji(isPaused ? '▶️' : '⏸️');

      const transferButton = new ButtonBuilder()
        .setCustomId(`transfer_ticket_${ticketId}`)
        .setLabel('Transferir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄');

      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketId}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        togglePauseButton,
        transferButton,
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
        ticket.metadata?.assignedTeam || 'Suporte Técnico',
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

      // Mantido para compatibilidade; use handleTogglePause em novos fluxos
      await this.handleTogglePause(interaction, ticketId);
    } catch (error) {
      this.logger.error('Erro ao alterar status do ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao alterar status. Tente novamente.',
        ephemeral: true,
      });
    }
  }

  private async handleTogglePause(interaction: any, ticketId: string) {
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

      // Apenas o responsável pode alternar pausa
      if (ticket.assignedTo !== interaction.user.id) {
        await interaction.reply({
          content: '❌ Apenas o responsável pelo ticket pode alternar pausa!',
          ephemeral: true,
        });
        return;
      }

      const isPaused =
        ticket.status === 'pause' || ticket.status === 'waiting_client';
      const nextStatus = isPaused ? 'in_progress' : 'pause';

      await this.ticketRepository.update(ticketId, {
        status: nextStatus,
        metadata: {
          ...ticket.metadata,
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: interaction.user.id,
        } as Record<string, any>,
      });

      // Atualizar embed conforme o próximo estado
      const statusEmoji = isPaused ? '🟢' : '⏸️';
      const statusText = isPaused
        ? '**EM ANDAMENTO**'
        : '**PAUSADO** - Aguardando';

      let updatedEmbed = new EmbedBuilder()
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
            value: ticket.metadata?.assignedTeam || 'N/A',
            inline: true,
          },
          {
            name: 'Responsável',
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
        )
        .setColor(isPaused ? 0x00ff00 : 0xffaa00)
        .setTimestamp()
        .setFooter({ text: `Status alterado por ${interaction.user.tag}` });

      // Adicionar campos do formulário de forma genérica para TODAS as categorias
      if (ticket.metadata?.formData) {
        // Obter a categoria para mapear os campos
        const categoryId = this.getCategoryIdByName(ticket.metadata.category);
        const category = this.ticketCategoryService.getCategory(categoryId);
        
        if (category && category.formFields) {
          // Adicionar campos baseados na configuração da categoria
          category.formFields.forEach(field => {
            const value = ticket.metadata.formData[field.id];
            if (value !== undefined && value !== null && value !== '') {
              updatedEmbed = updatedEmbed.addFields({
                name: field.label,
                value: value.toString(),
                inline: false,
              });
            }
          });
        } else {
          // Fallback: adicionar todos os campos disponíveis no formData
          Object.entries(ticket.metadata.formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              // Capitalizar a primeira letra e substituir camelCase por espaços
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              updatedEmbed = updatedEmbed.addFields({
                name: label,
                value: value.toString(),
                inline: false,
              });
            }
          });
        }
      }

      const togglePauseButton = new ButtonBuilder()
        .setCustomId(`toggle_pause_${ticketId}`)
        .setLabel(isPaused ? 'Pausar' : 'Retomar')
        .setStyle(isPaused ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setEmoji(isPaused ? '⏸️' : '▶️');

      const transferButton = new ButtonBuilder()
        .setCustomId(`transfer_ticket_${ticketId}`)
        .setLabel('Transferir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄');

      const archiveButton = new ButtonBuilder()
        .setCustomId(`archive_thread_${ticketId}`)
        .setLabel('Arquivar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁');

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        togglePauseButton,
        transferButton,
        archiveButton,
      );

      await interaction.update({
        embeds: [updatedEmbed],
        components: [buttonRow],
      });

      // Atualizar nome da thread mantendo o username do responsável
      if (interaction.channel && interaction.channel.isThread()) {
        try {
          const username =
            interaction.user.username || interaction.user.tag.split('#')[0];
          const clientNameFromMeta = ticket.metadata?.clientName;
          // Se por algum motivo o nome do cliente não estiver no metadata, tenta extrair do nome atual da thread
          const currentName = (interaction.channel as any).name || '';
          const extractedClientName = currentName.includes('|')
            ? currentName.split('|').slice(-1)[0].trim()
            : currentName.includes('🎫')
              ? currentName.split('🎫').slice(1).join('🎫').trim()
              : currentName;
          const safeClientName = (
            clientNameFromMeta ||
            extractedClientName ||
            'Cliente'
          ).substring(0, 100);
          const newThreadName = `🟢 🎫 ${username} | ${safeClientName}`;
          await interaction.channel.setName(newThreadName);
        } catch (renameErr) {
          this.logger.warn(
            `Não foi possível renomear a thread: ${String(renameErr)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Erro ao alternar pausa do ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao alternar pausa. Tente novamente.',
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

        // Capturar mensagens da thread antes de arquivar
        let capturedMessages: any[] = [];
        try {
          capturedMessages =
            await this.messageCaptureService.captureThreadMessages(
              interaction.channel as any,
              this.teamsService.discordBot.client.user?.id || '',
            );
          this.logger.log(
            `Capturadas ${capturedMessages.length} mensagens do ticket ${ticketId}`,
          );
        } catch (error) {
          this.logger.error('Erro ao capturar mensagens:', error);
        }

        // Atualizar status do ticket com SLA de duração E mensagens
        await this.ticketRepository.update(ticketId, {
          status: 'closed', // Mudança: 'closed' em vez de 'archived'
          closedAt: closedAt,
          durationTimeMinutes: durationTimeMinutes,
          durationSlaStatus: durationSlaStatus,
          messages: capturedMessages,
          metadata: {
            ...ticket.metadata,
            archivedBy: interaction.user.id,
            archivedAt: closedAt.toISOString(),
            durationSlaCalculated: true,
            durationSlaMethod: 'discord_archive',
            messagesCount: capturedMessages.length,
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

  private async handleTransferTicket(interaction: any, ticketId: string) {
    try {
      // Defer a resposta imediatamente para evitar timeout
      await interaction.deferReply({ ephemeral: true });

      // Buscar ticket no banco de dados
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.editReply({
          content: '❌ Ticket não encontrado!',
        });
        return;
      }

      // Determinar a equipe do ticket
      const team = this.getTeamByName(
        ticket.metadata?.assignedTeam || 'Suporte Técnico',
      );

      // Buscar membros da equipe
      const guild = this.teamsService.discordBot.client.guilds.cache.first();
      if (!guild) {
        await interaction.editReply({
          content: '❌ Não foi possível acessar o servidor Discord!',
        });
        return;
      }

      // Buscar todos os membros do servidor para garantir que o cache esteja completo
      await guild.members.fetch();

      const role = await guild.roles.fetch(team.roleId);
      if (!role) {
        await interaction.editReply({
          content: '❌ Cargo da equipe não encontrado!',
        });
        return;
      }

      const members = role.members;
      if (members.size === 0) {
        await interaction.editReply({
          content: '❌ Nenhum membro encontrado na equipe!',
        });
        return;
      }

      // Criar opções do select menu (máximo 25 opções)
      const options: Array<{
        label: string;
        description: string;
        value: string;
      }> = [];
      for (const [userId, member] of members) {
        if (options.length >= 25) break; // Limite do Discord

        options.push({
          label: member.displayName || member.user.username,
          description: `Transferir ticket para ${member.displayName || member.user.username}`,
          value: userId,
        });
      }

      // Criar select menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`transfer_select_${ticketId}`)
        .setPlaceholder(
          'Selecione um membro da equipe para transferir o ticket',
        )
        .addOptions(options);

      const selectRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          selectMenu,
        );

      await interaction.editReply({
        content: `🔄 **Transferir Ticket #${ticketId}**\nSelecione o membro da equipe para quem deseja transferir este ticket:`,
        components: [selectRow],
      });
    } catch (error) {
      this.logger.error('Erro ao transferir ticket:', error);
      try {
        await interaction.editReply({
          content: '❌ Erro ao transferir ticket. Tente novamente.',
        });
      } catch (replyError) {
        this.logger.error('Erro ao responder interação:', replyError);
      }
    }
  }

  private async handleTransferSelection(interaction: any, ticketId: string) {
    try {
      // Defer a resposta imediatamente para evitar timeout
      await interaction.deferReply({ ephemeral: true });

      // Obter o usuário selecionado
      const selectedUserId = interaction.values[0];
      const selectedMember =
        interaction.guild.members.cache.get(selectedUserId);

      if (!selectedMember) {
        await interaction.editReply({
          content: '❌ Membro selecionado não encontrado!',
        });
        return;
      }

      // Buscar ticket no banco de dados
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.editReply({
          content: '❌ Ticket não encontrado!',
        });
        return;
      }

      // Determinar se precisa atualizar o status (apenas se estiver 'open')
      const shouldUpdateStatus = ticket.status === 'open';

      // Atualizar ticket com status condicional
      const updateData: any = {
        assignedTo: selectedUserId,
      };

      if (shouldUpdateStatus) {
        updateData.status = 'assigned';
        updateData.metadata = {
          ...ticket.metadata,
          assignedAt: new Date().toISOString(),
        };
      }

      await this.ticketRepository.update(ticketId, updateData);

      // Atualizar nome da thread com o novo responsável
      if (interaction.channel && interaction.channel.isThread()) {
        const username =
          selectedMember.user.username || selectedMember.user.tag.split('#')[0];
        const newThreadName = `🟢 🎫 ${username} | ${ticket.metadata?.clientName || 'Cliente'}`;
        await interaction.channel.setName(newThreadName);
      }

      // Invalidar cache do ticket após atualização
      this.messageHandlerService.invalidateTicketCache(ticketId);

      // Enviar mensagem de confirmação no thread
      if (interaction.channel && interaction.channel.isThread()) {
        const embed = new EmbedBuilder()
          .setTitle('🔄 Ticket Transferido')
          .setDescription(
            `Ticket #${ticketId} foi transferido para <@${selectedUserId}> por <@${interaction.user.id}>`,
          )
          .setColor(0x4caf50)
          .setTimestamp()
          .setFooter({ text: `Transferido por ${interaction.user.tag}` });

        await interaction.channel.send({
          embeds: [embed],
        });
      }

      await interaction.editReply({
        content: `✅ Ticket transferido com sucesso para <@${selectedUserId}>!`,
      });

      this.logger.log(
        `Ticket ${ticketId} transferido para ${selectedMember.user.tag} por ${interaction.user.tag}`,
      );
    } catch (error) {
      this.logger.error('Erro ao processar seleção de transferência:', error);
      try {
        await interaction.editReply({
          content: '❌ Erro ao transferir ticket. Tente novamente.',
        });
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
                  : selectedCategory === 'general'
                    ? 'Geral'
                    : selectedCategory === 'activation'
                      ? 'Ativação'
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
        {
          label: 'Geral',
          description: 'Demandas gerais não categorizadas',
          value: 'general',
          emoji: '📋',
          default: selectedCategory === 'general',
        },
        {
          label: 'Ativação',
          description: 'Ativação de novos serviços ou funcionalidades',
          value: 'activation',
          emoji: '🚀',
          default: selectedCategory === 'activation',
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
          value: 'trafego',
          emoji: '📈',
          default: selectedTeam === 'trafego',
        },
        {
          label: 'Financeiro',
          description: 'Equipe financeira',
          value: 'financeiro',
          emoji: '💰',
          default: selectedTeam === 'financeiro',
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
    } else if (customId.startsWith('transfer_select_')) {
      const ticketId = customId.replace('transfer_select_', '');
      await this.handleTransferSelection(interaction, ticketId);
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
                  : category === 'general'
                    ? 'Geral'
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
              : session?.category === 'general'
                ? 'Geral'
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
              : session?.category === 'general'
                ? 'Geral'
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
      } else if (category === 'general') {
        const modal = GeneralForm.createModal(clientId);
        await interaction.showModal(modal);
      } else if (category === 'activation') {
        const modal = this.createActivationModal(clientId);
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
      case 'trafego':
        return 'Tráfego Pago';
      case 'financeiro':
        return 'Financeiro';
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
        .setDescription(
          'Use o comando abaixo para abrir um ticket e falar com a equipe.',
        )
        .addFields(
          {
            name: 'Sintaxe',
            value:
              '`/criar-ticket cliente:<nome>`\nEscolha o cliente pelo autocomplete.',
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
        .setDescription(
          'Gerencie seu ticket usando os botões na mensagem do ticket ou na thread.',
        )
        .addFields(
          {
            name: 'Ações padrão',
            value:
              '• 👤 **Puxar para mim**: você se torna o responsável pelo ticket.\n• ⏯️ **Pausar/Retomar**: alterna o estado do ticket entre em andamento e pausado.\n• 📁 **Arquivar**: encerra o ticket e arquiva a thread.',
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
            '1) Use `/criar-ticket` e selecione o cliente pelo autocomplete.\n2) Fale com a equipe na thread do ticket.\n3) Use os botões (👤 Puxar, ⏯️ Pausar/Retomar, 📁 Arquivar) quando necessário.',
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

  private getCategoryIdByName(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      'Correção de Tagueamento': 'correction-tagging',
      'Novo Tagueamento': 'new-tagging',
      'Ajuste de Verba': 'budget-adjustment',
      'Geral': 'general',
      'Ativação': 'activation',
      'C7 Auto': 'c7-auto',
    };
    return categoryMap[categoryName] || '';
  }

  private createActivationModal(clientId: string): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(`activation_form_${clientId}`)
      .setTitle('🚀 Ticket de Ativação');

    // Campo: Título
    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Título do Ticket')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Resumo breve da ativação...')
      .setRequired(true)
      .setMaxLength(100);

    // Campo: Descrição
    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Descrição Detalhada')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva detalhadamente a ativação...')
      .setRequired(true)
      .setMaxLength(2000);

    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      titleInput,
    );
    const descriptionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    modal.addComponents(titleRow, descriptionRow);

    return modal;
  }
}
