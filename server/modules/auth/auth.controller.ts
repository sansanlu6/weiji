import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@shared/auth.interface';

interface AuthenticatedRequest extends Request {
  user: { userId: string; username: string };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(body.username, body.password);
  }

  @Post('login')
  async login(@Body() body: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest): Promise<AuthUser> {
    return this.authService.getMe(req.user.userId);
  }
}
