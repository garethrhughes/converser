import {
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../database/entities/user.entity';
import { encrypt } from '../common/crypto.util';
import { GoogleProfile } from './strategies/google.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthCodeEntry {
  userId: string;
  expiresAt: number;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly encryptionKey: string;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  // Short-lived auth codes for the OAuth callback → frontend exchange
  // In production, use Redis or a DB table; in-memory is acceptable for single-instance dev
  private readonly authCodes = new Map<string, AuthCodeEntry>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.getOrThrow<string>(
      'GOOGLE_TOKEN_ENCRYPTION_KEY',
    );
    this.accessExpiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );
    this.refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
  }

  onModuleInit(): void {
    if (this.encryptionKey.length !== 64) {
      throw new Error(
        'GOOGLE_TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
      );
    }
  }

  async handleGoogleLogin(profile: GoogleProfile): Promise<string> {
    let user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    const googleAccessTokenEnc = profile.accessToken
      ? encrypt(profile.accessToken, this.encryptionKey)
      : undefined;
    const googleRefreshTokenEnc = profile.refreshToken
      ? encrypt(profile.refreshToken, this.encryptionKey)
      : undefined;

    if (user) {
      user.email = profile.email;
      user.name = profile.name;
      user.picture = profile.picture;
      if (googleAccessTokenEnc) {
        user.googleAccessTokenEnc = googleAccessTokenEnc;
      }
      if (googleRefreshTokenEnc) {
        user.googleRefreshTokenEnc = googleRefreshTokenEnc;
      }
      user = await this.userRepository.save(user);
      this.logger.log({
        msg: 'User logged in',
        userId: user.id,
        email: user.email,
      });
    } else {
      user = await this.userRepository.save(
        this.userRepository.create({
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          googleAccessTokenEnc,
          googleRefreshTokenEnc,
        }),
      );
      this.logger.log({
        msg: 'New user created',
        userId: user.id,
        email: user.email,
      });
    }

    // Generate a short-lived auth code instead of returning tokens directly
    return this.generateAuthCode(user.id);
  }

  async exchangeAuthCode(code: string): Promise<TokenPair> {
    const entry = this.authCodes.get(code);
    this.authCodes.delete(code); // Single-use

    if (!entry || entry.expiresAt < Date.now()) {
      this.logger.warn({
        msg: 'Invalid or expired auth code exchange attempt',
      });
      throw new UnauthorizedException('Invalid or expired auth code');
    }

    const user = await this.userRepository.findOne({
      where: { id: entry.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    this.logger.log({ msg: 'Auth code exchanged', userId: user.id });
    return this.generateTokens(user);
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.hashedRefreshToken) {
      this.logger.warn({ msg: 'Refresh attempt with no stored token', userId });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);

    if (!isValid) {
      // Token reuse detected — invalidate all tokens
      user.hashedRefreshToken = undefined;
      await this.userRepository.save(user);
      this.logger.warn({
        msg: 'Refresh token reuse detected — all tokens invalidated',
        userId,
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    this.logger.log({ msg: 'Token refreshed', userId });
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      hashedRefreshToken: undefined,
    });
    this.logger.log({ msg: 'User logged out', userId });
  }

  private generateAuthCode(userId: string): string {
    const code = randomBytes(32).toString('hex');
    this.authCodes.set(code, {
      userId,
      expiresAt: Date.now() + 60_000, // 1 minute TTL
    });

    // Clean up expired codes periodically
    this.cleanupExpiredCodes();

    return code;
  }

  private cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [code, entry] of this.authCodes) {
      if (entry.expiresAt < now) {
        this.authCodes.delete(code);
      }
    }
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const accessPayload = { sub: user.id, email: user.email, type: 'access' };
    const refreshPayload = { sub: user.id, email: user.email, type: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.accessExpiration as unknown as number,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.refreshExpiration as unknown as number,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(user.id, { hashedRefreshToken });

    return { accessToken, refreshToken };
  }
}
