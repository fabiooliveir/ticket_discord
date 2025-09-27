import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockDatabaseService = {
    isConnected: jest.fn(),
    getDatabaseInfo: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        database: true,
        timestamp: '2025-09-26T23:50:10.129Z',
      };
      mockDatabaseService.isConnected.mockResolvedValue(true);
      jest.spyOn(appService, 'getHealthCheck').mockResolvedValue(mockHealth);

      const result = await appController.getHealthCheck();

      expect(result).toEqual(mockHealth);
    });
  });

  describe('database/info', () => {
    it('should return database information', async () => {
      const mockInfo = {
        current_database: 'ticket_discord',
        version: '8.0.43',
      };
      mockDatabaseService.getDatabaseInfo.mockResolvedValue(mockInfo);
      jest.spyOn(appService, 'getDatabaseInfo').mockResolvedValue(mockInfo);

      const result = await appController.getDatabaseInfo();

      expect(result).toEqual(mockInfo);
    });
  });
});
