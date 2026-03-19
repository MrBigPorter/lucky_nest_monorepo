import { GoogleProvider } from './google.provider';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('GoogleProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies google token and maps profile', async () => {
    const configService = new ConfigService({
      GOOGLE_CLIENT_ID: 'google-client-id',
    });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          aud: 'google-client-id',
          sub: 'google_sub_1',
          email: 'demo@example.com',
          name: 'Demo User',
          picture: 'https://img.example.com/avatar.png',
          email_verified: true,
        }),
    } as Response);

    const provider = new GoogleProvider(configService);
    const profile = await provider.verify('id-token');

    expect(profile).toEqual({
      providerUserId: 'google_sub_1',
      email: 'demo@example.com',
      nickname: 'Demo User',
      avatar: 'https://img.example.com/avatar.png',
    });
  });

  it('throws for invalid audience', async () => {
    const configService = new ConfigService({
      GOOGLE_CLIENT_ID: 'google-client-id',
    });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          aud: 'other-client',
          sub: 'google_sub_1',
          email_verified: true,
        }),
    } as Response);

    const provider = new GoogleProvider(configService);

    await expect(provider.verify('id-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
