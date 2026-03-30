import {
  Controller,
  Get,
  Post, // 修复: 引入 Post
  Body, // 修复: 引入 Body
  Query,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@ApiTags('oauth-deeplink')
@Controller('auth')
export class OAuthDeepLinkController {
  private readonly logger = new Logger(OAuthDeepLinkController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ==========================================
  // 第一步：发起授权（直接302）
  // ==========================================

  @Get('google/login')
  @ApiOperation({ summary: 'Google OAuth登录 - 发起授权' })
  googleLogin(@Query('callback') callback: string, @Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>(
      'GOOGLE_REDIRECT_URI',
      'https://api.luna.com/auth/google/callback',
    );

    const state = this.encodeState({ provider: 'google', callback });
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId || '');
    authUrl.searchParams.set('redirect_uri', redirectUri || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);

    this.logger.log(`Redirecting to Google OAuth: ${authUrl.toString()}`);
    return res.redirect(HttpStatus.FOUND, authUrl.toString());
  }

  @Get('facebook/login')
  @ApiOperation({ summary: 'Facebook OAuth登录 - 发起授权' })
  facebookLogin(@Query('callback') callback: string, @Res() res: Response) {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const redirectUri = this.configService.get<string>(
      'FACEBOOK_REDIRECT_URI',
      'https://api.luna.com/auth/facebook/callback',
    );

    const state = this.encodeState({ provider: 'facebook', callback });
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId || '');
    authUrl.searchParams.set('redirect_uri', redirectUri || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'email public_profile');
    authUrl.searchParams.set('state', state);

    this.logger.log(`Redirecting to Facebook OAuth: ${authUrl.toString()}`);
    return res.redirect(HttpStatus.FOUND, authUrl.toString());
  }

  @Get('apple/login')
  @ApiOperation({ summary: 'Apple OAuth登录 - 发起授权' })
  appleLogin(@Query('callback') callback: string, @Res() res: Response) {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>(
      'APPLE_REDIRECT_URI',
      'https://api.luna.com/auth/apple/callback',
    );

    const state = this.encodeState({ provider: 'apple', callback });
    const authUrl = new URL('https://appleid.apple.com/auth/authorize');
    authUrl.searchParams.set('client_id', clientId || '');
    authUrl.searchParams.set('redirect_uri', redirectUri || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'name email');
    authUrl.searchParams.set('response_mode', 'form_post'); // 强制Apple返回POST
    authUrl.searchParams.set('state', state);

    this.logger.log(`Redirecting to Apple OAuth: ${authUrl.toString()}`);
    return res.redirect(HttpStatus.FOUND, authUrl.toString());
  }

  // ==========================================
  // 第二步：接收回调 & 唤醒App
  // ==========================================

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth回调' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Received Google OAuth callback');
      const stateData = this.decodeState(state);
      const callback = stateData?.callback;

      const tokens = await this.exchangeGoogleCode(code);
      const userInfo = await this.getGoogleUserInfo(tokens.access_token);

      const loginResult = await this.authService.loginWithOauth('google', {
        providerUserId: userInfo.id,
        email: userInfo.email,
        nickname: userInfo.name,
        avatar: userInfo.picture,
      });

      return this.handleRedirect(res, callback, {
        accessToken: loginResult.tokens.accessToken,
        refreshToken: loginResult.tokens.refreshToken,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Google callback error: ${message}`);
      return this.handleError(res, message);
    }
  }

  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth回调' })
  async facebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Received Facebook OAuth callback');
      const stateData = this.decodeState(state);
      const callback = stateData?.callback;

      const tokens = await this.exchangeFacebookCode(code);
      const userInfo = await this.getFacebookUserInfo(tokens.access_token);

      const loginResult = await this.authService.loginWithOauth('facebook', {
        providerUserId: userInfo.id,
        email: userInfo.email,
        nickname: userInfo.name,
        avatar: userInfo.picture?.data?.url,
      });

      return this.handleRedirect(res, callback, {
        accessToken: loginResult.tokens.accessToken,
        refreshToken: loginResult.tokens.refreshToken,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Facebook callback error: ${message}`);
      return this.handleError(res, message);
    }
  }

  // 修复: Apple 使用的是 form_post，必须是 @Post 和 @Body
  @Post('apple/callback')
  @ApiOperation({ summary: 'Apple OAuth回调' })
  async appleCallback(
    @Body('code') code: string,
    @Body('state') state: string,
    @Body('user') userStr: string, // 修复: 截获首登时传来的用户名字
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Received Apple OAuth callback (POST)');
      const stateData = this.decodeState(state);
      const callback = stateData?.callback;

      const tokens = await this.exchangeAppleCode(code);
      const userInfo = this.parseAppleIdToken(tokens.id_token);

      // 修复: 只有第一次登录才会下发 user 字符串，解析出名字
      let nickname = null;
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          nickname =
            `${parsedUser.name?.firstName || ''} ${parsedUser.name?.lastName || ''}`.trim() ||
            null;
        } catch (e) {
          this.logger.warn('Failed to parse Apple user string');
        }
      }

      const loginResult = await this.authService.loginWithOauth('apple', {
        providerUserId: userInfo.sub,
        email: userInfo.email,
        nickname: nickname,
        avatar: null, // Apple 不给头像
      });

      return this.handleRedirect(res, callback, {
        accessToken: loginResult.tokens.accessToken,
        refreshToken: loginResult.tokens.refreshToken,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Apple callback error: ${message}`);
      return this.handleError(res, message);
    }
  }

  // ==========================================
  // 核心：处理重定向（唤醒App或返回Web）
  // ==========================================

  private handleRedirect(
    res: Response,
    callback: string | undefined,
    loginResult: { accessToken: string; refreshToken: string },
  ) {
    if (callback) {
      try {
        // 修复: 加上 try...catch 防御，避免错误的 callback 导致整个服务 500
        const deepLink = new URL(callback);
        deepLink.searchParams.set('token', loginResult.accessToken);
        deepLink.searchParams.set('refreshToken', loginResult.refreshToken);

        this.logger.log(`Redirecting to App Deep Link: ${deepLink.toString()}`);
        return res.redirect(HttpStatus.FOUND, deepLink.toString());
      } catch (e) {
        this.logger.warn(
          `Invalid callback URL format: ${callback}. Falling back to web dashboard.`,
        );
        // URL 格式错误，降级跳回 Web 首页
      }
    }

    // Web fallback
    res.cookie('auth_token', loginResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.logger.log('Redirecting to Web dashboard');
    return res.redirect(HttpStatus.FOUND, '/dashboard');
  }

  private handleError(res: Response, message: string) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: message,
    });
  }

  // ==========================================
  // OAuth交换逻辑 (Google & Facebook 原样保留)
  // ==========================================

  private async exchangeGoogleCode(
    code: string,
  ): Promise<{ access_token: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri || '',
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) throw new Error('Failed to exchange Google code');
    return response.json() as Promise<{ access_token: string }>;
  }

  private async getGoogleUserInfo(
    accessToken: string,
  ): Promise<{ id: string; email: string; name: string; picture: string }> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok) throw new Error('Failed to get Google user info');
    return response.json() as any;
  }

  private async exchangeFacebookCode(
    code: string,
  ): Promise<{ access_token: string }> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');

    const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    url.searchParams.set('code', code);
    url.searchParams.set('client_id', appId || '');
    url.searchParams.set('client_secret', appSecret || '');
    url.searchParams.set('redirect_uri', redirectUri || '');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to exchange Facebook code');
    return response.json() as any;
  }

  private async getFacebookUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: { data?: { url?: string } };
  }> {
    const response = await fetch(
      'https://graph.facebook.com/me?fields=id,name,email,picture',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok) throw new Error('Failed to get Facebook user info');
    return response.json() as any;
  }

  private async exchangeAppleCode(code: string): Promise<{ id_token: string }> {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('APPLE_REDIRECT_URI');

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: this.generateAppleClientSecret(), // 注意：这里还是写死的！
        redirect_uri: redirectUri || '',
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) throw new Error('Failed to exchange Apple code');
    return response.json() as any;
  }

  private parseAppleIdToken(idToken: string): { sub: string; email?: string } {
    const payload = idToken.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  }

  // ⚠️ 终极暗坑提醒：
  private generateAppleClientSecret(): string {
    // TODO: Apple 的 Client Secret 不是一个静态字符串！
    // 它是你需要用你的 .p8 秘钥、Team ID 和 Key ID，通过 ES256 算法实时签发的一个 JWT Token。
    // 如果你不重写这里，Apple 登录会一直报错 400 invalid_client。
    return 'apple_client_secret_jwt';
  }

  // ==========================================
  // State编码/解码
  // ==========================================

  private encodeState(data: { provider: string; callback?: string }): string {
    return Buffer.from(JSON.stringify(data)).toString('base64url');
  }

  private decodeState(state: string): { provider: string; callback?: string } {
    try {
      return JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
    } catch {
      return { provider: 'unknown' };
    }
  }
}
