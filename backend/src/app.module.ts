import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

import {
  databaseConfig,
  vonageConfig,
  clerkConfig,
  storageConfig,
} from './config';
import { ClerkAuthGuard } from './common/guards';
import { HttpExceptionFilter } from './common/filters';
import { HealthController } from './health.controller';

// Entities
import {
  User,
  Journal,
  JournalTemplate,
  Prompt,
  Participant,
  ScheduledPrompt,
  PromptSend,
  Entry,
  MediaAttachment,
  PromptUsageLog,
  AIContent,
} from './database/entities';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { JournalsModule } from './modules/journals/journals.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { EntriesModule } from './modules/entries/entries.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { SmsModule } from './modules/sms/sms.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, vonageConfig, clerkConfig, storageConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          User,
          Journal,
          JournalTemplate,
          Prompt,
          Participant,
          ScheduledPrompt,
          PromptSend,
          Entry,
          MediaAttachment,
          PromptUsageLog,
          AIContent,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') !== 'production',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    JournalsModule,
    ParticipantsModule,
    EntriesModule,
    TemplatesModule,
    SmsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
