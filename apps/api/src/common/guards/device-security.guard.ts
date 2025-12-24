import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DeviceSecurityService } from '@api/common/device/device-security.service';
import {
  DEVICE_SECURITY_KEY,
  DeviceSecurityLevel,
} from '@api/common/decorators/device-security.decorator';
import {
  getDeviceId,
  getDeviceModel,
  getRealIp,
  getUserAgent,
} from '@api/common/utils/request.util';

@Injectable()
export class DeviceSecurityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly deviceSecurityService: DeviceSecurityService,
  ) {}

  /**
   * 执行守卫逻辑
   * @param context
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 读装饰器配置
    const level = this.reflector.getAllAndOverride<DeviceSecurityLevel>(
      DEVICE_SECURITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!level) {
      return true; // 没加装饰器，放行
    }

    // 2. 拿 User (必须在 JwtAuthGuard 后)
    const request = context.switchToHttp().getRequest();
    console.log('DeviceSecurityGuard request.url:', request);
    const user = request.user;
    console.log('DeviceSecurityGuard user:', user);
    if (!user || !user.id) {
      throw new UnauthorizedException();
    }

    // 3. 提取指纹
    const deviceInfo = {
      ip: getRealIp(request),
      deviceId: getDeviceId(request),
      deviceModel: getDeviceModel(request),
      userAgent: getUserAgent(request),
    };

    // 4. 执行风控
    await this.deviceSecurityService.validateAndLogDevice(user.id, deviceInfo);

    // 5. 严格模式额外检查
    if (level === DeviceSecurityLevel.STRICT_CHECK) {
      await this.deviceSecurityService.checkWithdrawEligibility(
        user.id,
        deviceInfo.deviceId,
      );
    }
    return true;
  }
}
