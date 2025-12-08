import { PartialType } from '@nestjs/swagger';
import { CreateActSectionDto } from '@api/admin/act-section/dto/create-act-section.dto';

export class UpdateActSectionDto extends PartialType(CreateActSectionDto) {}
