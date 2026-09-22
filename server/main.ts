import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import { __express as hbsExpressEngine } from 'hbs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('👉 [1/4] 开始创建 Nest 应用...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: process.env.NODE_ENV !== 'development',
    });

    console.log('👉 [2/4] 正在执行 configureApp...');
    await configureApp(app, { 
      disableSwagger: true,
    });

    const host = '0.0.0.0';
    const port = Number(process.env.PORT || 3000);
    console.log(`👉 [3/4] 准备绑定端口 port: ${port}, host: ${host}`);

    await app.listen(port, host);
    console.log(`👉 [4/4] 服务启动成功！运行在 http://${host}:${port}`);
  } catch (error) {
    console.error('❌ 捕获到致命错误:', error);
    process.exit(1);
  }
}

bootstrap();