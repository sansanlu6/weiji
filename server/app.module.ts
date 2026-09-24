import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { HealthRecordsModule } from './modules/health-records/health-records.module';
import { HealthStatsModule } from './modules/health-stats/health-stats.module';
import { HealthGoalsModule } from './modules/health-goals/health-goals.module';
import { HealthRemindersModule } from './modules/health-reminders/health-reminders.module';
import { HealthDataModule } from './modules/health-data/health-data.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { DataPaasModule } from '@lark-apaas/nestjs-datapaas';

@Module({
  imports: [
    PlatformModule.forRoot(),

    // 使用普通 Supabase 数据库连接，
    // 不使用妙搭平台的 anon_ / authenticated_ 数据库角色
    DataPaasModule.forRoot({
      connectionString: process.env.SUDA_DATABASE_URL ?? '',
      ssl: 'require',
      autoContext: false,
    }),

    HealthRecordsModule,
    HealthStatsModule,
    HealthGoalsModule,
    HealthRemindersModule,
    HealthDataModule,
    AuthModule,
    UploadModule,

    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
