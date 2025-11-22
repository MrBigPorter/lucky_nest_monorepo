// apps/api/scripts/seed/seed-sections.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function seedActSections() {
    // 1) 先清空
    await db.actSectionItem.deleteMany({});
    await db.actSection.deleteMany({});

    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 2) 创建多个专区（key 用来区分用途）
    await db.actSection.createMany({
        data: [
            {
                key: 'hot_picks',
                title: 'Hot Picks',
                imgStyleType: 0,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 10,
                limit: 8,
            },
            {
                key: 'cash_zone',
                title: 'Cash Zone',
                imgStyleType: 0,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 20,
                limit: 6,
            },
            {
                key: 'phones',
                title: 'Smartphones',
                imgStyleType: 1,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 30,
                limit: 6,
            },
            {
                key: 'gadgets',
                title: 'Gadgets',
                imgStyleType: 1,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 40,
                limit: 6,
            },
            {
                key: 'home_essentials',
                title: 'Home Essentials',
                imgStyleType: 1,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 50,
                limit: 6,
            },
            {
                key: 'game_corner',
                title: 'Game Corner',
                imgStyleType: 0,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 60,
                limit: 6,
            },
            {
                key: 'voucher_deals',
                title: 'Voucher Deals',
                imgStyleType: 0,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 70,
                limit: 6,
            },
            {
                key: 'new_this_week',
                title: 'New This Week',
                imgStyleType: 0,
                status: 1,
                startAt: now,
                endAt: nextMonth,
                sortOrder: 80,
                limit: 8,
            },
        ],
    });

    // 查出刚刚插入的 sections
    const sectionsList = await db.actSection.findMany();
    const sectionMap = new Map(sectionsList.map((s) => [s.key, s]));

    // 3) 准备各类宝箱集合（依赖你前面 seed 的分类：Cash / Phone / Gadget / Home / Fashion / Game / Voucher）
    // 3.1 所有宝箱，用于 Hot Picks / New This Week
    const allTreasures = await db.treasure.findMany({
        orderBy: { createdAt: 'desc' },
    });

    // 3.2 按分类筛选（用 nameEn 或 name）
    const byCategory = async (nameEn: string) =>
        db.treasure.findMany({
            where: {
                categories: {
                    some: {
                        category: {
                            OR: [{ nameEn }, { name: nameEn }],
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

    const cashTreasures = await byCategory('Cash');
    const phoneTreasures = await byCategory('Phone');
    const gadgetTreasures = await byCategory('Gadget');
    const homeTreasures = await byCategory('Home');
    const gameTreasures = await byCategory('Game');
    const voucherTreasures = await byCategory('Voucher');

    // 4) 组装 ActSectionItem
    const items: { sectionId: string; treasureId: string; sortOrder: number }[] =
        [];

    const pushSectionItems = (
        sectionKey: string,
        treasures: { treasureId: string }[],
    ) => {
        const section = sectionMap.get(sectionKey);
        if (!section) return;
        const limit = section.limit ?? 10;

        treasures.slice(0, limit).forEach((t, idx) => {
            items.push({
                sectionId: section.id,
                treasureId: t.treasureId,
                sortOrder: idx,
            });
        });
    };

    // Hot Picks：用购买率/进度靠前的一些（这里简单用 seqBuyQuantity 排）
    const hotByBuy = [...allTreasures].sort(
        (a, b) => b.seqBuyQuantity - a.seqBuyQuantity,
    );
    pushSectionItems('hot_picks', hotByBuy);

    // New This Week：按 createdAt 最新的
    const newest = [...allTreasures].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    pushSectionItems('new_this_week', newest);

    // 各类专区
    pushSectionItems('cash_zone', cashTreasures);
    pushSectionItems('phones', phoneTreasures);
    pushSectionItems('gadgets', gadgetTreasures);
    pushSectionItems('home_essentials', homeTreasures);
    pushSectionItems('game_corner', gameTreasures);
    pushSectionItems('voucher_deals', voucherTreasures);

    if (items.length) {
        await db.actSectionItem.createMany({ data: items });
    }

    console.log('✅ Act sections & items seeded');
}