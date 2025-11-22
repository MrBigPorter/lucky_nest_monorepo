// apps/api/scripts/seed/product-category-list.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/**
 * 重新插入产品分类
 * - 清空 treasureCategory + productCategory
 * - 使用自增 id
 * - name / nameEn 都用「短名字」，方便前端展示
 */
export async function seedProductCategories() {
    // 先清掉关联，再清分类
    await db.treasureCategory.deleteMany({});
    await db.productCategory.deleteMany({});

    const categories = [
        {
            name: 'Cash',
            nameEn: 'Cash',
            icon: 'https://cdn.example.com/categories/cash.png',
            sortOrder: 10,
            state: 1,
        },
        {
            name: 'Phone',
            nameEn: 'Phone',
            icon: 'https://cdn.example.com/categories/phone.png',
            sortOrder: 20,
            state: 1,
        },
        {
            name: 'Gadget',
            nameEn: 'Gadget',
            icon: 'https://cdn.example.com/categories/gadget.png',
            sortOrder: 30,
            state: 1,
        },
        {
            name: 'Home',
            nameEn: 'Home',
            icon: 'https://cdn.example.com/categories/home.png',
            sortOrder: 40,
            state: 1,
        },
        {
            name: 'Fashion',
            nameEn: 'Fashion',
            icon: 'https://cdn.example.com/categories/fashion.png',
            sortOrder: 50,
            state: 1,
        },
        {
            name: 'Game',
            nameEn: 'Game',
            icon: 'https://cdn.example.com/categories/game.png',
            sortOrder: 60,
            state: 1,
        },
        {
            name: 'Voucher',
            nameEn: 'Voucher',
            icon: 'https://cdn.example.com/categories/voucher.png',
            sortOrder: 70,
            state: 1,
        },
    ];

    await db.productCategory.createMany({
        data: categories,
    });

    console.log('✅ Product categories seeded');
}