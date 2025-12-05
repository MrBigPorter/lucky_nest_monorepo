import {BadRequestException, Injectable} from "@nestjs/common";
import {PrismaService} from "@api/common/prisma/prisma.service";
import {CreateCategoryDto} from "@api/admin/category/dto/create-category.dto";
import {TREASURE_STATE} from "@lucky/shared";
import {UpdateCategoryDto} from "@api/admin/category/dto/update-category.dto";

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) {
    }

    // 创建货架 - create shelf
    async create(dto: CreateCategoryDto){
        return this.prisma.productCategory.create({
            data: {
                name: dto.name,
                nameEn: dto.nameEn,
                icon: dto.icon,
                sortOrder: dto.sortOrder ?? 0,
                state: dto.state ?? TREASURE_STATE.ACTIVE
            }
        })
    }

    // 查看所有货架 - find shelf
    async findAll(){
        return this.prisma.productCategory.findMany({
            orderBy: { sortOrder: 'asc'}
        })
    }

    // 装修修改货架
    async update(id: number, dto: UpdateCategoryDto) {
       return this.prisma.productCategory.update({
           where: {id},
           data: dto
       })
    }

    //删除货架
    async remove(id: number) {
        const count = await this.prisma.treasureCategory.count({where: {categoryId: id}});
        if (count > 0) throw new BadRequestException('This category still contains products and cannot be deleted.')

        return this.prisma.productCategory.delete({
            where: {id}
        })
    }

    //快速封条 (禁用/启用)
    async updateState(id: number, state: number){
        return this.prisma.productCategory.update({
            where: {id},
            data: {state}
        })
    }
}