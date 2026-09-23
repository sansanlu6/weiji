import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import { __express as hbsExpressEngine } from 'hbs';
import * as express from 'express';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. 环境变量双向补齐
  if (process.env.DATABASE_URL && !process.env.SUDA_DATABASE_URL) {
    process.env.SUDA_DATABASE_URL = process.env.DATABASE_URL;
  }
  if (process.env.SUDA_DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.SUDA_DATABASE_URL;
  }

  const rawDbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = rawDbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('👉 [Debug] 当前环境变量 DATABASE_URL 结构:', maskedUrl);

  const logger = new Logger('Bootstrap');
  try {
    console.log('👉 [Step 1] 开始创建 Nest 应用...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: false,
    });

    console.log('👉 [Step 2] 正在执行 configureApp...');
    try {
      await configureApp(app, { disableSwagger: true });
    } catch (err) {
      console.error('❌ [Step 2 异常] configureApp 内部报错:', err);
      throw err;
    }

    console.log('👉 [Step 3] 正在配置视图引擎...');
    app.setBaseViewsDir(join(process.cwd(), 'dist/client'));
    app.setViewEngine('html');
    app.engine('html', hbsExpressEngine);

    // ------------------- 关键补丁：在 configureApp 之后压入 Express 队首 -------------------
    const instance = app.getHttpAdapter().getInstance();
    
    // 创建一个专用的 Express 静态 router，强制在队首响应 assets 请求
    const assetsRouter = express.Router();
    assetsRouter.use(express.static(join(process.cwd(), 'dist/client/assets')));
    
    // 强制把这个 Router 插入到 Express 内部 stack 数组的最顶部 (index 0)
    instance._router.stack.unshift({
      match: (path: string) => path.startsWith('/assets'),
      handle: (req: any, res: any, next: any) => {
        if (req.url.startsWith('/assets')) {
          // 剥离 /assets 前缀后再由 static 中间件处理
          req.url = req.url.replace(/^\/assets/, '');
          return express.static(join(process.cwd(), 'dist/client/assets'))(req, res, next);
        }
        next();
      },
      name: 'assets_force_override',
      keys: [],
      regexp: /^\/assets\/?(?=\/|$)/i,
    });
    // ---------------------------------------------------------------------------------------

    const host = '0.0.0.0';
    const port = Number(process.env.PORT || 10000);
    console.log(`👉 [Step 4] 准备绑定端口 ${port}...`);

    await app.listen(port, host);
    logger.log(`Server running on http://${host}:${port}`);
  } catch (error) {
    console.error('❌ 捕获到全局致命错误:', error);
    process.exit(1);
  }
}

bootstrap();