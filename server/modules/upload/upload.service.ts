import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class UploadService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        '缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量',
      );
    }

    this.bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'weiji-images';
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async uploadImage(userId: string, file?: UploadedImage) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请选择需要上传的图片');
    }

    const extension = IMAGE_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException('仅支持 JPG、PNG、WebP 或 GIF 图片');
    }

    const objectPath = `${userId}/${Date.now()}-${randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(`图片上传失败：${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(objectPath);

    return {
      downloadUrl: data.publicUrl,
      objectPath,
    };
  }
}
