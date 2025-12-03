import {Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards} from "@nestjs/common";
import {WalletService} from "@api/wallet/wallet.service";
import {ApiBearerAuth, ApiOkResponse, ApiProperty} from "@nestjs/swagger";
import {JwtAuthGuard} from "@api/auth/jwt.guard";
import {CurrentUserId} from "@api/auth/user.decorator";
import {CreditDto} from "@api/wallet/dto/credit.dto";

import {WalletBalanceResponseDto} from "@api/wallet/dto/wallet-balance.response.dto";
import {WalletCreditResponseDto} from "@api/wallet/dto/wallet-credit.response.dto";
import {WalletDebitResponseDto} from "@api/wallet/dto/wallet-debit.response.dto";

@Controller('wallet')
export class WalletController {
    constructor(private wallet: WalletService) {
    }

    // Get wallet balance
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('balance')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({type: WalletBalanceResponseDto})
    async balance(@CurrentUserId() userId: string) {
        const res = await this.wallet.balance(userId);
        return {
            id: res.id,
            userId: res.userId,
            realBalance: res.realBalance.toString(),
            totalRecharge: res.totalRecharge.toString(),
            coinBalance: res.coinBalance.toString(),
            frozenBalance: res.frozenBalance.toString(),
            totalWithdraw: res.totalWithdraw.toString(),
        }
    }

    // Credit cash to wallet
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('credit')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({type: WalletCreditResponseDto})
    async credit(@CurrentUserId() userId: string, @Body() dto: CreditDto): Promise<WalletCreditResponseDto> {
        const res = await this.wallet.creditCash({
            userId,
            amount: dto.amount,
            related: {
                id: dto.relatedId || '',
                type: 'recharge'
            },
            desc: dto.desc
        })

        return {
            realBalance: res.realBalance.toString(),
        }
    }


    // Debit cash from wallet
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('debit')
    @HttpCode(HttpStatus.OK)
    @ApiProperty({ type: WalletDebitResponseDto })
    async debit(@CurrentUserId() userId: string, @Body() dto: CreditDto): Promise<WalletDebitResponseDto> {
        const res = await this.wallet.debitCash({
            userId,
            amount: dto.amount,
            related: {
                id: dto.relatedId || '',
                type: 'debit'
            },
            desc: dto.desc
        })
        return {
            realBalance: res.realBalance.toString(),
        }
    }
}