import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  role?: string;
  type?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: process.env.JWT_SECRET!, //验签用的密钥
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //从哪里找 token
      ignoreExpiration: false, //强制检查 exp，过期自动判 401
    });
  }
  validate(payload: JwtPayload) {
    // 只把 userId 传给 request.user
    return {
      id: payload.sub,
      userId: payload.sub,
      role: payload.role ?? '',
      type: payload.type ?? '',
    };
  }
}
