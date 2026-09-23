"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _fs = /*#__PURE__*/ _interop_require_wildcard(require("fs"));
const _hbs = require("hbs");
const _appmodule = require("./app.module");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
async function bootstrap() {
    if (process.env.DATABASE_URL && !process.env.SUDA_DATABASE_URL) {
        process.env.SUDA_DATABASE_URL = process.env.DATABASE_URL;
    }
    if (process.env.SUDA_DATABASE_URL && !process.env.DATABASE_URL) {
        process.env.DATABASE_URL = process.env.SUDA_DATABASE_URL;
    }
    const logger = new _common.Logger('Bootstrap');
    try {
        const app = await _core.NestFactory.create(_appmodule.AppModule, {
            abortOnError: false
        });
        // 💥 物理拦截器：防 HTML 误返 + 静默处理 APaaS 框架打点接口
        const server = app.getHttpServer();
        server.on('request', (req, res)=>{
            if (!req.url) return;
            // 1. 修复双斜杠问题，例如 /spark/app//runtime -> /spark/app/runtime
            if (req.url.includes('//')) {
                req.url = req.url.replace(/\/{2,}/g, '/');
            }
            // 2. 拦截并 Mock 掉框架可观测性/打点/时间同步 API，避免返回 404 或返回 HTML 页面
            if (req.url.includes('/observability/') || req.url.includes('/metrics/') || req.url.includes('/time-offset') || req.url.includes('/runtime/api/')) {
                // 如果是数据打点请求，静默返回成功 JSON，防止 SDK 报错卡死页面
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 200;
                return res.end(JSON.stringify({
                    code: 0,
                    message: 'success',
                    data: {}
                }));
            }
            // 3. 原有物理拦截 /assets/ 静态文件
            if (req.url.includes('/assets/')) {
                const urlPath = req.url.split('?')[0];
                const assetPath = urlPath.substring(urlPath.indexOf('/assets/'));
                const filePath = (0, _path.join)(process.cwd(), 'dist/client', assetPath);
                if (_fs.existsSync(filePath) && _fs.statSync(filePath).isFile()) {
                    const ext = _path.extname(filePath).toLowerCase();
                    if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                    else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
                    else if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml');
                    return _fs.createReadStream(filePath).pipe(res);
                }
            }
        });
        await (0, _fullstacknestjscore.configureApp)(app, {
            disableSwagger: true
        });
        app.setBaseViewsDir((0, _path.join)(process.cwd(), 'dist/client'));
        app.setViewEngine('html');
        app.engine('html', _hbs.__express);
        const port = Number(process.env.PORT || 10000);
        await app.listen(port, '0.0.0.0');
        logger.log(`Server running on http://0.0.0.0:${port}`);
    } catch (error) {
        console.error('❌ 致命错误:', error);
        process.exit(1);
    }
}
bootstrap();
