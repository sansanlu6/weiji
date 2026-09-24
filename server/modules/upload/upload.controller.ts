import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Req() req: { user: { userId: string } },
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    const result = await this.uploadService.uploadImage(req.user.userId, file);
    return {
      ...result,
      downloadUrl: `/api/upload/image/${result.objectPath}`,
    };
  }

  @Get(['image/:fileName', 'image/:userId/:fileName'])
  async downloadImage(
    @Param('userId') userId: string | undefined,
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 兼容旧数据：旧图片直接保存在 bucket 根目录，
    // 新图片则保存在 userId 子目录。
    const objectPath = userId ? `${userId}/${fileName}` : fileName;
    const image = await this.uploadService.downloadImage(objectPath);
    response.setHeader('Content-Type', image.contentType);
    response.setHeader(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );
    return new StreamableFile(image.buffer);
  }
}
