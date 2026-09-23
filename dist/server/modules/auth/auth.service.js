"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _nodecrypto = require("node:crypto");
const _nodeutil = require("node:util");
const _schema = require("../../database/schema");
const _drizzleorm = require("drizzle-orm");
const _jwtauthguard = require("./jwt-auth.guard");
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const scryptAsync = (0, _nodeutil.promisify)(_nodecrypto.scrypt);
const SALT_LEN = 16;
const KEY_LEN = 64;
async function hashPassword(password) {
    const salt = (0, _nodecrypto.randomBytes)(SALT_LEN).toString('hex');
    const derived = await scryptAsync(password, salt, KEY_LEN);
    return `${salt}:${derived.toString('hex')}`;
}
async function verifyPassword(password, hash) {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const derived = await scryptAsync(password, salt, KEY_LEN);
    return derived.toString('hex') === key;
}
let AuthService = class AuthService {
    async register(username, password) {
        if (password.length < 6) {
            throw new _common.UnauthorizedException('密码长度至少6位');
        }
        const existing = await this.db.select({
            id: _schema.healthAppUsers.id
        }).from(_schema.healthAppUsers).where((0, _drizzleorm.eq)(_schema.healthAppUsers.username, username)).limit(1);
        if (existing.length > 0) {
            throw new _common.ConflictException('用户名已存在');
        }
        const passwordHash = await hashPassword(password);
        const inserted = await this.db.insert(_schema.healthAppUsers).values({
            username,
            passwordHash
        }).returning({
            id: _schema.healthAppUsers.id,
            username: _schema.healthAppUsers.username,
            createdAt: _schema.healthAppUsers.createdAt
        });
        const user = inserted[0];
        const token = this.signToken(user.id, user.username);
        return {
            token,
            user: this.toUserDto(user)
        };
    }
    async login(username, password) {
        const rows = await this.db.select({
            id: _schema.healthAppUsers.id,
            username: _schema.healthAppUsers.username,
            passwordHash: _schema.healthAppUsers.passwordHash,
            createdAt: _schema.healthAppUsers.createdAt
        }).from(_schema.healthAppUsers).where((0, _drizzleorm.eq)(_schema.healthAppUsers.username, username)).limit(1);
        if (rows.length === 0) {
            this.logger.warn(`[Login] user not found: ${username}`);
            throw new _common.UnauthorizedException('用户名或密码错误');
        }
        const user = rows[0];
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            this.logger.warn(`[Login] invalid password for user: ${username}`);
            throw new _common.UnauthorizedException('用户名或密码错误');
        }
        const token = this.signToken(user.id, user.username);
        this.logger.log(`[Login] success: ${username} (${user.id})`);
        return {
            token,
            user: this.toUserDto(user)
        };
    }
    async getMe(userId) {
        const rows = await this.db.select({
            id: _schema.healthAppUsers.id,
            username: _schema.healthAppUsers.username,
            createdAt: _schema.healthAppUsers.createdAt
        }).from(_schema.healthAppUsers).where((0, _drizzleorm.eq)(_schema.healthAppUsers.id, userId)).limit(1);
        if (rows.length === 0) {
            throw new _common.NotFoundException('用户不存在');
        }
        return this.toUserDto(rows[0]);
    }
    signToken(userId, username) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 7 * 24 * 60 * 60;
        const payload = {
            sub: userId,
            username,
            iat: now,
            exp: now + expiresIn
        };
        const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = (0, _nodecrypto.createHmac)('sha256', _jwtauthguard.JWT_SECRET).update(`${base64Header}.${base64Payload}`).digest('base64url');
        return `${base64Header}.${base64Payload}.${signature}`;
    }
    toUserDto(row) {
        return {
            id: row.id,
            username: row.username,
            createdAt: row.createdAt.toISOString()
        };
    }
    constructor(db){
        this.db = db;
        this.logger = new _common.Logger(AuthService.name);
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fullstacknestjscore.DRIZZLE_DATABASE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PostgresJsDatabase === "undefined" ? Object : PostgresJsDatabase
    ])
], AuthService);
