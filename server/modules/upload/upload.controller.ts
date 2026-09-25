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
      downloadUrl: `/media/image/${result.objectPath}`,
    };
  }
}

/**
 * 图片需要能被浏览器的 <img> 标签直接读取。妙搭框架会对所有 /api/*
 * 请求校验 CSRF 请求头，而 <img> 无法携带该请求头，因此将只读图片路由
 * 放在 /media 下。上传接口仍保留在 /api 下，并继续经过 JWT 与 CSRF 保护。
 */
@Controller('media/image')
export class PublicImageController {
  constructor(private readonly uploadService: UploadService) {}

  @Get([':fileName', ':userId/:fileName'])
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
