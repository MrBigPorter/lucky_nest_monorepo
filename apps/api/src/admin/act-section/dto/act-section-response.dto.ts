import {
  Exclude,
  Expose,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
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
  @Transform(({ value }) => {
    if (!value) return 0;
    const d = new Date(value);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  })
  startAt!: number;

  @ApiProperty({ description: 'end time' })
  @Expose()
  @Transform(({ value }) => {
    if (!value) return 0;
    const d = new Date(value);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  })
  endAt!: number;

  @ApiProperty({ type: [TreasureResponseDto] })
  @Expose()
  items!: TreasureResponseDto[];
}
