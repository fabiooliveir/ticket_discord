import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async isConnected(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('✅ Conexão com MySQL estabelecida com sucesso');
      return true;
    } catch (error) {
      this.logger.error('❌ Erro ao conectar com MySQL:', error.message);
      return false;
    }
  }

  async getDatabaseInfo(): Promise<any> {
    try {
      const result = await this.dataSource.query(
        'SELECT DATABASE() as current_database, VERSION() as version',
      );
      return result[0];
    } catch (error) {
      this.logger.error('Erro ao obter informações do banco:', error.message);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.dataSource.runMigrations();
      this.logger.log('✅ Migrações executadas com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao executar migrações:', error.message);
      throw error;
    }
  }
}
