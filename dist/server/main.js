"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _path = require("path");
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
    // 环境变量双向补齐
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
        // 💥 终极物理拦截：只要是请求 assets 里的文件，直接用原生 fs 读文件输出
        const server = app.getHttpAdapter().getInstance();
        server.use((req, res, next)=>{
            if (req.url.includes('/assets/')) {
                const fileName = req.url.split('/assets/')[1].split('?')[0];
                const filePath = (0, _path.join)(process.cwd(), 'dist/client/assets', fileName);
                if (_fs.existsSync(filePath)) {
                    if (fileName.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                    if (fileName.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
                    return res.sendFile(filePath);
                }
            }
            next();
        });
        await (0, _fullstacknestjscore.configureApp)(app, {
            disableSwagger: true
        });
        app.setBaseViewsDir((0, _path.join)(process.cwd(), 'dist/client'));
        app.setViewEngine('html');
        app.engine('html', _hbs.__express);
        const port = Number(process.env.PORT || 10000);
        await app.listen(port, '0.0.0.0');
        logger.log(`Server running on port ${port}`);
    } catch (error) {
        console.error('❌ 致命错误:', error);
        process.exit(1);
    }
}
bootstrap();
