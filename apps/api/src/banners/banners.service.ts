import {Injectable} from "@nestjs/common";
import {PrismaService} from "@api/prisma/prisma.service";
import {BannerQueryDto} from "@api/banners/dto/banner-query.dto";

@Injectable()
export class BannersService {
    constructor(private readonly  prisma: PrismaService) {
    }

    async list(query: BannerQueryDto) {
        const now = new Date();

        const  where: any = {
            ...(query.state != null ? {state:query.state} : {state: 1}),
            ...(query.validState != null ? {validState:query.validState} : {validState: 1}),
            ...(query.bannerCate != null ? {bannerCate: query.bannerCate} : {bannerCate: {}}),
            ...(query.position != null ? {position: query.position} : {position: {}}),
            AND: [
                {OR:[{activityAtStart:{lte: now}},{activityAtStart: null}]},
                {OR:[{activityAtEnd:{gte: now}},{activityAtEnd: null}]}
            ]
        }


        return this.prisma.banner.findMany({
            where,
            take: query.limit ?? 10,
            select: {
                id: true,
                title: true,
                bannerCate: true,
                position: true,
                showType: true,         // 1=单图 2=轮播
                fileType: true,         // 1=图片 2=视频
                bannerImgUrl: true,     // showType=1
                bannerArray: true,      // showType=2 (Json[])
                jumpCate: true,
                jumpUrl: true,
                relatedTitleId: true,
                imgStyleType: true,
                gridId: true,
                activityAtStart: true,
                activityAtEnd: true,
                state: true,
                validState: true,
                sortOrder: true,
            }
        });
    }
}