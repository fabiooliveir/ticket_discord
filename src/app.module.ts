import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { DiscordModule } from './discord/discord.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { LeadfyModule } from './modules/leadfy/leadfy.module';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    DiscordModule,
    TicketsModule,
    LeadfyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
