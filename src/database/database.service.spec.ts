import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
    runMigrations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isConnected', () => {
    it('should return true when database is connected', async () => {
      mockDataSource.query.mockResolvedValue([{ '1': 1 }]);

      const result = await service.isConnected();

      expect(result).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return false when database connection fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection failed'));

      const result = await service.isConnected();

      expect(result).toBe(false);
    });
  });

  describe('getDatabaseInfo', () => {
    it('should return database information', async () => {
      const mockInfo = {
        current_database: 'ticket_discord',
        version: '8.0.43',
      };
      mockDataSource.query.mockResolvedValue([mockInfo]);

      const result = await service.getDatabaseInfo();

      expect(result).toEqual(mockInfo);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'SELECT DATABASE() as current_database, VERSION() as version',
      );
    });
  });
});
