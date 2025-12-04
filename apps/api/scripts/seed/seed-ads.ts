// apps/api/scripts/seed/seed-ads.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function seedAdvertisements() {
  await db.advertisement.deleteMany({});

  await db.advertisement.createMany({
    data: [
      {
        title: 'Daily Login Bonus',
        img: 'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/202508191540333d2e6ad1-1fdf-4c96-b224-8342bc6a4688.jpg',
        fileType: 1,
        adPosition: 2, // 首页中部
        sortType: 1,
        sortOrder: 10,
        imgStyleType: 0,
        status: 1,
        jumpCate: 2,
        jumpUrl: '/me/rewards',
      },
      {
        title: 'Invite Friends, Earn Coins',
        img: 'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/202508191520533465a06b-2d8d-4bec-b261-fb86bd0880a1.jpg',
        fileType: 1,
        adPosition: 1, // 首页顶
        sortType: 1,
        sortOrder: 20,
        imgStyleType: 0,
        status: 1,
        jumpCate: 2,
        jumpUrl: '/me/invite',
      },
    ],
  });

  console.log('✅ Advertisements seeded');
}
