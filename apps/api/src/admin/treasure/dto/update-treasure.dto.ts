import { PartialType } from '@nestjs/swagger';
import { CreateTreasureDto } from './create-treasure.dto';

export class UpdateTreasureDto extends PartialType(CreateTreasureDto) {}
