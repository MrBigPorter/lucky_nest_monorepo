import { Injectable, UnauthorizedException } from '@nestjs/common';
import { VerifiedOauthProfile } from './provider.types';

interface FacebookProfileResponse {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

@Injectable()
export class FacebookProvider {
  async verify(input: {
    accessToken: string;
    userId: string;
  }): Promise<VerifiedOauthProfile> {
    const accessToken = input.accessToken.trim();
    const userId = input.userId.trim();

    if (!accessToken || !userId) {
      throw new UnauthorizedException('Invalid facebook token');
    }

    const fields = 'id,name,email,picture';
    const res = await fetch(
      `https://graph.facebook.com/me?fields=${fields}&access_token=${encodeURIComponent(
        accessToken,
      )}`,
    );

    if (!res.ok) {
      throw new UnauthorizedException('Facebook token verification failed');
    }

    const data = (await res.json()) as FacebookProfileResponse;
    if (!data.id || data.id !== userId) {
      throw new UnauthorizedException('Facebook user mismatch');
    }

    return {
      providerUserId: data.id,
      email: data.email?.trim() || null,
      nickname: data.name?.trim() || null,
      avatar: data.picture?.data?.url?.trim() || null,
    };
  }
}
