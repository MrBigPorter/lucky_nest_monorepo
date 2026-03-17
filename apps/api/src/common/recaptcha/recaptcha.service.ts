import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5;

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secretKey: string | null;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('RECAPTCHA_SECRET_KEY') ?? null;
    if (!this.secretKey || this.secretKey === 'disabled') {
      this.logger.warn(
        'RECAPTCHA_SECRET_KEY not set — reCAPTCHA verification is DISABLED',
      );
    }
  }

  /**
   * Verify reCAPTCHA v3 token.
   * Throws BadRequestException if verification fails or score is too low.
   * @param token - token from frontend
   * @param expectedAction - action name (e.g. 'admin_apply')
   */
  async verify(token: string, expectedAction: string): Promise<void> {
    // If no key configured (dev/test), skip verification
    if (!this.secretKey || this.secretKey === 'disabled') {
      this.logger.debug('reCAPTCHA skipped (no secret key)');
      return;
    }

    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    try {
      const params = new URLSearchParams({
        secret: this.secretKey,
        response: token,
      });

      const { data } = await axios.post<{
        success: boolean;
        score: number;
        action: string;
        'error-codes'?: string[];
      }>(RECAPTCHA_VERIFY_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
      });

      this.logger.debug(
        `reCAPTCHA result: success=${data.success} score=${data.score} action=${data.action}`,
      );

      if (!data.success) {
        const codes = (data['error-codes'] ?? []).join(', ');
        throw new BadRequestException(
          `reCAPTCHA verification failed: ${codes}`,
        );
      }

      if (data.action !== expectedAction) {
        throw new BadRequestException(
          `reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`,
        );
      }

      if (data.score < MIN_SCORE) {
        throw new BadRequestException(
          `reCAPTCHA score too low (${data.score}). Possible bot activity detected.`,
        );
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      // Network/timeout errors — fail open in dev, fail closed in prod
      this.logger.error(`reCAPTCHA service error: ${err}`);
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          'reCAPTCHA service unavailable. Please try again.',
        );
      }
    }
  }
}
