import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WalletService } from '@api/client/wallet/wallet.service';

import { ClientWalletService } from '@api/client/wallet/client-wallet.service';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { ApplyWithdrawDto } from '@api/client/wallet/dto/apply-withdraw.dto';
import { plainToInstance } from 'class-transformer';
import { WithdrawApplyResponseDto } from '@api/client/wallet/dto/withdraw-apply-response.dto';
import { RechargeCreateResponseDto } from '@api/client/wallet/dto/recharge-create-response.dto';
import { CreateRechargeDto } from '@api/client/wallet/dto/create-recharge.dto';
import { WalletBalanceResponseDto } from '@api/client/wallet/dto/wallet-balance.response.dto';
import { TransactionQueryDto } from '@api/client/wallet/dto/transaction-query.dto';
import { TransactionListResponseDto } from '@api/client/wallet/dto/transaction-list-response.dto';
import { WithdrawalItemResponseDto } from '@api/client/wallet/dto/withdrawal-item-response.dto';
import { WithdrawalHistoryQueryDto } from '@api/client/wallet/dto/withdrawal-history-query.dto';
import { WithdrawalHistoryResponseDto } from '@api/client/wallet/dto/withdrawal-history-response.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(
    private wallet: WalletService,
    private clientWallet: ClientWalletService,
  ) {}

  /**
   * Get wallet balance
   * @param userId
   */
  @Post('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WalletBalanceResponseDto })
  async balance(@CurrentUserId() userId: string) {
    const data = await this.wallet.balance(userId);
    return plainToInstance(WalletBalanceResponseDto, data);
  }

  /**
   * Apply for a withdrawal
   * @param userId
   * @param dto
   */
  @Post('withdraw/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WithdrawApplyResponseDto })
  async applyWithdraw(
    @CurrentUserId() userId: string,
    @Body() dto: ApplyWithdrawDto,
  ) {
    const data = await this.clientWallet.applyWithdraw(userId, dto);
    return plainToInstance(WithdrawApplyResponseDto, data);
  }

  /**
   * Create a recharge order
   * @param userId
   * @param dto
   */
  @Post('recharge/create')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RechargeCreateResponseDto })
  async createRecharge(
    @CurrentUserId() userId: string,
    @Body() dto: CreateRechargeDto,
  ) {
    const data = await this.clientWallet.createRecharge(userId, dto);
    return plainToInstance(RechargeCreateResponseDto, data);
  }

  /**
   * Get transaction history
   * @param userId
   * @param dto
   */
  @Get('transactions')
  @ApiOkResponse({ type: TransactionListResponseDto })
  async getTransactions(
    @CurrentUserId() userId: string,
    @Query() dto: TransactionQueryDto,
  ) {
    const data = await this.clientWallet.getTransactionHistory(userId, dto);
    return {
      total: data.total,
      page: dto.page,
      pageSize: dto.pageSize,
      list: plainToInstance(TransactionListResponseDto, data.list, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get withdrawal history
   * @param userId
   * @param dto
   */
  @Get('withdraw/history')
  @ApiOkResponse({ type: WithdrawalHistoryResponseDto })
  async getWithdrawHistory(
    @CurrentUserId() userId: string,
    @Body() dto: WithdrawalHistoryQueryDto,
  ) {
    const data = await this.clientWallet.getWithdrawalHistory(userId, dto);
    return {
      total: data.total,
      page: dto.page,
      pageSize: dto.pageSize,
      list: plainToInstance(WithdrawalItemResponseDto, data.list, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
