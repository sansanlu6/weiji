import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthGoalsService } from './health-goals.service';

interface UpsertGoalBody {
  targetValue: number;
  period: string;
}

@Controller('api/health/goals')
@UseGuards(JwtAuthGuard)
export class HealthGoalsController {
  constructor(private readonly service: HealthGoalsService) {}

  @Get()
  async getGoals(@Req() req: any) {
    const { userId } = req.user;
    return this.service.getGoals(userId);
  }

  @Put(':goalType')
  async upsertGoal(
    @Req() req: any,
    @Param('goalType') goalType: string,
    @Body() body: UpsertGoalBody,
  ) {
    const { userId } = req.user;
    return this.service.upsertGoal(userId, goalType, body);
  }
}
