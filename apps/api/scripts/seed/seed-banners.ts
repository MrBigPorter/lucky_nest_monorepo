// apps/api/scripts/seed/seed-banners.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function seedBanners() {
  // 先清空
  await db.banner.deleteMany({});

  // 找一个 iPhone 宝箱，用来挂到第二个 banner 上
  const iphoneTreasure = await db.treasure.findFirst({
    where: { productName: 'Apple iPhone 16 128GB' },
    select: { treasureId: true },
  });

  await db.banner.createMany({
    data: [
      {
        title: 'Win up to ₱10,000 Cash',
        // 用你自己图床 / S3 的图片
        bannerImgUrl:
          'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/banner/home_cash_hero.jpg',
        fileType: 1,
        bannerCate: 1, // 首页
        position: 0, // 顶部
        sortType: 1,
        sortOrder: 10,
        jumpCate: 2, // APP 内页
        jumpUrl: '/product', // 产品列表
        showType: 1,
        imgStyleType: 0,
        state: 1,
        validState: 1,
      },
      {
        title: 'Hot iPhone Draw',
        bannerImgUrl:
          'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/banner/home_iphone_hot.jpg',
        fileType: 1,
        bannerCate: 1,
        position: 0,
        sortType: 1,
        sortOrder: 20,
        jumpCate: 3, // 产品详情
        relatedTitleId: iphoneTreasure?.treasureId ?? null,
        showType: 1,
        imgStyleType: 1,
        state: 1,
        validState: 1,
      },
    ],
  });

  console.log('✅ Banners seeded');
}
