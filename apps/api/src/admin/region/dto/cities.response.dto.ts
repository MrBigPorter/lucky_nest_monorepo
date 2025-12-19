import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class CitiesResponseDto {
  @ApiProperty({ description: 'city ID' })
  @Expose()
  cityId!: number;

  @ApiProperty({ description: 'city Name' })
  @Expose()
  cityName!: string;

  @ApiProperty({ description: 'Postal Code' })
  @Expose()
  postalCode!: string;
}
