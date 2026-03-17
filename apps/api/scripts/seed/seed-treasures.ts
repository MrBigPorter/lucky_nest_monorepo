// apps/api/scripts/seed/seed-treasures.ts
/**
 * 抽奖产品 (Treasure) × 8  +  产品-分类关联 (TreasureCategory)
 *
 * 编号  产品名称                              价格     总份数  分类
 * JM-001  Apple iPhone 16 Pro 256GB         ₱250/份  300份  Electronics
 * JM-002  Samsung Galaxy S25 Ultra 512GB    ₱200/份  300份  Electronics
 * JM-003  Sony PS5 Slim + 3 Games Bundle    ₱150/份  200份  Electronics
 * JM-004  Dyson V15 Detect Vacuum           ₱100/份  150份  Home Appliances
 * JM-005  Nike Air Jordan 4 Retro (US10)    ₱ 50/份  100份  Fashion & Lifestyle
 * JM-006  Dyson Supersonic HD15 Hair Dryer  ₱ 80/份  125份  Beauty & Health
 * JM-007  Cash Prize ₱5,000  (virtual)      ₱100/份   60份  Cash Prizes
 * JM-008  Cash Prize ₱10,000 (virtual)      ₱200/份   60份  Cash Prizes
 *
 * 字段说明:
 *   unitAmount         每份价格（PHP）
 *   seqShelvesQuantity 总份数（总票数）
 *   minBuyQuantity     触发开奖所需最低售出份数（售罄模式下 = seqShelvesQuantity）
 *   maxPerBuyQuantity  单人最大购买份数
 *   lotteryMode        1=售罄即开奖  2=定时开奖
 *   virtual            1=虚拟(现金)  2=实物
 *   shippingType       1=需发货      2=无需发货
 *   fakeSalesCount     虚拟已售数（热度展示用）
 *   marketAmount       市场参考价（前端展示）
 *   cashAmount         现金奖励金额（virtual=1 时有效）
 *   groupSize          成团所需人数
 *   groupTimeLimit     成团时效（秒）超时未满则解散/机器人补齐
 *   enableRobot        是否允许机器人自动补齐拼团
 *   robotDelay         机器人介入前等待秒数
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const daysLater = (d: number) => new Date(Date.now() + d * 86_400_000);

// 拼团配置快捷常量
const G5 = { groupSize: 5, groupTimeLimit: 86_400 }; // 5人团，24h
const G3 = { groupSize: 3, groupTimeLimit: 86_400 }; // 3人团，24h

const TREASURES = [
  // ─────────────────────────────────────────
  // Electronics
  // ─────────────────────────────────────────
  {
    treasureSeq:        'JM-001',
    treasureName:       'Apple iPhone 16 Pro 256GB',
    productName:        'iPhone 16 Pro 256GB Natural Titanium',
    treasureCoverImg:   'https://cdn.joyminis.com/products/iphone16pro-cover.jpg',
    mainImageList:      [
      'https://cdn.joyminis.com/products/iphone16pro-1.jpg',
      'https://cdn.joyminis.com/products/iphone16pro-2.jpg',
    ],
    unitAmount:         250,
    marketAmount:       75000,
    costAmount:         70000,
    seqShelvesQuantity: 300,
    minBuyQuantity:     300,
    maxPerBuyQuantity:  30,
    lotteryMode:        1,
    virtual:            2,
    shippingType:       1,
    fakeSalesCount:     120,
    ...G5,
    desc: '<p>Latest Apple iPhone 16 Pro with A18 Pro chip, 48MP Fusion camera system, 5× telephoto. Brand new sealed.</p>',
    category: 'Electronics',
  },
  {
    treasureSeq:        'JM-002',
    treasureName:       'Samsung Galaxy S25 Ultra 512GB',
    productName:        'Samsung Galaxy S25 Ultra Titanium Gray 512GB',
    treasureCoverImg:   'https://cdn.joyminis.com/products/s25ultra-cover.jpg',
    mainImageList:      [
      'https://cdn.joyminis.com/products/s25ultra-1.jpg',
      'https://cdn.joyminis.com/products/s25ultra-2.jpg',
    ],
    unitAmount:         200,
    marketAmount:       60000,
    costAmount:         55000,
    seqShelvesQuantity: 300,
    minBuyQuantity:     300,
    maxPerBuyQuantity:  30,
    lotteryMode:        1,
    virtual:            2,
    shippingType:       1,
    fakeSalesCount:     85,
    ...G5,
    desc: '<p>Samsung Galaxy S25 Ultra with 200MP camera, built-in S Pen, Snapdragon 8 Elite. 512GB storage.</p>',
    category: 'Electronics',
  },
  {
    treasureSeq:        'JM-003',
    treasureName:       'Sony PlayStation 5 Slim + 3 Games Bundle',
    productName:        'PS5 Slim + EA FC25 + Spider-Man 2 + God of War Ragnarök',
    treasureCoverImg:   'https://cdn.joyminis.com/products/ps5slim-cover.jpg',
    mainImageList:      [
      'https://cdn.joyminis.com/products/ps5slim-1.jpg',
      'https://cdn.joyminis.com/products/ps5slim-2.jpg',
    ],
    unitAmount:         150,
    marketAmount:       30000,
    costAmount:         27000,
    seqShelvesQuantity: 200,
    minBuyQuantity:     200,
    maxPerBuyQuantity:  20,
    lotteryMode:        1,
    virtual:            2,
    shippingType:       1,
    fakeSalesCount:     64,
    ...G3,
    desc: '<p>Sony PlayStation 5 Slim console bundle includes 3 top-rated games. Brand new sealed.</p>',
    category: 'Electronics',
  },
  // ─────────────────────────────────────────
  // Home Appliances
  // ─────────────────────────────────────────
  {
    treasureSeq:        'JM-004',
    treasureName:       'Dyson V15 Detect Absolute Vacuum',
    productName:        'Dyson V15 Detect Absolute Cordless Vacuum Cleaner',
    treasureCoverImg:   'https://cdn.joyminis.com/products/dysonv15-cover.jpg',
    mainImageList:      ['https://cdn.joyminis.com/products/dysonv15-1.jpg'],
    unitAmount:         100,
    marketAmount:       15000,
    costAmount:         13500,
    seqShelvesQuantity: 150,
    minBuyQuantity:     150,
    maxPerBuyQuantity:  15,
    lotteryMode:        1,
    virtual:            2,
    shippingType:       1,
    fakeSalesCount:     52,
    ...G3,
    desc: '<p>Dyson V15 Detect with laser dust detection, HEPA filtration, and up to 60-min run time.</p>',
    category: 'Home Appliances',
  },
  // ─────────────────────────────────────────
  // Fashion & Lifestyle
  // ─────────────────────────────────────────
  {
    treasureSeq:        'JM-005',
    treasureName:       'Nike Air Jordan 4 Retro "Military Blue" (US10)',
    productName:        'Air Jordan 4 Retro Military Blue US Size 10',
    treasureCoverImg:   'https://cdn.joyminis.com/products/aj4-cover.jpg',
    mainImageList:      [
      'https://cdn.joyminis.com/products/aj4-1.jpg',
      'https://cdn.joyminis.com/products/aj4-2.jpg',
    ],
    unitAmount:         50,
    marketAmount:       5000,
    costAmount:         4500,
    seqShelvesQuantity: 100,
    minBuyQuantity:     100,
    maxPerBuyQuantity:  10,
    lotteryMode:        1,
    virtual:            2,
    shippingType:       1,
    fakeSalesCount:     37,
    ...G5,
    desc: '<p>Nike Air Jordan 4 Retro Military Blue — iconic colorway. Authentic, brand new in original box.</p>',
    category: 'Fashion & Lifestyle',
  },
  // ─────────────────────────────────────────
  // Beauty & Health
  // ─────────────────────────────────────────
  {
    treasureSeq:        'JM-006',
    treasureName:       'Dyson Supersonic HD15 Hair Dryer',
    productName:        'Dyson Supersonic HD15 Nickel/Copper',
    treasureCoverImg:   'https://cdn.joyminis.com/products/dysonsupersonic-cover.jpg',
    mainImageList:      ['https://cdn.joyminis.com/products/dysonsupersonic-1.jpg'],
    unitAmount:         80,
    marketAmount:       10000,
    costAmount:         9000,
    seqShelvesQuantity: 125,
    minBuyQuantity:     125,
    maxPerBuyQuantity:  10,
    lotteryMode:        1,
    virtual:            2,
    shippingType:       1,
    fakeSalesCount:     43,
    ...G3,
    desc: '<p>Dyson Supersonic HD15 with intelligent heat control measuring temperature 40× per second.</p>',
    category: 'Beauty & Health',
  },
  // ─────────────────────────────────────────
  // Cash Prizes (virtual, no shipping)
  // ─────────────────────────────────────────
  {
    treasureSeq:        'JM-007',
    treasureName:       '₱5,000 Cash Prize 💰',
    productName:        'Cash Prize ₱5,000 via GCash / Bank Transfer',
    treasureCoverImg:   'https://cdn.joyminis.com/products/cash5k-cover.jpg',
    mainImageList:      ['https://cdn.joyminis.com/products/cash5k-1.jpg'],
    unitAmount:         100,   // ₱100/份 × 60份 = ₱6,000 (platform margin ₱1,000)
    marketAmount:       5000,
    cashAmount:         5000,
    seqShelvesQuantity: 60,
    minBuyQuantity:     60,
    maxPerBuyQuantity:  10,
    lotteryMode:        1,
    virtual:            1,     // 虚拟
    shippingType:       2,     // 无需发货
    fakeSalesCount:     21,
    ...G5,
    desc: '<p>Win ₱5,000 cash! Transferred to your GCash or bank account within 24 hours of winning.</p>',
    category: 'Cash Prizes',
  },
  {
    treasureSeq:        'JM-008',
    treasureName:       '₱10,000 Cash Prize 💎',
    productName:        'Cash Prize ₱10,000 via GCash / Bank Transfer',
    treasureCoverImg:   'https://cdn.joyminis.com/products/cash10k-cover.jpg',
    mainImageList:      ['https://cdn.joyminis.com/products/cash10k-1.jpg'],
    unitAmount:         200,   // ₱200/份 × 60份 = ₱12,000
    marketAmount:       10000,
    cashAmount:         10000,
    seqShelvesQuantity: 60,
    minBuyQuantity:     60,
    maxPerBuyQuantity:  10,
    lotteryMode:        1,
    virtual:            1,
    shippingType:       2,
    fakeSalesCount:     18,
    ...G5,
    desc: '<p>Win ₱10,000 cash! Transferred to your GCash or bank account within 24 hours of winning.</p>',
    category: 'Cash Prizes',
  },
];

export async function seedTreasures(): Promise<Record<string, string>> {
  const now   = new Date();
  const endAt = daysLater(90);

  let tCreated = 0;
  let cCreated = 0;
  const seqToId: Record<string, string> = {};

  // 先取出所有分类，构建 name→id 映射
  const cats = await db.productCategory.findMany({ select: { id: true, name: true } });
  const catMap: Record<string, number> = Object.fromEntries(
    cats.map((c: { id: number; name: string }) => [c.name, c.id]),
  );

  for (const { category, mainImageList, ...rest } of TREASURES) {
    // ── 幂等：按 treasureSeq ────────────────────────────────
    const existing = await db.treasure.findUnique({ where: { treasureSeq: rest.treasureSeq } });
    let treasureId: string;

    if (existing) {
      treasureId = existing.treasureId;
    } else {
      const t = await db.treasure.create({
        data: {
          ...rest,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mainImageList: mainImageList as unknown as any,
          salesStartAt:  now,
          salesEndAt:    endAt,
          state:         1,         // 上架
          status:        'ACTIVE',
          enableRobot:   true,
          robotDelay:    600,       // 10 min 后机器人自动补齐
        },
      });
      treasureId = t.treasureId;
      tCreated++;
    }

    seqToId[rest.treasureSeq] = treasureId;

    // ── 产品-分类关联 TreasureCategory ──────────────────────
    const categoryId = catMap[category];
    if (categoryId) {
      const linkExists = await db.treasureCategory.findFirst({
        where: { treasureId, categoryId },
      });
      if (!linkExists) {
        await db.treasureCategory.create({ data: { treasureId, categoryId } });
        cCreated++;
      }
    }
  }

  console.log(`  ✅ Treasure         +${tCreated} new`);
  console.log(`  ✅ TreasureCategory +${cCreated} new`);
  return seqToId;
}
