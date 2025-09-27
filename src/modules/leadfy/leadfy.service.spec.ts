import { Test, TestingModule } from '@nestjs/testing';
import { LeadfyService } from './leadfy.service';
import { HttpService } from '../../shared/http/http.service';
import { LeadfyClient, LeadfyApiResponse } from './interfaces/client.interface';

describe('LeadfyService', () => {
  let service: LeadfyService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfig = {
    webhookUrl: 'https://workflowinternal.leadfy.pro/webhook/test',
    token: 'test-token',
    timeout: 10000,
    retryAttempts: 3,
    cacheTtl: 300000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadfyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: 'LEADFY_CONFIG',
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<LeadfyService>(LeadfyService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClients', () => {
    it('should return clients from API', async () => {
      const mockClients: LeadfyClient[] = [
        {
          id: '1',
          name: 'Cliente Teste 1',
          email: 'cliente1@test.com',
          company: 'Empresa 1',
        },
        {
          id: '2',
          name: 'Cliente Teste 2',
          email: 'cliente2@test.com',
          company: 'Empresa 2',
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          data: mockClients,
        },
      };

      mockHttpService.post.mockResolvedValue(mockResponse);

      const result = await service.getClients();

      expect(result).toEqual(mockClients);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        mockConfig.webhookUrl,
        {},
        {
          headers: {
            token: mockConfig.token,
          },
          timeout: mockConfig.timeout,
        },
      );
    });

    it('should return cached clients on API error', async () => {
      const mockClients: LeadfyClient[] = [
        {
          id: '1',
          name: 'Cliente Cache',
          email: 'cache@test.com',
        },
      ];

      // Primeiro, popular o cache
      const mockResponse = {
        data: {
          success: true,
          data: mockClients,
        },
      };
      mockHttpService.post.mockResolvedValueOnce(mockResponse);
      await service.getClients();

      // Depois, simular erro na API
      mockHttpService.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getClients();

      expect(result).toEqual(mockClients);
    });
  });

  describe('getClientById', () => {
    it('should return client from cache', async () => {
      const mockClient: LeadfyClient = {
        id: '1',
        name: 'Cliente Teste',
        email: 'test@test.com',
      };

      // Popular o cache
      const mockResponse = {
        data: {
          success: true,
          data: [mockClient],
        },
      };
      mockHttpService.post.mockResolvedValue(mockResponse);
      await service.getClients();

      const result = await service.getClientById('1');

      expect(result).toEqual(mockClient);
    });

    it('should return null for non-existent client', async () => {
      const result = await service.getClientById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchClients', () => {
    it('should search clients by name', async () => {
      const mockClients: LeadfyClient[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@test.com',
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          data: mockClients,
        },
      };
      mockHttpService.post.mockResolvedValue(mockResponse);

      const result = await service.searchClients('João');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });
  });

  describe('validateClient', () => {
    it('should return true for valid client', async () => {
      const mockClient: LeadfyClient = {
        id: '1',
        name: 'Cliente Válido',
      };

      const mockResponse = {
        data: {
          success: true,
          data: [mockClient],
        },
      };
      mockHttpService.post.mockResolvedValue(mockResponse);

      const result = await service.validateClient('1');

      expect(result).toBe(true);
    });

    it('should return false for invalid client', async () => {
      const result = await service.validateClient('invalid');

      expect(result).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when API is reachable', async () => {
      mockHttpService.post.mockResolvedValue({ data: { success: true } });

      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.apiReachable).toBe(true);
    });

    it('should return unhealthy status when API is not reachable', async () => {
      mockHttpService.post.mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.apiReachable).toBe(false);
    });
  });
});
