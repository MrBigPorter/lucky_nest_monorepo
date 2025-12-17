import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { PermissionsGuard } from '@api/common/guards/permissions.guard';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { FinanceService } from '@api/admin/finance/finance.service';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';
import { OpAction, OpModule } from '@lucky/shared';
import { QueryTransactionDto } from '@api/admin/finance/dto/query-transaction.dto';
import { ManualAdjustmentDto } from '@api/admin/finance/dto/manual-adjustment.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { AuditWithdrawDto } from '@api/admin/finance/dto/audit-withdraw.dto';
import { TransactionListResponseDto } from '@api/admin/finance/dto/transaction-list-response.dto';
import { plainToInstance } from 'class-transformer';
import { TransactionResponseDto } from '@api/admin/finance/dto/transaction-response.dto';
import { WithdrawListResponseDto } from '@api/admin/finance/dto/withdraw-list-response.dto';
import { ReaIp } from '@api/common/decorators/http.decorators';
import { WithdrawResponseDto } from '@api/admin/finance/dto/withdraw-response.dto';
import { QueryWithdrawalsDto } from '@api/admin/finance/dto/query-withdrawals.dto';

@ApiTags('Admin Finance Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('transactions')
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.VIEW)
  @ApiOkResponse({ type: TransactionListResponseDto })
  async getTransactions(@Query() dto: QueryTransactionDto) {
    const data = await this.financeService.getTransactions(dto);
    return {
      total: data.total,
      page: dto.page,
      pageSize: dto.pageSize,
      list: plainToInstance(TransactionResponseDto, data.list, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post('adjust')
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.MANUAL_ADJUST)
  @ApiOkResponse({ type: TransactionResponseDto })
  async manualAdjust(
    @Body() dto: ManualAdjustmentDto,
    @CurrentUserId() userId: string,
    @ReaIp() ip: string,
  ) {
    const data = await this.financeService.manualAdjust(dto, {
      adminId: userId,
      ip,
    });
    return plainToInstance(TransactionResponseDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get('withdrawals')
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.VIEW)
  @ApiOkResponse({ type: WithdrawListResponseDto })
  async getWithdrawals(@Query() dto: QueryWithdrawalsDto) {
    const data = await this.financeService.getWithdrawals(dto);
    const list = plainToInstance(WithdrawResponseDto, data.list, {
      excludeExtraneousValues: true,
    });
    return {
      total: data.total,
      page: dto.page,
      pageSize: dto.pageSize,
      list: list,
    };
  }

  @Post('withdrawals/audit')
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.WITHDRAW_AUDIT)
  @ApiOkResponse({ type: WithdrawResponseDto })
  async auditWithdrawal(
    @Body() dto: AuditWithdrawDto,
    @CurrentUserId() userId: string,
  ) {
    const data = await this.financeService.auditWithdraw(dto, userId);
    return plainToInstance(WithdrawResponseDto, data, {
      excludeExtraneousValues: true,
    });
  }
}
