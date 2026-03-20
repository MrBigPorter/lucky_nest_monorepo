import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerifiedOauthProfile } from './provider.types';

interface GoogleTokenInfo {
  aud?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean | string;
}

@Injectable()
export class GoogleProvider {
  constructor(private readonly configService: ConfigService) {}

  async verify(idToken: string): Promise<VerifiedOauthProfile> {
    const token = idToken.trim();
    if (!token) {
      throw new UnauthorizedException('Invalid google token');
    }

    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        token,
      )}`,
    );

    if (!res.ok) {
      throw new UnauthorizedException('Google token verification failed');
    }

    const data = (await res.json()) as GoogleTokenInfo;
    const providerUserId = data.sub?.trim();
    if (!providerUserId) {
      throw new UnauthorizedException('Google token missing subject');
    }

    const expectedAudience = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (expectedAudience && data.aud !== expectedAudience) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    if (data.email_verified === false || data.email_verified === 'false') {
      throw new UnauthorizedException('Google email not verified');
    }

    return {
      providerUserId,
      email: data.email?.trim() || null,
      nickname: data.name?.trim() || null,
      avatar: data.picture?.trim() || null,
    };
  }
}
