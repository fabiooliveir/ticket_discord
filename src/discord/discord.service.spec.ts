import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscordService } from './discord.service';
import { DiscordBot } from './discord.bot';
import { TeamsService } from './teams.service';
import { DatabaseService } from '../database/database.service';
import { Ticket } from '../database/entities/ticket.entity';

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
      expect(commands[0].name).toBe('ticket');
      expect(commands[0].options).toHaveLength(3);
    });
  });

  describe('createTicket', () => {
    it('should create a ticket successfully', async () => {
      const mockMessage = {
        content: '!ticket create Test Ticket',
        author: { id: 'user123', tag: 'testuser#1234' },
        channel: { id: 'channel123' },
        reply: jest.fn(),
      } as any;

      const mockTicket = {
        id: 'ticket123',
        title: 'Test Ticket',
        status: 'open',
        priority: 'medium',
        discordUserId: 'user123',
        discordChannelId: 'channel123',
      };

      mockRepository.create.mockReturnValue(mockTicket);
      mockRepository.save.mockResolvedValue(mockTicket);
      mockRepository.findOne.mockResolvedValue(null);

      await service.createTicket(mockMessage, ['Test', 'Ticket']);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockMessage.reply).toHaveBeenCalled();
    });

    it('should not create ticket if user already has one open', async () => {
      const mockMessage = {
        content: '!ticket create Test Ticket',
        author: { id: 'user123', tag: 'testuser#1234' },
        channel: { id: 'channel123' },
        reply: jest.fn(),
      } as any;

      const existingTicket = {
        id: 'existing123',
        title: 'Existing Ticket',
        status: 'open',
      };

      // Reset mocks
      mockRepository.create.mockClear();
      mockRepository.save.mockClear();
      mockRepository.findOne.mockResolvedValue(existingTicket);

      await service.createTicket(mockMessage, ['Test', 'Ticket']);

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining('Você já possui um ticket aberto'),
      );
    });
  });

  describe('closeTicket', () => {
    it('should close a ticket successfully', async () => {
      const mockMessage = {
        author: { id: 'user123', tag: 'testuser#1234' },
        reply: jest.fn(),
      } as any;

      const mockTicket = {
        id: 'ticket123',
        title: 'Test Ticket',
        status: 'open',
        metadata: {} as Record<string, any>,
        save: jest.fn().mockResolvedValue({}),
      };

      mockRepository.findOne.mockResolvedValue(mockTicket);
      mockRepository.save.mockResolvedValue(mockTicket);

      await service.closeTicket(mockMessage);

      expect(mockTicket.status).toBe('closed');
      expect(mockTicket.metadata?.closedBy).toBe('testuser#1234');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockMessage.reply).toHaveBeenCalled();
    });

    it('should not close ticket if user has no open tickets', async () => {
      const mockMessage = {
        author: { id: 'user123', tag: 'testuser#1234' },
        reply: jest.fn(),
      } as any;

      mockRepository.findOne.mockResolvedValue(null);

      await service.closeTicket(mockMessage);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining('Você não possui nenhum ticket aberto'),
      );
    });
  });

  describe('listTickets', () => {
    it('should list user tickets successfully', async () => {
      const mockMessage = {
        author: { id: 'user123', tag: 'testuser#1234' },
        reply: jest.fn(),
      } as any;

      const mockTickets = [
        {
          id: 'ticket1',
          title: 'Ticket 1',
          status: 'open',
          priority: 'high',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'ticket2',
          title: 'Ticket 2',
          status: 'closed',
          priority: 'medium',
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockTickets);

      await service.listTickets(mockMessage);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { discordUserId: 'user123' },
        order: { createdAt: 'DESC' },
        take: 10,
      });
      expect(mockMessage.reply).toHaveBeenCalled();
    });

    it('should show message when user has no tickets', async () => {
      const mockMessage = {
        author: { id: 'user123', tag: 'testuser#1234' },
        reply: jest.fn(),
      } as any;

      mockRepository.find.mockResolvedValue([]);

      await service.listTickets(mockMessage);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining('Você não possui nenhum ticket'),
      );
    });
  });
});
