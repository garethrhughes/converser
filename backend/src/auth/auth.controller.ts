import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ExchangeCodeDto } from './dto/exchange-code.dto';
import { GoogleProfile } from './strategies/google.strategy';

interface AuthenticatedRequest extends Request {
  user?: GoogleProfile | { sub: string; email: string; type: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly secureCookies: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    // Default to secure; only disable when explicitly opted out
    this.secureCookies =
      this.configService.get<string>('COOKIE_SECURE', 'true') !== 'false';
  }

  @Public()
  @SkipThrottle()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleLogin(): void {
    // Guard redirects to Google
  }

  @Public()
  @SkipThrottle()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as GoogleProfile;
    const authCode = await this.authService.handleGoogleLogin(profile);
    const tokens = await this.authService.exchangeAuthCode(authCode);

    // Set refresh token cookie during the redirect (browser navigation, not fetch)
    // This ensures the cookie is set on the localhost domain reliably
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    // Redirect to frontend with short-lived auth code for the access token
    const code = await this.authService.createAccessCodeForUser(
      tokens.accessToken,
    );
    res.redirect(`${this.frontendUrl}/auth/callback?code=${code}`);
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 per minute per IP
  @Post('exchange')
  @ApiOperation({ summary: 'Exchange auth code for access token' })
  async exchangeCode(
    @Body() dto: ExchangeCodeDto,
    @Res() res: Response,
  ): Promise<void> {
    // The refresh token was already set as a cookie during the redirect.
    // This endpoint only returns the access token.
    const accessToken = this.authService.exchangeAccessCode(dto.code);
    res.json({ accessToken });
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 10 } }) // 10 per minute per IP
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: string; type: string }>(
        refreshToken,
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const tokens = await this.authService.refreshTokens(
      payload.sub,
      refreshToken,
    );

    this.setRefreshTokenCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    // This route is protected by the global JwtAuthGuard (requires valid access token)
    const user = req.user as { sub: string };
    await this.authService.logout(user.sub);

    res.clearCookie('refresh_token', { path: '/' });
    res.json({ message: 'Logged out' });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: this.secureCookies ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
