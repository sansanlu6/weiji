import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthDataService } from './health-data.service';

const VALID_TYPES = [
  'sleep', 'mood', 'pain', 'diet',
  'exercise', 'water', 'medication', 'poop',
];

function validateType(type: string | undefined): void {
  if (type && type !== 'all' && !VALID_TYPES.includes(type)) {
    throw new BadRequestException(`无效的记录类型: ${type}`);
  }
}

@Controller('api/health/data')
@UseGuards(JwtAuthGuard)
export class HealthDataController {
  constructor(private readonly service: HealthDataService) {}

  // ========== 搜索记录 ==========

  @Get('search')
  async searchRecords(
    @Req() req: any,
    @Query('keyword') keyword?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    ): Promise<any> {
    const { userId } = req.user;
    validateType(type);
    return this.service.searchRecords(userId, {
      keyword: keyword?.trim(),
      type: type && type !== 'all' ? type as any : undefined,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  // ========== 回收站 ==========

  @Get('recycle-bin')
  async getRecycleBin(
    @Req() req: any,
    @Query('keyword') keyword?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<any> {
    const { userId } = req.user;
    validateType(type);
    return this.service.getRecycleBin(userId, {
      keyword: keyword?.trim(),
      type: type && type !== 'all' ? type as any : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Post('recycle-bin/:type/:id/restore')
  async restoreRecord(
    @Req() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    const { userId } = req.user;
    validateType(type);
    return this.service.restoreRecord(userId, type as any, id);
  }

  @Delete('recycle-bin/:type/:id')
  async permanentDelete(
    @Req() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    const { userId } = req.user;
    validateType(type);
    return this.service.permanentDelete(userId, type as any, id);
  }

  // ========== 回收站批量操作 ==========

  @Post('recycle-bin/batch-restore')
  async batchRestore(
    @Req() req: any,
    @Body() body: { type: string; ids: string[] },
  ) {
    const { userId } = req.user;
    const { type, ids } = body;
    validateType(type);
    if (!type || type === 'all') {
      throw new BadRequestException('批量恢复必须指定具体记录类型');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('请提供要恢复的记录ID');
    }
    if (ids.length > 500) {
      throw new BadRequestException('单次批量恢复最多 500 条');
    }
    return this.service.batchRestore(userId, type as any, ids);
  }

  @Post('recycle-bin/batch-delete')
  async batchPermanentDelete(
    @Req() req: any,
    @Body() body: { type: string; ids: string[] },
  ) {
    const { userId } = req.user;
    const { type, ids } = body;
    validateType(type);
    if (!type || type === 'all') {
      throw new BadRequestException('批量彻底删除必须指定具体记录类型');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('请提供要彻底删除的记录ID');
    }
    if (ids.length > 500) {
      throw new BadRequestException('单次批量彻底删除最多 500 条');
    }
    return this.service.batchPermanentDelete(userId, type as any, ids);
  }

  // ========== 批量导出 ==========

  @Get('export')
  async exportRecords(
    @Req() req: any,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
  ) {
    const { userId } = req.user;
    validateType(type);
    const fmt = format && format.toLowerCase() === 'csv' ? 'csv' : 'json';

    if (fmt === 'csv') {
      const csvContent = await this.service.exportCsv(userId, {
        type: type && type !== 'all' ? type as any : undefined,
        startDate,
        endDate,
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="health-records-${Date.now()}.csv"`,
      );
      res.send('\uFEFF' + csvContent);
    } else {
      const result = await this.service.exportJson(userId, {
        type: type && type !== 'all' ? type as any : undefined,
        startDate,
        endDate,
      });
      res.json(result);
    }
  }

  // ========== 批量删除 ==========

  @Post('batch-delete')
  async batchDelete(
    @Req() req: any,
    @Body() body: { type: string; ids: string[] },
  ) {
    const { userId } = req.user;
    const { type, ids } = body;
    validateType(type);
    if (!type || type === 'all') {
      throw new BadRequestException('批量删除必须指定具体记录类型');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('请提供要删除的记录ID');
    }
    if (ids.length > 500) {
      throw new BadRequestException('单次批量删除最多 500 条');
    }
    return this.service.batchDelete(userId, type as any, ids);
  }

  // ========== 图片去重查询 ==========

  @Get('image-dedup/query')
  async queryImageDedup(
    @Query('fileHash') fileHash?: string,
  ) {
    if (!fileHash) {
      throw new BadRequestException('fileHash 不能为空');
    }
    return this.service.queryImageByHash(fileHash);
  }

  // ========== 图片去重登记 ==========

  @Post('image-dedup/register')
  async registerImageDedup(
    @Body() body: { fileHash: string; fileName: string; downloadUrl: string; fileSize: number },
  ) {
    const { fileHash, fileName, downloadUrl, fileSize } = body;
    if (!fileHash || !fileName || !downloadUrl) {
      throw new BadRequestException('fileHash、fileName、downloadUrl 不能为空');
    }
    return this.service.registerImage(
      fileHash,
      fileName,
      downloadUrl,
      fileSize ?? 0,
    );
  }
}
