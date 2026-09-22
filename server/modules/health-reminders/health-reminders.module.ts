import { Module } from '@nestjs/common';
import { HealthRemindersController } from './health-reminders.controller';
import { HealthRemindersService } from './health-reminders.service';

@Module({
  controllers: [HealthRemindersController],
  providers: [HealthRemindersService],
})
export class HealthRemindersModule {}
