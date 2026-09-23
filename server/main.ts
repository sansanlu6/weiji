import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import * as fs from 'fs';
import { __express as hbsExpressEngine } from 'hbs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // 环境变量双向补齐
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

    // 💥 终极物理拦截：只要是请求 assets 里的文件，直接用原生 fs 读文件输出
    const server = app.getHttpAdapter().getInstance();
    server.use((req: any, res: any, next: any) => {
      if (req.url.includes('/assets/')) {
        const fileName = req.url.split('/assets/')[1].split('?')[0];
        const filePath = join(process.cwd(), 'dist/client/assets', fileName);

        if (fs.existsSync(filePath)) {
          if (fileName.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          if (fileName.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
          return res.sendFile(filePath);
        }
      }
      next();
    });

    await configureApp(app, { disableSwagger: true });

    app.setBaseViewsDir(join(process.cwd(), 'dist/client'));
    app.setViewEngine('html');
    app.engine('html', hbsExpressEngine);

    const port = Number(process.env.PORT || 10000);
    await app.listen(port, '0.0.0.0');
    logger.log(`Server running on port ${port}`);
  } catch (error) {
    console.error('❌ 致命错误:', error);
    process.exit(1);
  }
}

bootstrap();