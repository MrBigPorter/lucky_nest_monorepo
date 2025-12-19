import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { KycService } from '@api/client/kyc/kyc.service';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { plainToInstance } from 'class-transformer';
import { KycRecordResponseDto } from '@api/admin/kyc/dto/kyc-record.response.dto';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { SubmitKycDto } from '@api/client/kyc/dto/submit-kyc.dto';
import { KycIdTypesResponseDto } from '@api/client/kyc/dto/kyc-id-types.response.dto';

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Get my KYC record
   * @param userId
   */
  @Get('me')
  @ApiOkResponse({ type: KycRecordResponseDto })
  async me(@CurrentUserId() userId: string) {
    const record = await this.kycService.getMyKyc(userId);
    return plainToInstance(KycRecordResponseDto, record);
  }

  /**
   * Get active ID types
   */
  @Get('id-types')
  @ApiProperty({ type: KycIdTypesResponseDto })
  async getIdTypes() {
    const idTypes = await this.kycService.getIdTypes();
    return plainToInstance(KycIdTypesResponseDto, idTypes);
  }

  /**
   * Submit KYC information
   * @param userId
   * @param dto
   */
  @Post('submit')
  @ApiOkResponse({ type: KycRecordResponseDto })
  async submitKyc(@CurrentUserId() userId: string, @Body() dto: SubmitKycDto) {
    const record = await this.kycService.submitKyc(userId, dto);
    return plainToInstance(KycRecordResponseDto, record);
  }
}
