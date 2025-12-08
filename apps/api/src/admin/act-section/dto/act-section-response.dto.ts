import { Exclude, Expose, Transform } from 'class-transformer';
import { TreasureResponseDto } from '@api/admin/treasure/dto/treasure-response.dto';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ActSectionResponseDto {
  @ApiProperty({ description: 'id', example: '1' })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'key',
    example: 'home_new_arrival',
  })
  @Expose()
  key!: string;

  @ApiProperty({ description: 'title', example: 'New Arrival' })
  @Expose()
  title!: string;

  @ApiProperty({ description: 'images show type', example: '1' })
  @Expose()
  imgStyleType!: number;

  @ApiProperty({ description: 'status', example: '1' })
  @Expose()
  status!: number;

  @ApiProperty({ description: 'sort order', example: '0' })
  @Expose()
  sortOrder!: number;

  @ApiProperty({ description: 'start time' })
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.getTime() : 0))
  startAt!: number;

  @ApiProperty({ description: 'end time' })
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.getTime() : 0))
  endAt!: number;

  @ApiProperty({ description: 'treasure items' })
  @Expose()
  items!: TreasureResponseDto[];
}
