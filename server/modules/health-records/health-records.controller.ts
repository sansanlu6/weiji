import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Logger,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthRecordsService } from './health-records.service';
import type { UpdateProfileRequest } from '@shared/api.interface';

@Controller('api/health')
@UseGuards(JwtAuthGuard)
export class HealthRecordsController {
  private readonly logger = new Logger(HealthRecordsController.name);
  constructor(private readonly service: HealthRecordsService) {}

  // ========== Overview ==========

  @Get('overview/today')
  async getTodayOverview(@Req() req: any) {
    const { userId } = req.user;
    return this.service.getTodayOverview(userId);
  }

  @Get('overview/recent')
  async getRecentRecords(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const { userId } = req.user;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.service.getRecentRecords(userId, limitNum);
  }

  @Get('achievements')
  async getAchievements(@Req() req: any) {
    const { userId } = req.user;
    return this.service.getAchievements(userId);
  }

  @Get('profile-summary')
  async getProfileSummary(@Req() req: any) {
    const { userId } = req.user;
    return this.service.getProfileSummary(userId);
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    const { userId } = req.user;
    return this.service.getProfile(userId);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: UpdateProfileRequest) {
    const { userId } = req.user;
    try {
      return await this.service.updateProfile(userId, body);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`updateProfile failed: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  // ========== Sleep ==========

  @Get('sleep')
  async listSleep(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listSleep(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('sleep')
  async createSleep(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createSleep(userId, body);
  }

  @Get('sleep/:id')
  async getSleep(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getSleep(userId, id);
  }

  @Patch('sleep/:id')
  async updateSleep(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updateSleep(userId, id, body);
  }

  @Delete('sleep/:id')
  async deleteSleep(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deleteSleep(userId, id);
  }

  // ========== Mood ==========

  @Get('mood')
  async listMood(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listMood(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('mood')
  async createMood(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createMood(userId, body);
  }

  @Get('mood/:id')
  async getMood(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getMood(userId, id);
  }

  @Patch('mood/:id')
  async updateMood(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updateMood(userId, id, body);
  }

  @Delete('mood/:id')
  async deleteMood(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deleteMood(userId, id);
  }

  // ========== Pain ==========

  @Get('pain')
  async listPain(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listPain(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('pain')
  async createPain(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createPain(userId, body);
  }

  @Get('pain/:id')
  async getPain(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getPain(userId, id);
  }

  @Patch('pain/:id')
  async updatePain(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updatePain(userId, id, body);
  }

  @Delete('pain/:id')
  async deletePain(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deletePain(userId, id);
  }

  // ========== Diet ==========

  @Get('diet')
  async listDiet(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listDiet(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('diet')
  async createDiet(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createDiet(userId, body);
  }

  @Get('diet/:id')
  async getDiet(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getDiet(userId, id);
  }

  @Patch('diet/:id')
  async updateDiet(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updateDiet(userId, id, body);
  }

  @Delete('diet/:id')
  async deleteDiet(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deleteDiet(userId, id);
  }

  // ========== Exercise ==========

  @Get('exercise')
  async listExercise(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listExercise(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('exercise')
  async createExercise(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createExercise(userId, body);
  }

  @Get('exercise/:id')
  async getExercise(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getExercise(userId, id);
  }

  @Patch('exercise/:id')
  async updateExercise(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updateExercise(userId, id, body);
  }

  @Delete('exercise/:id')
  async deleteExercise(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deleteExercise(userId, id);
  }

  // ========== Water ==========

  @Get('water')
  async listWater(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listWater(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('water')
  async createWater(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createWater(userId, body);
  }

  @Get('water/:id')
  async getWater(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getWater(userId, id);
  }

  @Patch('water/:id')
  async updateWater(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updateWater(userId, id, body);
  }

  @Delete('water/:id')
  async deleteWater(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deleteWater(userId, id);
  }

  // ========== Medication ==========

  @Get('medication')
  async listMedication(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listMedication(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('medication')
  async createMedication(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createMedication(userId, body);
  }

  @Get('medication/:id')
  async getMedication(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getMedication(userId, id);
  }

  @Patch('medication/:id')
  async updateMedication(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updateMedication(userId, id, body);
  }

  @Delete('medication/:id')
  async deleteMedication(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deleteMedication(userId, id);
  }

  // ========== Poop ==========

  @Get('poop')
  async listPoop(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { userId } = req.user;
    return this.service.listPoop(userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      startDate,
      endDate,
    });
  }

  @Post('poop')
  async createPoop(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;
    return this.service.createPoop(userId, body);
  }

  @Get('poop/:id')
  async getPoop(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.getPoop(userId, id);
  }

  @Patch('poop/:id')
  async updatePoop(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { userId } = req.user;
    return this.service.updatePoop(userId, id, body);
  }

  @Delete('poop/:id')
  async deletePoop(@Req() req: any, @Param('id') id: string) {
    const { userId } = req.user;
    return this.service.deletePoop(userId, id);
  }
}
