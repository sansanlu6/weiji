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
    const rawSupabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      ?.replace(/\s/g, '');

    if (!rawSupabaseUrl || !serviceRoleKey) {
      throw new Error(
        '缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量',
      );
    }

    let supabaseUrl: string;
    try {
      supabaseUrl = new URL(rawSupabaseUrl).origin;
    } catch {
      throw new Error('SUPABASE_URL 格式错误');
    }

    this.bucket =
      process.env.SUPABASE_STORAGE_BUCKET?.trim().replace(/^\/+|\/+$/g, '') ||
      'weiji-images';
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
      // 底层错误可能包含请求头信息，不得原样返回到浏览器。
      throw new InternalServerErrorException(
        '图片上传失败，请检查 Supabase Storage 配置',
      );
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(objectPath);

    return {
      downloadUrl: data.publicUrl,
      objectPath,
    };
  }

  async downloadImage(objectPath: string) {
    if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(objectPath)) {
      throw new BadRequestException('图片路径不合法');
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(objectPath);

    if (error || !data) {
      throw new BadRequestException('图片不存在或暂时无法读取');
    }

    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      contentType: data.type || 'application/octet-stream',
    };
  }
}
