import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { __express as hbsExpressEngine } from 'hbs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

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

    // 💥 物理拦截器：防 HTML 误返 + 静默处理 APaaS 框架打点接口
    const server = app.getHttpServer();
    server.on('request', (req: any, res: any) => {
      if (!req.url) return;

      // 1. 修复双斜杠问题，例如 /spark/app//runtime -> /spark/app/runtime
      if (req.url.includes('//')) {
        req.url = req.url.replace(/\/{2,}/g, '/');
      }

      // 2. 拦截并 Mock 掉框架可观测性/打点/时间同步 API，避免返回 404 或返回 HTML 页面
      if (
        req.url.includes('/observability/') ||
        req.url.includes('/metrics/') ||
        req.url.includes('/time-offset') ||
        req.url.includes('/runtime/api/')
      ) {
        // 如果是数据打点请求，静默返回成功 JSON，防止 SDK 报错卡死页面
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 200;
        return res.end(JSON.stringify({ code: 0, message: 'success', data: {} }));
      }

      // 3. 原有物理拦截 /assets/ 静态文件
      if (req.url.includes('/assets/')) {
        const urlPath = req.url.split('?')[0];
        const assetPath = urlPath.substring(urlPath.indexOf('/assets/'));
        const filePath = join(process.cwd(), 'dist/client', assetPath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
          else if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml');
          
          return fs.createReadStream(filePath).pipe(res);
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