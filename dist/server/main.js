"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _path = require("path");
const _hbs = require("hbs");
const _appmodule = require("./app.module");
async function bootstrap() {
    // 在 main.ts 的 bootstrap 函数开头加入：
    const rawDbUrl = process.env.DATABASE_URL || '';
    // 隐藏密码打印，防止敏感信息泄露，但能看清结构
    const maskedUrl = rawDbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log('👉 [Debug] 当前环境变量 DATABASE_URL 结构:', maskedUrl);
    const logger = new _common.Logger('Bootstrap');
    try {
        console.log('👉 [Step 1] 开始创建 Nest 应用...');
        const app = await _core.NestFactory.create(_appmodule.AppModule, {
            abortOnError: false
        });
        console.log('👉 [Step 2] 正在执行 configureApp...');
        try {
            await (0, _fullstacknestjscore.configureApp)(app, {
                disableSwagger: true
            });
        } catch (err) {
            console.error('❌ [Step 2 异常] configureApp 内部报错:', err);
            throw err;
        }
        console.log('👉 [Step 3] 正在配置视图引擎...');
        app.setBaseViewsDir((0, _path.join)(process.cwd(), 'dist/client'));
        app.setViewEngine('html');
        app.engine('html', _hbs.__express);
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
