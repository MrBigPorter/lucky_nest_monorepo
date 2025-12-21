import { SetMetadata } from '@nestjs/common';

export enum DeviceSecurityLevel {
  LOG_ONLY = 'LOG_ONLY', // 仅记录 (KYC/Login)
  STRICT_CHECK = 'STRICT_CHECK', // 严格检查 (提现/转账 - 需 24h 冷却)
}

export const DEVICE_SECURITY_KEY = 'device_security';
export const DeviceSecurity = (level: DeviceSecurityLevel) =>
  SetMetadata(DEVICE_SECURITY_KEY, level);
