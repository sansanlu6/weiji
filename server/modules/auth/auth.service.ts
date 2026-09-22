import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { scrypt, randomBytes, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

import { healthAppUsers } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import type { AuthResponse, AuthUser } from '@shared/auth.interface';
import { JWT_SECRET } from './jwt-auth.guard';

const scryptAsync = promisify(scrypt);

const SALT_LEN = 16;
const KEY_LEN = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return derived.toString('hex') === key;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async register(username: string, password: string): Promise<AuthResponse> {
    if (password.length < 6) {
      throw new UnauthorizedException('密码长度至少6位');
    }

    const existing = await this.db
      .select({ id: healthAppUsers.id })
      .from(healthAppUsers)
      .where(eq(healthAppUsers.username, username))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = await hashPassword(password);
    const inserted = await this.db
      .insert(healthAppUsers)
      .values({ username, passwordHash })
      .returning({ id: healthAppUsers.id, username: healthAppUsers.username, createdAt: healthAppUsers.createdAt });

    const user = inserted[0];
    const token = this.signToken(user.id, user.username);
    return { token, user: this.toUserDto(user) };
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const rows = await this.db
      .select({
        id: healthAppUsers.id,
        username: healthAppUsers.username,
        passwordHash: healthAppUsers.passwordHash,
        createdAt: healthAppUsers.createdAt,
      })
      .from(healthAppUsers)
      .where(eq(healthAppUsers.username, username))
      .limit(1);

    if (rows.length === 0) {
      this.logger.warn(`[Login] user not found: ${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    const user = rows[0];
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`[Login] invalid password for user: ${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.signToken(user.id, user.username);
    this.logger.log(`[Login] success: ${username} (${user.id})`);
    return { token, user: this.toUserDto(user) };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const rows = await this.db
      .select({
        id: healthAppUsers.id,
        username: healthAppUsers.username,
        createdAt: healthAppUsers.createdAt,
      })
      .from(healthAppUsers)
      .where(eq(healthAppUsers.id, userId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    return this.toUserDto(rows[0]);
  }

  private signToken(userId: string, username: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 7 * 24 * 60 * 60;
    const payload = { sub: userId, username, iat: now, exp: now + expiresIn };
    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');
    return `${base64Header}.${base64Payload}.${signature}`;
  }

  private toUserDto(row: { id: string; username: string; createdAt: Date }): AuthUser {
    return {
      id: row.id,
      username: row.username,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
