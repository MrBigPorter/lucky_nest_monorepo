// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

type TimeStr = `${number}${'ms'|'s'|'m'|'h'|'d'|'w'|'y'}`; // 替代 ms.StringValue

@Module({
    imports: [
        UsersModule,
        ConfigModule, // 为了能在 registerAsync 注入 ConfigService
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => {
                const raw = cfg.get<string | number>('JWT_EXPIRES_IN', '15m');
                const expiresIn: number | TimeStr =
                    typeof raw === 'number' ? raw : (raw as TimeStr);
                return {
                    secret: cfg.get<string>('JWT_SECRET', 'dev_secret'),
                    signOptions: { expiresIn },
                };
            },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}