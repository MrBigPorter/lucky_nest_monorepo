import {Body, Controller, Get, Post, UseGuards} from "@nestjs/common";
import {WalletService} from "@api/wallet/wallet.service";
import {ApiBearerAuth, ApiProperty} from "@nestjs/swagger";
import {JwtAuthGuard} from "@api/auth/jwt.guard";
import {CurrentUserId} from "@api/auth/user.decorator";
import {CreditDto} from "@api/wallet/dto/credit.dto";

@Controller('wallet')
export class WalletController {
    constructor(private wallet: WalletService) {
    }

    // Get wallet balance
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('balance')
    async balance(@CurrentUserId() userId: string) {
        return this.wallet.balance(userId);
    }

    // Credit cash to wallet
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('credit')
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