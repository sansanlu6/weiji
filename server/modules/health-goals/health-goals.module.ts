import { Module } from '@nestjs/common';
import { HealthGoalsController } from './health-goals.controller';
import { HealthGoalsService } from './health-goals.service';

@Module({
  controllers: [HealthGoalsController],
  providers: [HealthGoalsService],
})
export class HealthGoalsModule {}
