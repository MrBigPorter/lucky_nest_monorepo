import {PartialType} from "@nestjs/swagger";
import {CreateCategoryDto} from "@api/admin/category/dto/create-category.dto";

export class UpdateCategoryDto extends PartialType(CreateCategoryDto){}