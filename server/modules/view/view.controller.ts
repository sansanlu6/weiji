import { Controller, Get, Render, Req } from '@nestjs/common';
import type { Request } from 'express';

const APP_NAME = '记录微小，留下痕迹';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

@Controller()
export class ViewController {
  @Get(['/', '*'])
  @Render('index')
  async render(
    @Req() req: Request,
  ): Promise<{
    __platform__: string;
    basename: string;
    appName: string;
    appDescription: string;
  }> {
    const requestPlatformData = req.__platform_data__ ?? {};
    const requestPublished = isRecord(requestPlatformData.appPublished)
      ? requestPlatformData.appPublished
      : {};
    const requestAppInfo = isRecord(requestPublished.app_info)
      ? requestPublished.app_info
      : {};

    const platformData = {
      ...requestPlatformData,
      basename: '/',
      appPublished: {
        ...requestPublished,
        app_info: {
          ...requestAppInfo,
          app_name: APP_NAME,
          show_badge: false,
        },
        app_runtime_extra: requestPublished.app_runtime_extra ?? {},
      },
    };

    return {
      __platform__: JSON.stringify(platformData),
      basename: '/',
      // 生产构建会把 HTML 的 <title> 换成 {{appName}}，因此必须由首屏渲染直接提供正确名称。
      appName: APP_NAME,
      appDescription: APP_NAME,
    };
  }
}
