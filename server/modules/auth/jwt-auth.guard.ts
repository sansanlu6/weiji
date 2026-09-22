import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';

export const JWT_SECRET =
  process.env.JWT_SECRET || 'healthtrack_jwt_secret_key_change_in_prod';

const SECRET_FROM_ENV = !!process.env.JWT_SECRET;

function maskSecret(secret: string): string {
  if (secret.length <= 10) return '***';
  return `${secret.slice(0, 5)}...${secret.slice(-5)}`;
}

function maskToken(token: string): string {
  if (token.length <= 20) return '***';
  return `${token.slice(0, 10)}...${token.slice(-10)}`;
}

export interface JwtPayload {
  sub: string;
  username: string;
}

function verifyToken(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    const err = new Error('Invalid token format');
    err.name = 'FormatError';
    throw err;
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  const expectedSig = createHmac('sha256', JWT_SECRET)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64url');
  if (signaturePart !== expectedSig) {
    const err = new Error('Invalid signature');
    err.name = 'SignatureError';
    throw err;
  }
  let payload: JwtPayload & { exp: number };
  try {
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString()) as JwtPayload & { exp: number };
  } catch {
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

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor() {
    this.logger.log(
      `[JWT] Secret loaded: ${maskSecret(JWT_SECRET)} (len=${JWT_SECRET.length}, fromEnv=${SECRET_FROM_ENV})`,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url || '';
    const method = request.method || '';

    const headerKeys = Object.keys(request.headers || {});
    const customToken = request.headers?.['x-app-jwt-token'] as string | undefined;
    const authLower = request.headers?.['authorization'] as string | undefined;
    const authUpper = request.headers?.['Authorization'] as string | undefined;
    const authHeader = authLower || authUpper;

    let token = '';
    let tokenSource = '';

    if (customToken) {
      token = customToken.startsWith('Bearer ') || customToken.startsWith('bearer ')
        ? customToken.slice(7)
        : customToken;
      tokenSource = 'x-app-jwt-token';
    } else if (authHeader) {
      if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
        token = authHeader.slice(7);
        tokenSource = 'authorization';
      } else {
        this.logger.warn(
          `[JWT] Authorization header present but no Bearer prefix on ${method} ${url}: ${maskToken(authHeader)}`,
        );
        throw new UnauthorizedException({
          message: '未登录或登录已过期',
          jwtErrorName: 'MissingToken',
          jwtErrorMessage: 'Missing Bearer prefix',
          debugHeaderPrefix: authHeader.slice(0, 20),
          debugPath: url,
        } satisfies Record<string, unknown> as any);
      }
    } else {
      const headerSummary = headerKeys
        .filter((k: string) => !['cookie'].includes(k.toLowerCase()))
        .slice(0, 40)
        .join(', ');
      this.logger.warn(
        `[JWT] No token found on ${method} ${url}\n` +
        `  x-app-jwt-token = ${customToken ? 'present' : 'undefined'}\n` +
        `  authorization = ${authLower ? 'present' : 'undefined'}\n` +
        `  all header keys (${headerKeys.length}): [${headerSummary}]\n` +
        `  request.userContext = ${request.userContext ? 'present' : 'undefined'}`,
      );
      throw new UnauthorizedException({
        message: '未登录或登录已过期',
        jwtErrorName: 'MissingToken',
        jwtErrorMessage: 'No token found in x-app-jwt-token or authorization header',
        debugHeaderKeys: headerKeys,
        debugPath: url,
        debugMethod: method,
      } satisfies Record<string, unknown> as any);
    }
    try {
      const payload = verifyToken(token);
      request.user = { userId: payload.sub, username: payload.username };
      return true;
    } catch (err) {
      const errorName = err instanceof Error ? err.name : 'UnknownError';
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `[JWT] verify failed on ${url}\n` +
        `  name=${errorName}\n` +
        `  message=${errorMessage}\n` +
        `  token=${maskToken(token)} (len=${token.length})\n` +
        `  secret=${maskSecret(JWT_SECRET)} (len=${JWT_SECRET.length}, fromEnv=${SECRET_FROM_ENV})\n` +
        `  stack=${errorStack}`,
      );
      throw new UnauthorizedException({
        message: '登录已过期，请重新登录',
        jwtErrorName: errorName,
        jwtErrorMessage: errorMessage,
        secretUsed: maskSecret(JWT_SECRET),
        secretLen: JWT_SECRET.length,
        secretFromEnv: SECRET_FROM_ENV,
        tokenLen: token.length,
        tokenPreview: maskToken(token),
        path: url,
      } satisfies Record<string, unknown> as any);
    }
  }
}
