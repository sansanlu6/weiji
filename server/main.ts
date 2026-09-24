import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join, resolve } from 'path';
import * as fs from 'fs';
import * as express from 'express';
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

    const assetsDir = resolve(process.cwd(), 'client');
    const viewsDir = resolve(process.cwd(), 'dist/client');

    console.log('当前工作目录:', process.cwd());
    console.log('静态资源目录:', assetsDir);
    console.log('HTML 模板目录:', viewsDir);

    // 💥 1. 严格的静态资源拦截器（精准打印 + 拒绝 HTML 伪装）
    app.use((req: any, res: any, next: any) => {
      const url = req.url || '';
      
      // 修复双斜杠
      if (url.includes('//')) {
        req.url = url.replace(/\/{2,}/g, '/');
      }

      // 妙搭时间校准接口。
      // 前端会执行 BigInt(response.data.timestampNs)，因此必须返回纳秒时间戳。
      if (
        url.includes('/current_server_timestamp') ||
        url.includes('/time-offset')
      ) {
        const timestampNs = (
          BigInt(Date.now()) * 1_000_000n
        ).toString();

        return res.json({
          code: 0,
          message: 'success',
          data: {
            timestampNs,
          },
        });
      }

      // 其他妙搭监控打点接口可以返回空数据
      if (
        url.includes('/observability/') ||
        url.includes('/metrics/')
      ) {
        return res.json({
          code: 0,
          message: 'success',
          data: {},
        });
      }

      // 判定是否为静态资源请求
      const isStaticAsset = /\.(js|css|svg|png|jpg|ico|woff2?)$/i.test(url.split('?')[0]);

      if (isStaticAsset) {
        // 提取纯净的文件名与路径
        const cleanPath = url.split('?')[0];
        // 尝试在多个可能的目录中寻找该文件
        const possiblePaths = [
          join(assetsDir, cleanPath),
          join(
            assetsDir,
            'assets',
            cleanPath.replace(/^.*\/assets\//, ''),
          ),
          join(
            assetsDir,
            cleanPath.replace(/^.*\/app\//, ''),
          ),
        ];

        let foundPath: string | null = null;
        for (const p of possiblePaths) {
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            foundPath = p;
            break;
          }
        }

        if (foundPath) {
          console.log(`✅ [静态资源命中] ${url} -> ${foundPath}`);
          const ext = url.substring(url.lastIndexOf('.')).toLowerCase();
          if (ext.startsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          else if (ext.startsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
          return fs.createReadStream(foundPath).pipe(res);
        } else {
          // ❌ 重点：没找到文件时，直接返回 404 文本！绝不让它去渲染 index.html！
          console.error(`❌ [静态资源缺失 404] 浏览器请求: ${url}`);
          console.error(`   曾尝试搜寻的路径:`, possiblePaths);
          res.status(404).setHeader('Content-Type', 'text/plain');
          return res.send(`Static Asset Not Found on Server: ${url}`);
        }
      }

      next();
    });

    // 💥 2. 加载框架配置
    await configureApp(app, { disableSwagger: true });

    // 💥 3. 视图引擎配置
    app.setBaseViewsDir(viewsDir);
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
