"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get JWT_SECRET () {
        return JWT_SECRET;
    },
    get JwtAuthGuard () {
        return JwtAuthGuard;
    }
});
const _common = require("@nestjs/common");
const _nodecrypto = require("node:crypto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
const JWT_SECRET = process.env.JWT_SECRET || 'healthtrack_jwt_secret_key_change_in_prod';
const SECRET_FROM_ENV = !!process.env.JWT_SECRET;
function maskSecret(secret) {
    if (secret.length <= 10) return '***';
    return `${secret.slice(0, 5)}...${secret.slice(-5)}`;
}
function maskToken(token) {
    if (token.length <= 20) return '***';
    return `${token.slice(0, 10)}...${token.slice(-10)}`;
}
function verifyToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        const err = new Error('Invalid token format');
        err.name = 'FormatError';
        throw err;
    }
    const [headerPart, payloadPart, signaturePart] = parts;
    const expectedSig = (0, _nodecrypto.createHmac)('sha256', JWT_SECRET).update(`${headerPart}.${payloadPart}`).digest('base64url');
    if (signaturePart !== expectedSig) {
        const err = new Error('Invalid signature');
        err.name = 'SignatureError';
        throw err;
    }
    let payload;
    try {
        payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
    } catch  {
        const err = new Error('Invalid payload encoding');
        err.name = 'PayloadError';
        throw err;
    }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        const err = new Error('Token expired');
        err.name = 'TokenExpiredError';
        throw err;
    }
    return payload;
}
let JwtAuthGuard = class JwtAuthGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const url = request.url || '';
        const method = request.method || '';
        const headerKeys = Object.keys(request.headers || {});
        const customToken = request.headers?.['x-app-jwt-token'];
        const authLower = request.headers?.['authorization'];
        const authUpper = request.headers?.['Authorization'];
        const authHeader = authLower || authUpper;
        let token = '';
        let tokenSource = '';
        if (customToken) {
            token = customToken.startsWith('Bearer ') || customToken.startsWith('bearer ') ? customToken.slice(7) : customToken;
            tokenSource = 'x-app-jwt-token';
        } else if (authHeader) {
            if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
                token = authHeader.slice(7);
                tokenSource = 'authorization';
            } else {
                this.logger.warn(`[JWT] Authorization header present but no Bearer prefix on ${method} ${url}: ${maskToken(authHeader)}`);
                throw new _common.UnauthorizedException({
                    message: '未登录或登录已过期',
                    jwtErrorName: 'MissingToken',
                    jwtErrorMessage: 'Missing Bearer prefix',
                    debugHeaderPrefix: authHeader.slice(0, 20),
                    debugPath: url
                });
            }
        } else {
            const headerSummary = headerKeys.filter((k)=>![
                    'cookie'
                ].includes(k.toLowerCase())).slice(0, 40).join(', ');
            this.logger.warn(`[JWT] No token found on ${method} ${url}\n` + `  x-app-jwt-token = ${customToken ? 'present' : 'undefined'}\n` + `  authorization = ${authLower ? 'present' : 'undefined'}\n` + `  all header keys (${headerKeys.length}): [${headerSummary}]\n` + `  request.userContext = ${request.userContext ? 'present' : 'undefined'}`);
            throw new _common.UnauthorizedException({
                message: '未登录或登录已过期',
                jwtErrorName: 'MissingToken',
                jwtErrorMessage: 'No token found in x-app-jwt-token or authorization header',
                debugHeaderKeys: headerKeys,
                debugPath: url,
                debugMethod: method
            });
        }
        try {
            const payload = verifyToken(token);
            request.user = {
                userId: payload.sub,
                username: payload.username
            };
            return true;
        } catch (err) {
            const errorName = err instanceof Error ? err.name : 'UnknownError';
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorStack = err instanceof Error ? err.stack : undefined;
            this.logger.error(`[JWT] verify failed on ${url}\n` + `  name=${errorName}\n` + `  message=${errorMessage}\n` + `  token=${maskToken(token)} (len=${token.length})\n` + `  secret=${maskSecret(JWT_SECRET)} (len=${JWT_SECRET.length}, fromEnv=${SECRET_FROM_ENV})\n` + `  stack=${errorStack}`);
            throw new _common.UnauthorizedException({
                message: '登录已过期，请重新登录',
                jwtErrorName: errorName,
                jwtErrorMessage: errorMessage,
                secretUsed: maskSecret(JWT_SECRET),
                secretLen: JWT_SECRET.length,
                secretFromEnv: SECRET_FROM_ENV,
                tokenLen: token.length,
                tokenPreview: maskToken(token),
                path: url
            });
        }
    }
    constructor(){
        this.logger = new _common.Logger(JwtAuthGuard.name);
        this.logger.log(`[JWT] Secret loaded: ${maskSecret(JWT_SECRET)} (len=${JWT_SECRET.length}, fromEnv=${SECRET_FROM_ENV})`);
    }
};
JwtAuthGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], JwtAuthGuard);
