import { FacebookProvider } from './facebook.provider';
import { UnauthorizedException } from '@nestjs/common';

describe('FacebookProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('verifies facebook access token and maps profile', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'fb_user_1',
          email: 'demo@example.com',
          name: 'FB User',
          picture: { data: { url: 'https://img.example.com/fb-avatar.png' } },
        }),
    } as Response);

    const provider = new FacebookProvider();
    const profile = await provider.verify({
      accessToken: 'access-token',
      userId: 'fb_user_1',
    });

    expect(profile).toEqual({
      providerUserId: 'fb_user_1',
      email: 'demo@example.com',
      nickname: 'FB User',
      avatar: 'https://img.example.com/fb-avatar.png',
    });
  });

  it('throws when user id mismatches', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'fb_user_2',
        }),
    } as Response);

    const provider = new FacebookProvider();

    await expect(
      provider.verify({
        accessToken: 'access-token',
        userId: 'fb_user_1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
