import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealthCheck(): Promise<{
    status: string;
    database: boolean;
    timestamp: string;
  }> {
    const isDatabaseConnected = await this.databaseService.isConnected();

    return {
      status: isDatabaseConnected ? 'healthy' : 'unhealthy',
      database: isDatabaseConnected,
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseInfo(): Promise<any> {
    try {
      return await this.databaseService.getDatabaseInfo();
    } catch (error) {
      this.logger.error('Erro ao obter informações do banco:', error.message);
      throw error;
    }
  }
}
