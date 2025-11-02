import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

const now = new Date();
const in30d = new Date(Date.now() + 30 * 24 * 3600 * 1000);

const data: Prisma.AdvertisementCreateManyInput[] = [
    {
        id: 'ad_home_top',
        title: 'Home Top Ad',
        adPosition: 1, // 首页顶部
        fileType: 1,   // 图片
        adImgUrl: 'https://picsum.photos/seed/ad1/1200/400',
        startTime: now,
        endTime: in30d,
        status: 1,
        sortOrder: 1,
    },
    {
        id: 'ad_product_page',
        title: 'Product Page Ad',
        adPosition: 4, // 详情页
        fileType: 1,
        adImgUrl: 'https://picsum.photos/seed/ad2/1200/400',
        jumpCate: 3,   // 产品详情
        relatedId: '1701',
        startTime: now,
        endTime: in30d,
        status: 1,
        sortOrder: 2,
    },
];

async function main() {
    await prisma.advertisement.createMany({ data, skipDuplicates: true });
    const count = await prisma.advertisement.count();
    console.log('ads total =', count);
}

main().finally(() => prisma.$disconnect());