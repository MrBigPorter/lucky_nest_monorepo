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

    // 从环境配置获取允许的Client ID列表
    // 注意：环境变量中的JSON数组需要特殊处理
    const allowedClientIdsRaw = this.configService.get<string>(
      'GOOGLE_ALLOWED_CLIENT_IDS',
    );
    const singleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    // 构建最终的允许列表
    const finalAllowedIds: string[] = [];

    // 解析 GOOGLE_ALLOWED_CLIENT_IDS（支持JSON数组格式）
    if (allowedClientIdsRaw) {
      try {
        // 尝试解析JSON数组
        const parsedIds = JSON.parse(allowedClientIdsRaw);
        if (Array.isArray(parsedIds)) {
          finalAllowedIds.push(
            ...parsedIds.filter((id): id is string => typeof id === 'string'),
          );
        }
      } catch (error) {
        // 如果不是JSON，尝试按逗号分割
        const ids = allowedClientIdsRaw
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0);
        finalAllowedIds.push(...ids);
      }
    }

    // 向后兼容：添加 GOOGLE_CLIENT_ID（如果存在且不在列表中）
    if (singleClientId && !finalAllowedIds.includes(singleClientId)) {
      finalAllowedIds.push(singleClientId);
    }

    // 添加调试日志
    console.log('Google OAuth Debug:', {
      allowedClientIdsRaw,
      singleClientId,
      finalAllowedIds,
      tokenAud: data.aud,
    });

    // 如果没有配置任何Client ID，跳过验证（为了向后兼容，但生产环境应该配置）
    if (finalAllowedIds.length === 0) {
      console.warn(
        'No Google Client IDs configured. Audience validation skipped.',
      );
    } else if (!finalAllowedIds.includes(data.aud || '')) {
      console.error('Google token audience mismatch:', {
        allowedIds: finalAllowedIds,
        tokenAud: data.aud,
      });
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
