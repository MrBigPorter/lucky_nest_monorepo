// apps/api/scripts/seed/seed-treasures.ts
import { PrismaClient, Prisma } from '@prisma/client';

const db = new PrismaClient();
const D = (n: number | string) => new Prisma.Decimal(n);

// 用你现有 S3 里的一组图片当成“图片库”
const COVER_POOL: string[] = [
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/202508191540333d2e6ad1-1fdf-4c96-b224-8342bc6a4688.jpg',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/202508191520533465a06b-2d8d-4bec-b261-fb86bd0880a1.jpg',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/202510011447103b881e77-d1c6-435b-b780-7bfe4ea5472c.png',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/2025081915120497e04c94-1603-4fbd-936d-fa0d77ab32aa.jpg',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/20250923142219a86201c1-85ea-4614-bae4-919221cf64a6.jpg',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/20250923142457926af44b-bca6-4e8f-a08b-a57934fc6399.png',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/20250819154218e96b22f3-8424-4bb7-ab74-7a30c130835e.jpg',
  'https://prod-pesolucky.s3.ap-east-1.amazonaws.com/avatar/20250829183122eaa903c8-15a0-45d0-91ac-06c4a6687ed1.jpg',
];

/**
 * 种子宝箱/抽奖产品
 * - 包含：现金奖、手机、家电、数码、时尚、游戏点券、代金券
 * - 并关联到 ProductCategory（通过短名字：Cash / Phone / Gadget / Home / Fashion / Game / Voucher）
 */
