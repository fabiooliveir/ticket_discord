import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from './discord.service';
import { DiscordBot } from './discord.bot';
import { TeamsService } from './teams.service';
import { FormHandlerService } from './forms/form-handler.service';
import { MessageHandlerService } from './message-handler.service';
import { MessageCaptureService } from './services/message-capture.service';
import { discordConfig } from '../config/discord.config';
import { teamsConfig } from '../config/teams.config';
import { Ticket } from '../database/entities/ticket.entity';
import { DatabaseModule } from '../database/database.module';
import { TicketsModule } from '../modules/tickets/tickets.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Ticket]),
    forwardRef(() => DatabaseModule),
    forwardRef(() => TicketsModule),
  ],
  providers: [
    DiscordService,
    DiscordBot,
    TeamsService,
    FormHandlerService,
    MessageHandlerService,
    MessageCaptureService,
    {
      provide: 'DISCORD_CONFIG',
      useFactory: discordConfig,
      inject: [],
    },
    {
      provide: 'TEAMS_CONFIG',
      useFactory: teamsConfig,
      inject: [],
    },
  ],
  exports: [
    DiscordService,
    DiscordBot,
    TeamsService,
    FormHandlerService,
    MessageHandlerService,
    MessageCaptureService,
  ],
})
export class DiscordModule {}
