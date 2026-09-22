import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthStatsService } from './health-stats.service';
import type {
  MoodDistribution,
  PainFrequency,
  CorrelationResult,
  AlertRecord,
  AlertConfig,
  WeeklyDetailStats,
  MonthlyDetailStats,
  HalfYearMonthlyStats,
  YearlyDetailStats,
} from '@shared/api.interface';

export interface SleepDayStat {
  date: string;
  durationMinutes: number;
  sleepTime: string;
  wakeTime: string;
}

export interface WaterDayStat {
  date: string;
  cups: number;
  totalMl: number;
}

export interface ExerciseDayStat {
  date: string;
  durationMinutes: number;
  count: number;
}

export interface DietMealStat {
  date: string;
  mealType: string;
  count: number;
}

@Controller('api/health/stats')
@UseGuards(JwtAuthGuard)
export class HealthStatsController {
  constructor(private readonly statsService: HealthStatsService) {}

  @Get('sleep')
  async getSleepStats(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('range') range: string = '30',
  ): Promise<SleepDayStat[]> {
    const { userId } = req.user;
    const rangeNum = parseInt(range, 10);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      throw new BadRequestException('range 必须为正整数');
    }
    return this.statsService.getSleepStats(userId, period, rangeNum);
  }

  @Get('water')
  async getWaterStats(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('range') range: string = '30',
  ): Promise<WaterDayStat[]> {
    const { userId } = req.user;
    const rangeNum = parseInt(range, 10);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      throw new BadRequestException('range 必须为正整数');
    }
    return this.statsService.getWaterStats(userId, period, rangeNum);
  }

  @Get('exercise')
  async getExerciseStats(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('range') range: string = '30',
  ): Promise<ExerciseDayStat[]> {
    const { userId } = req.user;
    const rangeNum = parseInt(range, 10);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      throw new BadRequestException('range 必须为正整数');
    }
    return this.statsService.getExerciseStats(userId, period, rangeNum);
  }

  @Get('diet/meals')
  async getDietMealStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DietMealStat[]> {
    const { userId } = req.user;
    return this.statsService.getDietMealStats(userId, startDate, endDate);
  }

  @Get('mood/distribution')
  async getMoodDistribution(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<MoodDistribution[]> {
    const { userId } = req.user;
    return this.statsService.getMoodDistribution(userId, startDate, endDate);
  }

  @Get('pain/frequency')
  async getPainFrequency(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PainFrequency[]> {
    const { userId } = req.user;
    return this.statsService.getPainFrequency(userId, startDate, endDate);
  }

  @Get('correlation/sleep-mood')
  async getSleepMoodCorrelation(
    @Req() req: any,
    @Query('range') range: string = '30',
  ): Promise<CorrelationResult> {
    const { userId } = req.user;
    const rangeNum = parseInt(range, 10);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      throw new BadRequestException('range 必须为正整数');
    }
    return this.statsService.getSleepMoodCorrelation(userId, rangeNum);
  }

  @Get('correlation/exercise-sleep')
  async getExerciseSleepCorrelation(
    @Req() req: any,
    @Query('range') range: string = '30',
  ): Promise<CorrelationResult> {
    const { userId } = req.user;
    const rangeNum = parseInt(range, 10);
    if (isNaN(rangeNum) || rangeNum <= 0) {
      throw new BadRequestException('range 必须为正整数');
    }
    return this.statsService.getExerciseSleepCorrelation(userId, rangeNum);
  }

  @Get('alerts')
  async getAlerts(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AlertRecord[]> {
    const { userId } = req.user;
    return this.statsService.getAlerts(userId, startDate, endDate);
  }

  @Get('alert-config')
  async getAlertConfig(@Req() req: any): Promise<AlertConfig[]> {
    const { userId } = req.user;
    return this.statsService.getAlertConfig(userId);
  }

  @Patch('alert-config/:type')
  async updateAlertConfig(
    @Req() req: any,
    @Param('type') type: string,
    @Body() body: { threshold?: number; isEnabled?: boolean },
  ): Promise<AlertConfig> {
    const { userId } = req.user;
    if (body.threshold === undefined && body.isEnabled === undefined) {
      throw new BadRequestException('未提供可更新字段');
    }
    return this.statsService.updateAlertConfig(userId, type, body);
  }

  @Get('weekly-detail')
  async getWeeklyDetailStats(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<WeeklyDetailStats> {
    const { userId } = req.user;
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate 和 endDate 为必填');
    }
    return this.statsService.getWeeklyDetailStats(userId, startDate, endDate);
  }

  @Get('monthly-detail')
  async getMonthlyDetailStats(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<MonthlyDetailStats> {
    const { userId } = req.user;
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate 和 endDate 为必填');
    }
    return this.statsService.getMonthlyDetailStats(userId, startDate, endDate);
  }

  @Get('halfyear-detail')
  async getHalfYearDetailStats(
    @Req() req: any,
    @Query('endMonth') endMonth?: string,
  ): Promise<HalfYearMonthlyStats> {
    const { userId } = req.user;
    if (endMonth && !/^\d{4}-\d{2}$/.test(endMonth)) {
      throw new BadRequestException('endMonth 格式应为 YYYY-MM');
    }
    return this.statsService.getHalfYearDetailStats(userId, endMonth);
  }

  @Get('year-detail')
  async getYearDetailStats(
    @Req() req: any,
    @Query('year') year: string,
  ): Promise<YearlyDetailStats> {
    const { userId } = req.user;
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      throw new BadRequestException('year 必须为有效的年份');
    }
    return this.statsService.getYearDetailStats(yearNum, userId);
  }
}
