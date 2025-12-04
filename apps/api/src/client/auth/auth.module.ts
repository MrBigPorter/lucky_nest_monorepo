import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import {JwtAuthGuard} from "@api/common/jwt/jwt.guard";
import {JwtStrategy} from "@api/common/jwt/jwt.strategy";
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'please_change_me_very_secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  exports: [],
})
export class AuthModule {}
