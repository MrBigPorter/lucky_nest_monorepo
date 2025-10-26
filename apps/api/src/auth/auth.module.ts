import {Module} from "@nestjs/common";
import {PrismaModule} from "../prisma/prisma.module";
import {JwtModule} from "@nestjs/jwt";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {JwtAuthGuard} from "./jwt.guard";
import {JwtStrategy} from "./jwt.strategy";


@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'please_change_me_very_secret',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN as any || '15m' },
        })
    ],
    controllers: [AuthController],
    providers: [AuthService,JwtAuthGuard,JwtStrategy],
    exports: []
})
export class AuthModule {}