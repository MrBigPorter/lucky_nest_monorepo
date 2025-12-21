import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  getDeviceId,
  getDeviceModel,
  getRealIp,
  getUserAgent,
} from '@api/common/utils/request.util';

// 定义设备信息接口 (DTO)
export interface DeviceInfo {
  deviceId: string;
  deviceModel: string;
  ip: string;
  userAgent: string;
}

// get real ip from request
export const RealIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return getRealIp(req);
  },
);

// get user agent from request
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return getUserAgent(req);
  },
);

// get device id from request
export const CurrentDevice = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DeviceInfo => {
    const req = ctx.switchToHttp().getRequest();
    return {
      ip: getRealIp(req),
      userAgent: getUserAgent(req),
      deviceId: getDeviceId(req),
      deviceModel: getDeviceModel(req),
    };
  },
);
