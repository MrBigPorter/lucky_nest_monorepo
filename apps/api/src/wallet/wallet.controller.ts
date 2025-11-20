import {Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards} from "@nestjs/common";
import {WalletService} from "@api/wallet/wallet.service";
import {ApiBearerAuth, ApiProperty} from "@nestjs/swagger";
import {JwtAuthGuard} from "@api/auth/jwt.guard";
import {CurrentUserId} from "@api/auth/user.decorator";
import {CreditDto} from "@api/wallet/dto/credit.dto";
import {Html} from "@lucky/admin/.nuxt/components";

@Controller('wallet')
export class WalletController {
    constructor(private wallet: WalletService) {
    }

    // Get wallet balance
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('balance')
    @HttpCode(HttpStatus.OK)
    async balance(@CurrentUserId() userId: string) {
        return this.wallet.balance(userId);
    }

    // Credit cash to wallet
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('credit')
    @HttpCode(HttpStatus.OK)
    async credit(@CurrentUserId() userId: string, @Body() dto: CreditDto) {
        return this.wallet.creditCash({
            userId,
            amount: dto.amount,
            related: {
                id: dto.relatedId || '',
                type: 'recharge'
            },
            desc: dto.desc
        })
    }


    // Debit cash from wallet
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('debit')
    @HttpCode(HttpStatus.OK)
    async debit(@CurrentUserId() userId: string, @Body() dto: CreditDto) {
        return this.wallet.debitCash({
            userId,
            amount: dto.amount,
            related: {
                id: dto.relatedId || '',
                type: 'debit'
            },
            desc: dto.desc
        })
    }
}