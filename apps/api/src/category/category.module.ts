import {Module} from "@nestjs/common";
import {PrismaModule} from "@api/prisma/prisma.module";
import {CategoryService} from "@api/category/ category.service";
import {CategoryController} from "@api/category/category.controller";

@Module({
    imports: [PrismaModule],
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: []
})
export class CategoryModule {}