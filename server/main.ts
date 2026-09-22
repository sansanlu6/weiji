import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import { __express as hbsExpressEngine } from 'hbs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    console.log('👉 [Step 1] 开始创建 Nest 应用...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: false, // 设为 false 防止内部直接退出
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

    const host = '0.0.0.0';
    const port = Number(process.env.PORT || 3000);
    console.log(`👉 [Step 4] 准备绑定端口 ${port}...`);

    await app.listen(port, host);
    logger.log(`Server running on http://${host}:${port}`);
  } catch (error) {
    console.error('❌ 捕获到全局致命错误:', error);
    process.exit(1);
  }
}

bootstrap();