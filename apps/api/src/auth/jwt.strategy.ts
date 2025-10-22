import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            secretOrKey: process.env.JWT_SECRET!,  //验签用的密钥
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  //从哪里找 token
            ignoreExpiration: false //强制检查 exp，过期自动判 401
        });
    }
    async validate(payload: any) {
        // 只把 userId 传给 request.user
        return { userId: payload.sub };
    }
}