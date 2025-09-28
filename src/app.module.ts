import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { DiscordModule } from './discord/discord.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { LeadfyModule } from './modules/leadfy/leadfy.module';
import { SlaModule } from './modules/sla/sla.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrowserAuthMiddleware } from './middleware/browser-auth.middleware';
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
    SlaModule,
    UsersModule,
    AuthModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BrowserAuthMiddleware).forRoutes('*');
  }
}
