import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { PermissionsGuard } from '@api/common/guards/permissions.guard';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';
import { OpAction, OpModule } from '@lucky/shared';
import { QueryKycDto } from '@api/admin/kyc/dto/query-kyc.dto';
import { KycService } from '@api/admin/kyc/kyc.service';
import { plainToInstance } from 'class-transformer';
import { KycRecordResponseDto } from '@api/admin/kyc/dto/kyc-record.response.dto';
import { KycRecordListResponseDto } from '@api/admin/kyc/dto/kyc-record-list.response.dto';
import { AuditKycDto } from '@api/admin/kyc/dto/audit-kyc.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { RealIp } from '@api/common/decorators/http.decorators';

@ApiTags('Admin KYC Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  /**
   * Get KYC record list with pagination and filters
   * @param dto
   */
  @Get('records')
  @RequirePermission(OpModule.USER, OpAction.USER.VIEW)
  @ApiOkResponse({ type: KycRecordListResponseDto })
  async list(@Query() dto: QueryKycDto) {
    const result = await this.kycService.getKycRecordList(dto);
    return {
      ...result,
      list: plainToInstance(KycRecordResponseDto, result.list, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get KYC record detail by ID
   * @param id
   */
  @Get('records/:id')
  @RequirePermission(OpModule.USER, OpAction.USER.VIEW)
  @ApiOkResponse({ type: KycRecordResponseDto })
  async getKycRecord(@Param('id') id: string) {
    const record = await this.kycService.detail(id);
    return plainToInstance(KycRecordResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Audit KYC record
   * @param id
   * @param dto
   * @param userId
   * @param ip
   */
  @Post(':id/audit')
  @RequirePermission(OpModule.USER, OpAction.USER.KYC_AUDIT)
  @ApiOkResponse({ type: KycRecordResponseDto })
  async auditKyc(
    @Param('id') id: string,
    @Body() dto: AuditKycDto,
    @CurrentUserId() userId: string,
    @RealIp() ip: string,
  ) {
    const record = await this.kycService.adminAudit(id, dto, userId, ip);
    return plainToInstance(KycRecordResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }
}
