import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join, basename } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { __express as hbsExpressEngine } from 'hbs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

// 递归查找指定目录下的文件
function findFileInDir(dir: string, targetFileName: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findFileInDir(fullPath, targetFileName);
      if (found) return found;
    } else if (file === targetFileName) {
      return fullPath;
    }
  }
  return null;
}

async function bootstrap() {
  if (process.env.DATABASE_URL && !process.env.SUDA_DATABASE_URL) {
    process.env.SUDA_DATABASE_URL = process.env.DATABASE_URL;
  }
  if (process.env.SUDA_DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.SUDA_DATABASE_URL;
  }

  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: false,
    });

    // 💥 全局底层 HTTP 拦截器
    const server = app.getHttpServer();
    server.on('request', (req: any, res: any) => {
      if (!req.url) return;

      // 1. 清理双斜杠
      if (req.url.includes('//')) {
        req.url = req.url.replace(/\/{2,}/g, '/');
      }

      // 2. 静默 Mock APaaS 监控打点与时间接口
      if (
        req.url.includes('/observability/') ||
        req.url.includes('/metrics/') ||
        req.url.includes('/time-offset')
      ) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 200;
        return res.end(JSON.stringify({ code: 0, message: 'success', data: {} }));
      }

      // 3. 通用静态资源拦截（无论 URL 是否带 /assets/，只要请求 .js/.css 等资源，直接在 dist/client 全局物理匹配）
      const cleanUrl = req.url.split('?')[0];
      const ext = path.extname(cleanUrl).toLowerCase();
      
      if (['.js', '.css', '.svg', '.png', '.jpg', '.ico', '.woff', '.woff2'].includes(ext)) {
        const fileName = basename(cleanUrl);
        const distClientDir = join(process.cwd(), 'dist/client');
        
        // 全局搜寻该静态文件
        const matchedFilePath = findFileInDir(distClientDir, fileName);

        if (matchedFilePath) {
          if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
          else if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml');
          
          return fs.createReadStream(matchedFilePath).pipe(res);
        }
      }
    });

    await configureApp(app, { disableSwagger: true });

    app.setBaseViewsDir(join(process.cwd(), 'dist/client'));
    app.setViewEngine('html');
    app.engine('html', hbsExpressEngine);

    const port = Number(process.env.PORT || 10000);
    await app.listen(port, '0.0.0.0');
    logger.log(`Server running on http://0.0.0.0:${port}`);
  } catch (error) {
    console.error('❌ 致命错误:', error);
    process.exit(1);
  }
}

bootstrap();