import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { DiscordBot } from './discord.bot';

describe('TeamsService', () => {
  let service: TeamsService;
  let mockDiscordBot: jest.Mocked<DiscordBot>;

  const mockConfig = {
    channels: {
      suporte: '1405162714581438524',
      cs: '1405162746122866798',
      trafego: '1405162779299549234',
    },
    roles: {
      suporte: '1405155398247252008',
      cs: '1405155496704475187',
      trafego: '1405155577134579742',
    },
  };

  beforeEach(async () => {
    mockDiscordBot = {
      client: {
        channels: {
          fetch: jest.fn(),
        },
        guilds: {
          cache: {
            first: jest.fn(),
          },
        },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: 'TEAMS_CONFIG',
          useValue: mockConfig,
        },
        {
          provide: DiscordBot,
          useValue: mockDiscordBot,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return teams configuration', () => {
    const teams = service.getTeamsConfig();

    expect(teams).toHaveLength(3);
    expect(teams[0].name).toBe('Suporte Técnico');
    expect(teams[1].name).toBe('Customer Success');
    expect(teams[2].name).toBe('Tráfego Pago');
  });

  it('should determine team for support ticket', () => {
    const team = service.determineTeamForTicket('Problema com login');

    expect(team).toBeDefined();
    expect(team?.name).toBe('Suporte Técnico');
    expect(team?.keywords).toContain('problema');
  });

  it('should determine team for CS ticket', () => {
    const team = service.determineTeamForTicket('Dúvida sobre vendas');

    expect(team).toBeDefined();
    expect(team?.name).toBe('Customer Success');
    expect(team?.keywords).toContain('vendas');
  });

  it('should determine team for traffic ticket', () => {
    const team = service.determineTeamForTicket('Campanha de marketing');

    expect(team).toBeDefined();
    expect(team?.name).toBe('Tráfego Pago');
    expect(team?.keywords).toContain('marketing');
  });

  it('should default to support team for unknown keywords', () => {
    const team = service.determineTeamForTicket(
      'Texto aleatório sem palavras-chave',
    );

    expect(team).toBeDefined();
    expect(team?.name).toBe('Suporte Técnico');
  });

  it('should handle case insensitive keywords', () => {
    const team = service.determineTeamForTicket('PROBLEMA COM SISTEMA');

    expect(team).toBeDefined();
    expect(team?.name).toBe('Suporte Técnico');
  });

  it('should handle multiple keywords in description', () => {
    const team = service.determineTeamForTicket(
      'Título',
      'Descrição com marketing e campanha',
    );

    expect(team).toBeDefined();
    expect(team?.name).toBe('Tráfego Pago');
  });
});