export async function seedTreasures() {
  // 先清关联，再清主表，保证数据干净
  await db.actSectionItem.deleteMany({});
  await db.treasureCategory.deleteMany({});
  await db.order.deleteMany({});
  await db.treasureGroupMember.deleteMany({});
  await db.treasureGroup.deleteMany({});
  await db.treasure.deleteMany({});

  // 先查分类，方便按 name/nameEn 分配
  const categories = await db.productCategory.findMany();
  const catMap = new Map<string, number>();
  for (const c of categories) {
    catMap.set(c.nameEn ?? c.name, c.id);
  }

  type SeedTreasure = {
    treasureName: string;
    productName: string;
    costAmount: Prisma.Decimal;
    unitAmount: Prisma.Decimal;
    cashAmount: Prisma.Decimal | null;
    totalSlots: number;
    boughtSlots: number;
    minBuyQuantity: number;
    maxPerBuyQuantity: number;
    category:
      | 'Cash'
      | 'Phone'
      | 'Gadget'
      | 'Home'
      | 'Fashion'
      | 'Game'
      | 'Voucher';
    imgStyleType: number;
    virtual: 1 | 2;
  };

  const treasures: SeedTreasure[] = [
    // 1) 现金类 Cash
    {
      treasureName: '₱3,000 Cash Prize',
      productName: 'Cash Reward ₱3,000',
      costAmount: D(2500),
      unitAmount: D(10),
      cashAmount: D(3000),
      totalSlots: 800,
      boughtSlots: 320,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 100,
      category: 'Cash',
      imgStyleType: 0,
      virtual: 1,
    },
    {
      treasureName: '₱10,000 Mega Cash',
      productName: 'Mega Cash Reward ₱10,000',
      costAmount: D(8000),
      unitAmount: D(25),
      cashAmount: D(10000),
      totalSlots: 1000,
      boughtSlots: 740,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 80,
      category: 'Cash',
      imgStyleType: 0,
      virtual: 1,
    },
    {
      treasureName: '₱50,000 Grand Cash',
      productName: 'Grand Cash Reward ₱50,000',
      costAmount: D(42000),
      unitAmount: D(59),
      cashAmount: D(50000),
      totalSlots: 2000,
      boughtSlots: 280,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 100,
      category: 'Cash',
      imgStyleType: 0,
      virtual: 1,
    },

    // 2) 手机 Phone
    {
      treasureName: 'iPhone 16 (128GB)',
      productName: 'Apple iPhone 16 128GB',
      costAmount: D(55000),
      unitAmount: D(49),
      cashAmount: null,
      totalSlots: 2000,
      boughtSlots: 960,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 50,
      category: 'Phone',
      imgStyleType: 1,
      virtual: 2,
    },
    {
      treasureName: 'Samsung Galaxy S25',
      productName: 'Samsung Galaxy S25 256GB',
      costAmount: D(42000),
      unitAmount: D(39),
      cashAmount: null,
      totalSlots: 2000,
      boughtSlots: 300,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 50,
      category: 'Phone',
      imgStyleType: 1,
      virtual: 2,
    },
    {
      treasureName: 'Xiaomi Redmi Note 14',
      productName: 'Redmi Note 14 256GB',
      costAmount: D(16000),
      unitAmount: D(19),
      cashAmount: null,
      totalSlots: 1500,
      boughtSlots: 720,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 80,
      category: 'Phone',
      imgStyleType: 1,
      virtual: 2,
    },

    // 3) Gadgets
    {
      treasureName: 'AirPods Pro (3rd Gen)',
      productName: 'Apple AirPods Pro 3',
      costAmount: D(14000),
      unitAmount: D(19),
      cashAmount: null,
      totalSlots: 1000,
      boughtSlots: 510,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 60,
      category: 'Gadget',
      imgStyleType: 1,
      virtual: 2,
    },
    {
      treasureName: 'iPad mini (Wifi 128GB)',
      productName: 'Apple iPad mini Wifi 128GB',
      costAmount: D(28000),
      unitAmount: D(29),
      cashAmount: null,
      totalSlots: 1500,
      boughtSlots: 220,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 50,
      category: 'Gadget',
      imgStyleType: 1,
      virtual: 2,
    },

    // 4) 家居 Home
    {
      treasureName: 'Dyson Supersonic Hair Dryer',
      productName: 'Dyson Supersonic',
      costAmount: D(25000),
      unitAmount: D(29),
      cashAmount: null,
      totalSlots: 1500,
      boughtSlots: 880,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 50,
      category: 'Home',
      imgStyleType: 1,
      virtual: 2,
    },
    {
      treasureName: 'Smart Rice Cooker',
      productName: 'Philips Smart Rice Cooker',
      costAmount: D(6000),
      unitAmount: D(9),
      cashAmount: null,
      totalSlots: 800,
      boughtSlots: 260,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 80,
      category: 'Home',
      imgStyleType: 1,
      virtual: 2,
    },

    // 5) 游戏点券 Game
    {
      treasureName: '₱1,000 Game Credits',
      productName: 'Game Top-up ₱1,000',
      costAmount: D(800),
      unitAmount: D(10),
      cashAmount: null,
      totalSlots: 800,
      boughtSlots: 300,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 80,
      category: 'Game',
      imgStyleType: 0,
      virtual: 1,
    },
    {
      treasureName: '₱500 Steam Wallet Code',
      productName: 'Steam Wallet ₱500',
      costAmount: D(400),
      unitAmount: D(5),
      cashAmount: null,
      totalSlots: 600,
      boughtSlots: 150,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 80,
      category: 'Game',
      imgStyleType: 0,
      virtual: 1,
    },

    // 6) 代金券 Voucher
    {
      treasureName: '₱1,000 Shopping Voucher',
      productName: 'Mall Shopping Voucher ₱1,000',
      costAmount: D(800),
      unitAmount: D(10),
      cashAmount: null,
      totalSlots: 900,
      boughtSlots: 420,
      minBuyQuantity: 1,
      maxPerBuyQuantity: 90,
      category: 'Voucher',
      imgStyleType: 0,
      virtual: 1,
    },
  ];

  for (let i = 0; i < treasures.length; i++) {
    const t = treasures[i];
    const categoryId = catMap.get(t.category);
    if (!categoryId) {
      console.warn(
        `⚠️ Category not found for treasure: ${t.treasureName} (category=${t.category})`,
      );
      continue;
    }

    const cover = COVER_POOL[i % COVER_POOL.length];
    const cover2 = COVER_POOL[(i + 3) % COVER_POOL.length];

    const treasure = await db.treasure.create({
      data: {
        treasureName: t.treasureName,
        productName: t.productName,
        treasureCoverImg: cover,
        mainImageList: [cover, cover2],
        costAmount: t.costAmount,
        unitAmount: t.unitAmount,
        cashAmount: t.cashAmount ?? undefined,
        seqShelvesQuantity: t.totalSlots,
        seqBuyQuantity: t.boughtSlots,
        minBuyQuantity: t.minBuyQuantity,
        maxPerBuyQuantity: t.maxPerBuyQuantity,
        lotteryMode: 1, // 先用售罄模式
        lotteryDelayState: 0,
        imgStyleType: t.imgStyleType,
        virtual: t.virtual,
        groupMaxNum: 9999,
        maxUnitCoins: D(100), // 每份最多用多少 coins，先写一个合理值
        maxUnitAmount: D(20), // 每份最多折多少 PHP
        charityAmount: D(0),
        ruleContent: '<p>Standard lucky draw rules apply.</p>',
        desc: '<p>Join the treasure draw and win amazing rewards!</p>',
        state: 1,
      },
    });

    await db.treasureCategory.create({
      data: {
        treasureId: treasure.treasureId,
        categoryId,
      },
    });
  }

  console.log('✅ Treasures seeded');
}
