import {Controller, Get, Param, Query, UsePipes, ValidationPipe} from "@nestjs/common";
import {TreasureService} from "@api/treasure/treasure.service";
import {TreasureQueryDto} from "@api/treasure/dto/treasure-query.dto";
import {throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";

@Controller('api/treasure')
export class TreasureController {
    constructor(private readonly svc: TreasureService ) {}

    @Get()
    @UsePipes(new ValidationPipe({ transform: true,whitelist: true}))
    list(@Query() dto: TreasureQueryDto){
        return this.svc.list(dto);
    }

    @Get(':id')
    async detail(@Param('id') id: string){
        const item = await this.svc.detail(id);
        if (!item) throwBiz(ERROR_KEYS.NOT_FOUND);
        return item
    }
}
