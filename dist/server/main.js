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
// 递归查找指定目录下的文件
function findFileInDir(dir, targetFileName) {
    if (!_fs.existsSync(dir)) return null;
    const files = _fs.readdirSync(dir);
    for (const file of files){
        const fullPath = (0, _path.join)(dir, file);
        const stat = _fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const found = findFileInDir(fullPath, targetFileName);
            if (found) return found;
        } else if (file === targetFileName) {
            return fullPath;
        }
    }
    return null;
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
        // 💥 全局底层 HTTP 拦截器
        const server = app.getHttpServer();
        server.on('request', (req, res)=>{
            if (!req.url) return;
            // 1. 清理双斜杠
            if (req.url.includes('//')) {
                req.url = req.url.replace(/\/{2,}/g, '/');
            }
            // 2. 静默 Mock APaaS 监控打点与时间接口
            if (req.url.includes('/observability/') || req.url.includes('/metrics/') || req.url.includes('/time-offset')) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 200;
                return res.end(JSON.stringify({
                    code: 0,
                    message: 'success',
                    data: {}
                }));
            }
            // 3. 通用静态资源拦截（无论 URL 是否带 /assets/，只要请求 .js/.css 等资源，直接在 dist/client 全局物理匹配）
            const cleanUrl = req.url.split('?')[0];
            const ext = _path.extname(cleanUrl).toLowerCase();
            if ([
                '.js',
                '.css',
                '.svg',
                '.png',
                '.jpg',
                '.ico',
                '.woff',
                '.woff2'
            ].includes(ext)) {
                const fileName = (0, _path.basename)(cleanUrl);
                const distClientDir = (0, _path.join)(process.cwd(), 'dist/client');
                // 全局搜寻该静态文件
                const matchedFilePath = findFileInDir(distClientDir, fileName);
                if (matchedFilePath) {
                    if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                    else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
                    else if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml');
                    return _fs.createReadStream(matchedFilePath).pipe(res);
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
