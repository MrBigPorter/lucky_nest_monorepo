import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

async function main() {
    const file = process.env.CATEGORIES_FILE
        ?? path.resolve(process.cwd(), 'scripts/seed/data/productCategoryList.json');

    const text = await fs.readFile(file, 'utf8');
    const json = JSON.parse(text) as { data?: any[] } | any[];

    const rows = Array.isArray(json) ? json : json.data!;
    const data = rows.map(r => ({
        id: Number(r.products_category_id),
        name: String(r.name),
    }));

    // 有就跳过
    await prisma.productCategory.createMany({
        data,
        skipDuplicates: true,
    });

    const count = await prisma.productCategory.count();
    console.log('product_categories total =', count);
}

main().finally(() => prisma.$disconnect());