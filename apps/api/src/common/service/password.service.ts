import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 10;

  /**
   * 加密密码 -- hash password
   * @param rawPassword
   * @returns {Promise<string>} 加密后的密码 -- hashed password
   */
  async hash(rawPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(rawPassword, salt);
  }

  /**
   * 比较密码 -- compare password
   * @param rawPassword 原密码 -- raw password
   * @param hashedPassword 数据库中存的哈希密码
   * @returns {Promise<boolean>} 比较结果 -- compare result
   */
  async compare(rawPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, hashedPassword);
  }
}
