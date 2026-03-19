import { AppleProvider } from './apple.provider';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function createToken(payload: Record<string, any>) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

describe('AppleProvider', () => {
  it('parses and validates apple id token payload', async () => {
    const configService = new ConfigService({
      APPLE_CLIENT_ID: 'com.joyminis.app',
    });
    const now = Math.floor(Date.now() / 1000);
    const token = createToken({
      sub: 'apple_sub_1',
      email: 'apple@example.com',
      aud: 'com.joyminis.app',
      exp: now + 600,
    });

    const provider = new AppleProvider(configService);
    const profile = await provider.verify(token);

    expect(profile).toEqual({
      providerUserId: 'apple_sub_1',
      email: 'apple@example.com',
      nickname: null,
      avatar: null,
    });
  });

  it('throws on expired token', async () => {
    const configService = new ConfigService();
    const now = Math.floor(Date.now() / 1000);
    const token = createToken({
      sub: 'apple_sub_1',
      exp: now - 10,
    });

    const provider = new AppleProvider(configService);

    await expect(provider.verify(token)).rejects.toThrow(UnauthorizedException);
  });
});
