// apps/api/scripts/seed/product-category-list.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/**
 * 产品分类 × 6
 * 幂等：按 name 查重，已存在则跳过
 * 返回 name → id 映射，供其他 seed 模块使用
 */
export async function seedProductCategories(): Promise<Record<string, number>> {
  const legacyNameMap: Record<string, string> = {
    'Home Appliances': 'Home',
    'Fashion & Lifestyle': 'Fashion',
    'Sports & Outdoor': 'Sports',
    'Beauty & Health': 'Beauty',
    'Cash Prizes': 'Cash',
  };

  for (const [legacyName, newName] of Object.entries(legacyNameMap)) {
    const legacy = await db.productCategory.findFirst({
      where: { name: legacyName },
      select: { id: true },
    });
    const target = await db.productCategory.findFirst({
      where: { name: newName },
      select: { id: true },
    });

    if (legacy && !target) {
      await db.productCategory.update({
        where: { id: legacy.id },
        data: { name: newName, nameEn: newName },
      });
    }
  }

  const rows = [
    {
      name: 'Electronics',
      nameEn: 'Electronics',
      icon: 'https://cdn.joyminis.com/icons/cat-electronics.png',
      sortOrder: 1,
    },
    {
      name: 'Home',
      nameEn: 'Home',
      icon: 'https://cdn.joyminis.com/icons/cat-appliances.png',
      sortOrder: 2,
    },
    {
      name: 'Fashion',
      nameEn: 'Fashion',
      icon: 'https://cdn.joyminis.com/icons/cat-fashion.png',
      sortOrder: 3,
    },
    {
      name: 'Sports',
      nameEn: 'Sports',
      icon: 'https://cdn.joyminis.com/icons/cat-sports.png',
      sortOrder: 4,
    },
    {
      name: 'Beauty',
      nameEn: 'Beauty',
      icon: 'https://cdn.joyminis.com/icons/cat-beauty.png',
      sortOrder: 5,
    },
    {
      name: 'Cash',
      nameEn: 'Cash',
      icon: 'https://cdn.joyminis.com/icons/cat-cash.png',
      sortOrder: 6,
    },
  ];

  let created = 0;
  const idMap: Record<string, number> = {};

  for (const row of rows) {
    const e = await db.productCategory.findFirst({ where: { name: row.name } });
    if (e) {
      idMap[row.name] = e.id;
    } else {
      const r = await db.productCategory.create({ data: row });
      idMap[row.name] = r.id;
      created++;
    }
  }

  console.log(`  ✅ ProductCategory  +${created} new`);
  return idMap;
}
