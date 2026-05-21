import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { User } from '../database/entities/user.entity';
import { decrypt, encrypt } from './crypto.util';

export async function getValidGoogleAccessToken(
  user: User,
  configService: ConfigService,
  userRepository: Repository<User>,
): Promise<string> {
  const encryptionKey = configService.getOrThrow<string>(
    'GOOGLE_TOKEN_ENCRYPTION_KEY',
  );

  if (!user.googleRefreshTokenEnc) {
    throw new Error('User does not have a Google refresh token');
  }

  const refreshToken = decrypt(user.googleRefreshTokenEnc, encryptionKey);

  const oauth2Client = new google.auth.OAuth2(
    configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
    configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh Google access token');
    }

    const encryptedAccessToken = encrypt(
      credentials.access_token,
      encryptionKey,
    );
    await userRepository.update(user.id, {
      googleAccessTokenEnc: encryptedAccessToken,
    });

    return credentials.access_token;
  } catch (error) {
    // If refresh fails, try using the stored access token directly
    if (user.googleAccessTokenEnc) {
      return decrypt(user.googleAccessTokenEnc, encryptionKey);
    }
    throw error;
  }
}
