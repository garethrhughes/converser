import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { GoogleProfile } from './strategies/google.strategy';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  const mockEncryptionKey = 'a'.repeat(64); // 32 bytes in hex

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_ACCESS_EXPIRATION: '15m',
                JWT_REFRESH_EXPIRATION: '7d',
                NODE_ENV: 'test',
              };
              return config[key] ?? defaultValue ?? '';
            }),
            getOrThrow: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GOOGLE_TOKEN_ENCRYPTION_KEY: mockEncryptionKey,
                JWT_SECRET: 'test-secret',
              };
              const value = config[key];
              if (!value) throw new Error(`Missing config: ${key}`);
              return value;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('handleGoogleLogin', () => {
    const mockProfile: GoogleProfile = {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      accessToken: 'google-access-token',
      refreshToken: 'google-refresh-token',
    };

    it('should create a new user and return an auth code', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        id: 'user-uuid-1',
        ...mockProfile,
      });
      userRepository.save.mockResolvedValue({
        id: 'user-uuid-1',
        email: mockProfile.email,
        googleId: mockProfile.googleId,
      });

      const authCode = await service.handleGoogleLogin(mockProfile);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
      expect(userRepository.create).toHaveBeenCalled();
      expect(authCode).toBeDefined();
      expect(typeof authCode).toBe('string');
      expect(authCode.length).toBe(64); // 32 bytes hex
    });

    it('should update an existing user on subsequent login', async () => {
      const existingUser = {
        id: 'user-uuid-1',
        googleId: 'google-123',
        email: 'old@example.com',
        name: 'Old Name',
      };
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue({
        ...existingUser,
        email: mockProfile.email,
        name: mockProfile.name,
      });

      const authCode = await service.handleGoogleLogin(mockProfile);

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(existingUser.email).toBe(mockProfile.email);
      expect(authCode).toBeDefined();
    });

    it('should encrypt Google tokens before storing', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockImplementation((data) => data);
      userRepository.save.mockImplementation((data) => ({
        id: 'user-uuid-1',
        ...data,
      }));

      await service.handleGoogleLogin(mockProfile);

      const savedData = userRepository.create.mock.calls[0][0];
      expect(savedData.googleAccessTokenEnc).toBeDefined();
      expect(savedData.googleAccessTokenEnc).not.toBe(mockProfile.accessToken);
      expect(savedData.googleRefreshTokenEnc).toBeDefined();
      expect(savedData.googleRefreshTokenEnc).not.toBe(
        mockProfile.refreshToken,
      );
    });
  });

  describe('exchangeAuthCode', () => {
    it('should exchange a valid auth code for tokens', async () => {
      const mockProfile: GoogleProfile = {
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };

      userRepository.findOne.mockResolvedValueOnce(null); // handleGoogleLogin
      userRepository.create.mockReturnValue({ id: 'user-uuid-1' });
      userRepository.save.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
      });
      userRepository.update.mockResolvedValue(undefined);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const authCode = await service.handleGoogleLogin(mockProfile);

      // Now exchange the code
      userRepository.findOne.mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'test@example.com',
      });

      const tokens = await service.exchangeAuthCode(authCode);

      expect(tokens.accessToken).toBe('access-token');
      expect(tokens.refreshToken).toBe('refresh-token');
    });

    it('should reject an already-used auth code', async () => {
      const mockProfile: GoogleProfile = {
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };

      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue({ id: 'user-uuid-1' });
      userRepository.save.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
      });
      userRepository.update.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('token');

      const authCode = await service.handleGoogleLogin(mockProfile);

      userRepository.findOne.mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'test@example.com',
      });

      // First exchange succeeds
      await service.exchangeAuthCode(authCode);

      // Second exchange fails (single-use)
      await expect(service.exchangeAuthCode(authCode)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject an invalid auth code', async () => {
      await expect(service.exchangeAuthCode('invalid-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should issue new tokens when refresh token is valid', async () => {
      const hashedToken = await bcrypt.hash('valid-refresh-token', 10);
      const user = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        hashedRefreshToken: hashedToken,
      };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(undefined);
      jwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');

      const result = await service.refreshTokens(
        'user-uuid-1',
        'valid-refresh-token',
      );

      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should include type claim in generated tokens', async () => {
      const hashedToken = await bcrypt.hash('valid-refresh-token', 10);
      const user = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        hashedRefreshToken: hashedToken,
      };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(undefined);
      jwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');

      await service.refreshTokens('user-uuid-1', 'valid-refresh-token');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'access' }),
        expect.anything(),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'refresh' }),
        expect.anything(),
      );
    });

    it('should throw when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshTokens('non-existent', 'token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user has no stored refresh token', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'user-uuid-1',
        hashedRefreshToken: null,
      });

      await expect(
        service.refreshTokens('user-uuid-1', 'token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should invalidate all tokens on reuse detection', async () => {
      const hashedToken = await bcrypt.hash('original-token', 10);
      const user = {
        id: 'user-uuid-1',
        email: 'test@example.com',
        hashedRefreshToken: hashedToken,
      };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await expect(
        service.refreshTokens('user-uuid-1', 'wrong-token'),
      ).rejects.toThrow('Refresh token reuse detected');

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ hashedRefreshToken: undefined }),
      );
    });
  });

  describe('logout', () => {
    it('should clear the hashed refresh token', async () => {
      userRepository.update.mockResolvedValue(undefined);

      await service.logout('user-uuid-1');

      expect(userRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        hashedRefreshToken: undefined,
      });
    });
  });

  describe('onModuleInit', () => {
    it('should throw if encryption key is not 64 hex characters', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: getRepositoryToken(User),
            useValue: userRepository,
          },
          {
            provide: JwtService,
            useValue: jwtService,
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ''),
              getOrThrow: jest.fn((key: string) => {
                if (key === 'GOOGLE_TOKEN_ENCRYPTION_KEY') return 'short-key';
                return 'value';
              }),
            },
          },
        ],
      }).compile();

      const badService = module.get<AuthService>(AuthService);
      expect(() => badService.onModuleInit()).toThrow(
        'GOOGLE_TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
      );
    });
  });
});
