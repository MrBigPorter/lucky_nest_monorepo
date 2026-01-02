import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from '@api/client/address/address.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import {
  AddressListResponseDto,
  AddressResponseDto,
  CreateAddressDto,
  DeleteAddressDto,
  QueryAddressListDto,
  UpdateAddressDto,
} from '@api/client/address/dto/address.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('Client Address')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client/address')
export class AddressController {
  constructor(private readonly AddressService: AddressService) {}

  /**
   * Create a new address for the user.
   * @param dto
   * @param userId
   */
  @Post('create')
  @ApiOkResponse({ type: AddressResponseDto })
  async create(@Body() dto: CreateAddressDto, @CurrentUserId() userId: string) {
    const data = await this.AddressService.create(userId, dto);
    return plainToInstance(AddressResponseDto, data);
  }

  /**
   * Get a paginated list of addresses for the user.
   * @param query
   * @param userId
   */
  @Get('list')
  @ApiOkResponse({ type: AddressListResponseDto })
  async list(
    @Query() query: QueryAddressListDto,
    @CurrentUserId() userId: string,
  ) {
    const data = await this.AddressService.list(userId, query);
    return {
      ...data,
      list: plainToInstance(AddressResponseDto, data.list),
    };
  }

  /**
   * Delete an address by ID for the user.
   * @param userId
   * @param addressId
   */
  @Delete('delete/:addressId')
  async delete(
    @CurrentUserId() userId: string,
    @Param('addressId') addressId: string,
  ) {
    return await this.AddressService.delete(userId, addressId);
  }

  /**
   * Update an existing address for the user.
   * @param userId
   * @param addressId
   * @param dto
   */
  @Post('update/:addressId')
  @ApiOkResponse({ type: AddressResponseDto })
  async update(
    @CurrentUserId() userId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const data = await this.AddressService.update(userId, addressId, dto);
    return plainToInstance(AddressResponseDto, data);
  }

  /**
   * Get address details by ID for the user.
   * @param addressId
   * @param userId
   */
  @Get('address/:addressId')
  @ApiOkResponse({ type: AddressResponseDto })
  async getAddressById(
    @Param('addressId') addressId: string,
    @CurrentUserId() userId: string,
  ) {
    const data = await this.AddressService.detail(userId, addressId);
    return plainToInstance(AddressResponseDto, data);
  }
}
