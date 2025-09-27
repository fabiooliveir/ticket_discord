import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { DiscordService } from './discord.service';

@Injectable()
export class DiscordBot implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordBot.name);
  public client: Client;
  public commands = new Collection<
    string,
    { execute: (interaction: any) => Promise<void> }
  >();

  constructor(
    @Inject('DISCORD_CONFIG') private readonly config: any,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });
  }

  async onModuleInit() {
    await this.setupBot();
    await this.login();
  }

  async onModuleDestroy() {
    if (this.client) {
      this.logger.log('🔌 Desconectando bot do Discord...');
      await this.client.destroy();
    }
  }

  private async setupBot() {
    this.logger.log('🤖 Configurando bot do Discord...');

    // Registrar comandos na collection
    this.commands.set('criar-ticket', {
      execute: async (interaction) => {
        await this.discordService.handleSlashCommand(interaction);
      },
    });

    // Evento de ready
    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.log(`✅ Bot ${readyClient.user.tag} está online!`);
      this.logger.log(
        `📊 Conectado em ${readyClient.guilds.cache.size} servidores`,
      );
    });

    // Evento de interação
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        const command = this.commands.get(interaction.commandName);
        if (!command) {
          this.logger.warn(`Comando ${interaction.commandName} não encontrado`);
          return;
        }

        try {
          if (typeof command.execute === 'function') {
            await command.execute(interaction);
            this.logger.log(
              `Comando ${interaction.commandName} executado por ${interaction.user.tag}`,
            );
          } else {
            this.logger.warn(
              `Comando ${interaction.commandName} não possui método execute`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao executar comando ${interaction.commandName}:`,
            error,
          );

          const errorMessage = {
            content: '❌ Ocorreu um erro ao executar este comando!',
            ephemeral: true,
          };

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        }
      } else if (interaction.isButton()) {
        await this.discordService.handleButtonInteraction(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this.discordService.handleSelectMenuInteraction(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.discordService.handleModalSubmit(interaction);
      } else if (interaction.isAutocomplete()) {
        await this.discordService.handleAutocomplete(interaction);
      }
    });

    // Evento de mensagem removido - apenas slash commands são suportados

    // Evento de erro
    this.client.on(Events.Error, (error) => {
      this.logger.error('Erro no cliente Discord:', error);
    });

    // Evento de warning
    this.client.on(Events.Warn, (warning) => {
      this.logger.warn('Warning do Discord:', warning);
    });
  }

  private async login() {
    try {
      this.logger.log('🔐 Conectando ao Discord...');
      await this.client.login(this.config.token);
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao Discord:', error);
      throw error;
    }
  }

  async registerCommands() {
    try {
      this.logger.log('📝 Registrando comandos slash...');

      const commands = await this.discordService.getSlashCommands();

      if (this.config.guildId) {
        // Registrar comandos para um servidor específico
        await this.client.rest.put(
          `/applications/${this.config.clientId}/guilds/${this.config.guildId}/commands`,
          { body: commands },
        );
        this.logger.log(
          `✅ Comandos registrados para o servidor ${this.config.guildId}`,
        );
      } else {
        // Registrar comandos globalmente
        await this.client.rest.put(
          `/applications/${this.config.clientId}/commands`,
          { body: commands },
        );
        this.logger.log('✅ Comandos registrados globalmente');
      }
    } catch (error) {
      this.logger.error('❌ Erro ao registrar comandos:', error);
      throw error;
    }
  }

  async getGuild() {
    return this.client.guilds.cache.get(this.config.guildId);
  }

  async getUser(userId: string) {
    return (
      this.client.users.cache.get(userId) ||
      (await this.client.users.fetch(userId))
    );
  }

  async getChannel(channelId: string) {
    return (
      this.client.channels.cache.get(channelId) ||
      (await this.client.channels.fetch(channelId))
    );
  }
}
