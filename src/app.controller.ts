import { Controller, Get, HttpException, HttpStatus, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealthCheck() {
    return await this.appService.getHealthCheck();
  }

  @Get('database/info')
  async getDatabaseInfo() {
    try {
      return await this.appService.getDatabaseInfo();
    } catch (error) {
      throw new HttpException(
        'Erro ao obter informações do banco de dados',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
