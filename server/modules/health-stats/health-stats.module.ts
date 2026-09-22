import { Module } from '@nestjs/common';
import { HealthStatsController } from './health-stats.controller';
import { HealthStatsService } from './health-stats.service';

@Module({
  controllers: [HealthStatsController],
  providers: [HealthStatsService],
})
export class HealthStatsModule {}
