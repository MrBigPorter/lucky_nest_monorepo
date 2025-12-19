import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RegionDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty() @Expose() name!: string;
  @ApiProperty({ required: false }) @Expose() code?: string;
  @ApiProperty({ required: false }) @Expose() postalCode?: string;
}
