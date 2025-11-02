
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

const now = new Date();
const in7d = new Date(Date.now() + 7 * 24 * 3600 * 1000);

const data: Prisma.BannerCreateManyInput[] = [
    {
        id: 'banner_home_top',
        title: 'Home Top - Carousel',
        bannerCate: 1,          // 首页
        position: 0,            // 顶部
        showType: 2,            // 轮播
        bannerArray: [
            { img: 'https://picsum.photos/seed/lucky1/1200/500', jump_cate: 5, jump_url: 'https://example.com' },
            { img: 'https://picsum.photos/seed/lucky2/1200/500', jump_cate: 3, related_title_id: '1701' },
            { img: 'https://picsum.photos/seed/lucky3/1200/500', jump_cate: 2, jump_url: '/promo/123' },
        ],
        activityAtStart: now,
        activityAtEnd: in7d,
        state: 1,
        validState: 1,
        sortOrder: 1,
    },
    {
        id: 'banner_home_middle',
        title: 'Home Middle - Single',
        bannerCate: 1,
        position: 1,            // 中部
        showType: 1,            // 单图
        bannerImgUrl: 'https://picsum.photos/seed/lucky4/1200/500',
        jumpCate: 5,
        jumpUrl: 'https://example.com/deals',
        activityAtStart: now,
        activityAtEnd: in7d,
        state: 1,
        validState: 1,
        sortOrder: 2,
    },
];

async function main() {
    await prisma.banner.createMany({ data, skipDuplicates: true });
    const count = await prisma.banner.count();
    console.log('banners total =', count);
}

main().finally(() => prisma.$disconnect());