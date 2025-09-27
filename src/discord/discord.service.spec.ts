import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscordService } from './discord.service';
import { DiscordBot } from './discord.bot';
import { TeamsService } from './teams.service';
import { DatabaseService } from '../database/database.service';
import { Ticket } from '../database/entities/ticket.entity';
import { FormHandlerService } from './forms/form-handler.service';
import { TicketCategoryService } from '../modules/tickets/categories/ticket-category.service';
import { CorrectionTaggingService } from '../modules/tickets/categories/correction-tagging/correction-tagging.service';
import { NewTaggingService } from '../modules/tickets/categories/new-tagging/new-tagging.service';

describe('DiscordService', () => {
  let service: DiscordService;
  let ticketRepository: Repository<Ticket>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDiscordBot = {
    client: {
      users: {
        cache: new Map(),
        fetch: jest.fn(),
      },
      channels: {
        cache: new Map(),
        fetch: jest.fn(),
      },
    },
  };

  const mockDatabaseService = {
    isConnected: jest.fn(),
    getDatabaseInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: 'DISCORD_CONFIG',
          useValue: {
            token: 'test-token',
            guildId: 'test-guild-id',
            clientId: 'test-client-id',
          },
        },
        {
          provide: DiscordBot,
          useValue: mockDiscordBot,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
        {
          provide: TeamsService,
          useValue: {
            determineTeamForTicket: jest.fn().mockReturnValue({
              name: 'Suporte Técnico',
              emoji: '🔧',
              color: 0xff6b6b,
              channelId: 'test-channel-id',
              roleId: 'test-role-id',
            }),
            notifyTeam: jest.fn(),
            getTeamStats: jest.fn().mockResolvedValue([]),
            listTeamChannels: jest.fn().mockResolvedValue('Test teams info'),
          },
        },
        {
          provide: FormHandlerService,
          useValue: {
            handleButtonInteraction: jest.fn(),
            handleModalSubmit: jest.fn(),
          },
        },
        {
          provide: TicketCategoryService,
          useValue: {
            createTicketWithCategory: jest.fn(),
          },
        },
        {
          provide: CorrectionTaggingService,
          useValue: {
            getAllClients: jest.fn().mockResolvedValue([]),
            getClientById: jest.fn(),
            searchClients: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: NewTaggingService,
          useValue: {
            getAllClients: jest.fn().mockResolvedValue([]),
            getClientById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiscordService>(DiscordService);
    ticketRepository = module.get<Repository<Ticket>>(
      getRepositoryToken(Ticket),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSlashCommands', () => {
    it('should return slash commands configuration', async () => {
      const commands = await service.getSlashCommands();

      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(1);
      expect(commands[0].name).toBe('criar-ticket');
      expect(commands[0].options).toHaveLength(1);
      expect(commands[0].options[0].name).toBe('cliente');
      expect(commands[0].options[0].autocomplete).toBe(true);
      expect(commands[0].options[0].required).toBe(true);
    });
  });

  describe('handleAutocomplete', () => {
    it('should handle client autocomplete', async () => {
      const mockInteraction = {
        commandName: 'criar-ticket',
        options: [
          {
            name: 'cliente',
            focused: true,
            value: 'João',
          },
        ],
        respond: jest.fn(),
      };

      const mockClients = [
        { id: '1', name: 'João Silva' },
        { id: '2', name: 'João Santos' },
      ];

      jest
        .spyOn(service['correctionTaggingService'], 'searchClients')
        .mockResolvedValue(mockClients);

      await service.handleAutocomplete(mockInteraction);

      expect(mockInteraction.respond).toHaveBeenCalledWith([
        { name: 'João Silva', value: '1' },
        { name: 'João Santos', value: '2' },
      ]);
    });

    it('should handle autocomplete error gracefully', async () => {
      const mockInteraction = {
        commandName: 'criar-ticket',
        options: [
          {
            name: 'cliente',
            focused: true,
            value: 'João',
          },
        ],
        respond: jest.fn(),
      };

      jest
        .spyOn(service['correctionTaggingService'], 'searchClients')
        .mockRejectedValue(new Error('API Error'));

      await service.handleAutocomplete(mockInteraction);

      expect(mockInteraction.respond).toHaveBeenCalledWith([]);
    });
  });

  // Testes dos comandos de texto removidos - apenas slash commands são suportados
});
