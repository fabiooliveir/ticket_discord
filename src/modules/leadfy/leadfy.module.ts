import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeadfyService } from './leadfy.service';
import { LeadfyController } from './leadfy.controller';
import { HttpService } from '../../shared/http/http.service';
import { leadfyConfig } from '../../config/leadfy.config';

@Module({
  imports: [ConfigModule],
  providers: [
    LeadfyService,
    HttpService,
    {
      provide: 'LEADFY_CONFIG',
      useFactory: leadfyConfig,
      inject: [],
    },
  ],
  controllers: [LeadfyController],
  exports: [LeadfyService],
})
export class LeadfyModule {}
