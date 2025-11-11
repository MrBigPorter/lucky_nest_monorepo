import {Injectable} from "@nestjs/common";
import {PrismaService} from '../prisma/prisma.service';
import {TreasureQueryDto} from "@api/treasure/dto/treasure-query.dto";

@Injectable()
export class TreasureService {
    constructor(private readonly prisma: PrismaService) {

    }

    // 商品列表
    async list(query: TreasureQueryDto) {
        const {page, pageSize, q, categoryId, state} = query;
        const where: any = {}

        if (typeof  state === 'number')  where.state = state;
        if (q?.trim()){
            where.OR = [
                {treasureName: {contains: q, mode: 'insensitive'}},
                {productName: {contains: q, mode: 'insensitive'}},
            ]
        }

        // 按分类筛选
        if (categoryId){
            where.categories = {
                some: {
                   categoryId
                }
            }
        }


        const [total,items] = await this.prisma.$transaction([
            this.prisma.treasure.count({where}),
            this.prisma.treasure.findMany({
                where,
                orderBy: {createdAt:'desc'},
                skip:(page - 1) * pageSize,
                take: pageSize,
                select:{
                    treasureId: true,
                    treasureSeq: true,
                    treasureName: true,
                    productName: true,
                    treasureCoverImg: true,
                    unitAmount: true,
                    seqShelvesQuantity: true,
                    seqBuyQuantity: true,
                    buyQuantityRate: true,
                    lotteryMode: true,
                    lotteryTime: true,
                    state: true,
                    categories: {
                        select: {
                            category: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            })
        ])


        const  mapped = items.map(it=>({
            ...it,
            categories: it.categories.map(c=>c.category),
        }))

        return {
            page,
            pageSize,
            total,
            list: mapped
        }
    }

    // 详情
    async detail(id: string){
        const result  =  await  this.prisma.treasure.findUnique({
            where: {treasureId:id},
            select: {
                treasureId: true,
                treasureSeq: true,
                treasureName: true,
                productName: true,
                treasureCoverImg: true,
                unitAmount: true,
                seqShelvesQuantity: true,
                seqBuyQuantity: true,
                buyQuantityRate: true,
                lotteryMode: true,
                lotteryTime: true,
                state: true,
                cashState: true,
                charityAmount: true,
                groupMaxNum: true,
                imgStyleType: true,
                ruleContent: true,
                costAmount: true,
                mainImageList: true,
                desc: true,
                minBuyQuantity: true,
                maxUnitCoins: true,
                maxUnitAmount: true,
                maxPerBuyQuantity: true,
            }
        });
        return {
            ...result
        }
    }
}