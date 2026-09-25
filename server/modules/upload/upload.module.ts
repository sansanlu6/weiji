import { Module } from '@nestjs/common';
import {
  PublicImageController,
  UploadController,
} from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController, PublicImageController],
  providers: [UploadService],
})
export class UploadModule {}
