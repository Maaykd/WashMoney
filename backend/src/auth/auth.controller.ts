import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = this.authService.validateUser(body.email, body.password);

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    res.cookie('auth', 'logado', {
      httpOnly: true,
      sameSite: 'lax',
    });

    return { user };
  }

  @Get('me')
  me() {
    const user = this.authService.getMe();
    if (!user) throw new UnauthorizedException();
    return { user, tenant: user.tenant };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth');
    return { ok: true };
  }
}
