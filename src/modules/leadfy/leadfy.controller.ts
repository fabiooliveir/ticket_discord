import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LeadfyService } from './leadfy.service';
import { LeadfyClient } from './interfaces/client.interface';

@Controller('leadfy')
export class LeadfyController {
  constructor(private readonly leadfyService: LeadfyService) {}

  @Get('clients')
  async getClients(): Promise<LeadfyClient[]> {
    try {
      return await this.leadfyService.getClients();
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar clientes da Leadfy',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('clients/:id')
  async getClientById(@Param('id') id: string): Promise<LeadfyClient | null> {
    try {
      const client = await this.leadfyService.getClientById(id);
      if (!client) {
        throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
      }
      return client;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao buscar cliente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('clients/search')
  async searchClients(@Query('q') query: string): Promise<LeadfyClient[]> {
    if (!query) {
      throw new HttpException(
        'Parâmetro de busca é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.leadfyService.searchClients(query);
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar clientes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync')
  async syncClients() {
    try {
      return await this.leadfyService.syncClients();
    } catch (error) {
      throw new HttpException(
        'Erro ao sincronizar clientes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getStats() {
    try {
      return await this.leadfyService.getClientStats();
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar estatísticas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      return await this.leadfyService.healthCheck();
    } catch (error) {
      throw new HttpException(
        'Erro no health check',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate/:id')
  async validateClient(@Param('id') id: string): Promise<{ valid: boolean }> {
    try {
      const valid = await this.leadfyService.validateClient(id);
      return { valid };
    } catch (error) {
      throw new HttpException(
        'Erro ao validar cliente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
