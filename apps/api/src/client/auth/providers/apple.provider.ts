import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerifiedOauthProfile } from './provider.types';

interface AppleTokenPayload {
  sub?: string;
  email?: string;
  exp?: number;
  aud?: string;
}

@Injectable()
export class AppleProvider {
  constructor(private readonly configService: ConfigService) {}

  async verify(idToken: string): Promise<VerifiedOauthProfile> {
    const token = idToken.trim();
    if (!token) {
      throw new UnauthorizedException('Invalid apple token');
    }

    const payload = await Promise.resolve(this.parseJwtPayload(token));
    const providerUserId = payload.sub?.trim();
    if (!providerUserId) {
      throw new UnauthorizedException('Apple token missing subject');
    }

    if (typeof payload.exp === 'number') {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSeconds) {
        throw new UnauthorizedException('Apple token expired');
      }
    }

    const expectedAudience = this.configService.get<string>('APPLE_CLIENT_ID');
    if (expectedAudience && payload.aud && payload.aud !== expectedAudience) {
      throw new UnauthorizedException('Apple token audience mismatch');
    }

    return {
      providerUserId,
      email: payload.email?.trim() || null,
      nickname: null,
      avatar: null,
    };
  }

  private parseJwtPayload(idToken: string): AppleTokenPayload {
    const parts = idToken.split('.');
    if (parts.length < 2) {
      throw new UnauthorizedException('Apple token format invalid');
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const json = Buffer.from(base64 + padding, 'base64').toString('utf8');
      return JSON.parse(json) as AppleTokenPayload;
    } catch {
      throw new UnauthorizedException('Apple token payload invalid');
    }
  }
}
