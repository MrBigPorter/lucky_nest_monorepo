// apps/api/scripts/seed/product-category-list.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/**
 * 产品分类 × 6
 * 幂等：按 name 查重，已存在则跳过
 * 返回 name → id 映射，供其他 seed 模块使用
 */
export async function seedProductCategories(): Promise<Record<string, number>> {
  const rows = [
    { name: 'Electronics',         nameEn: 'Electronics',         icon: 'https://cdn.joyminis.com/icons/cat-electronics.png',  sortOrder: 1 },
    { name: 'Home Appliances',     nameEn: 'Home Appliances',     icon: 'https://cdn.joyminis.com/icons/cat-appliances.png',   sortOrder: 2 },
    { name: 'Fashion & Lifestyle', nameEn: 'Fashion & Lifestyle', icon: 'https://cdn.joyminis.com/icons/cat-fashion.png',      sortOrder: 3 },
    { name: 'Sports & Outdoor',    nameEn: 'Sports & Outdoor',    icon: 'https://cdn.joyminis.com/icons/cat-sports.png',       sortOrder: 4 },
    { name: 'Beauty & Health',     nameEn: 'Beauty & Health',     icon: 'https://cdn.joyminis.com/icons/cat-beauty.png',       sortOrder: 5 },
    { name: 'Cash Prizes',         nameEn: 'Cash Prizes',         icon: 'https://cdn.joyminis.com/icons/cat-cash.png',         sortOrder: 6 },
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
