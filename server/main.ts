import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import { __express as hbsExpressEngine } from 'hbs';
import * as express from 'express';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. 双向补齐环境变量，确保底层框架与标准配置兼容
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
    console.log('[Step 1] 开始创建 Nest 应用...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: false,
    });

    // ------------------- 最顶层 Express 路由强行拦截 -------------------
    // 必须在 configureApp 执行前，把静态资源直接暴露在原生 Express 最前端
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    // 1) 优先拦截 /assets 下的所有 JS/CSS/图片 请求
    instance.use(
      '/assets',
      express.static(join(process.cwd(), 'dist/client/assets'), {
        fallthrough: false, // 找不到资源时直接报 404，不向下流转到 configureApp 渲染 index.html
      }),
    );

    // 2) 托管 client 根目录下的静态资源（如 favicon.ico 等）
    instance.use(
      express.static(join(process.cwd(), 'dist/client'), {
        index: false, // 禁止默认返回 index.html，防止覆盖路由
      }),
    );
    // -------------------------------------------------------------------

    console.log('[Step 2] 正在执行 configureApp...');
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