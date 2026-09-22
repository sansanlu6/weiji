import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthRemindersService } from './health-reminders.service';

interface CreateReminderBody {
  reminderType: string;
  title: string;
  timePoints: string[];
  repeatType: string;
  repeatDays?: string[];
  repeatInterval?: number;
  endDate?: string;
  isEnabled?: boolean;
}

interface UpdateReminderBody {
  title?: string;
  timePoints?: string[];
  repeatType?: string;
  repeatDays?: string[];
  repeatInterval?: number;
  endDate?: string;
  isEnabled?: boolean;
}

@Controller('api/health/reminders')
@UseGuards(JwtAuthGuard)
export class HealthRemindersController {
  constructor(private readonly service: HealthRemindersService) {}

  @Get()
  async getReminders(@Req() req: any) {
    const { userId } = req.user;
    return this.service.getReminders(userId);
  }

  @Post()
  async createReminder(
    @Req() req: any,
    @Body() body: CreateReminderBody,
  ) {
    const { userId } = req.user;
    return this.service.createReminder(userId, body);
  }

  @Patch(':id')
  async updateReminder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateReminderBody,
  ) {
    const { userId } = req.user;
    return this.service.updateReminder(userId, id, body);
  }

  @Delete(':id')
  async deleteReminder(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const { userId } = req.user;
    return this.service.deleteReminder(userId, id);
  }

  @Patch(':id/toggle')
  async toggleReminder(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const { userId } = req.user;
    return this.service.toggleReminder(userId, id);
  }
}
