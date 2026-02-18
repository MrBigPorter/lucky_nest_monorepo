import { ApiProperty } from '@nestjs/swagger';
export class IceServerDto {
  @ApiProperty({ example: 'turn:107.173.86.160:3478' })
  urls!: string | string[];

  @ApiProperty({ example: '1738888888:user1', required: false })
  username?: string;

  @ApiProperty({ example: 'aB3d...', required: false })
  credential?: string;
}
