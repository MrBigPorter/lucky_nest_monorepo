// apps/api/scripts/seed/seed-sections.cjs
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const SECTIONS = [
    { key: 'home_ending',    title: 'Ending Soon',    imgStyleType: 1, sortOrder: 10 },
    { key: 'home_special',   title: 'Special Area',   imgStyleType: 2, sortOrder: 20 },
    { key: 'home_featured',  title: 'Featured',       imgStyleType: 3, sortOrder: 30 },
    { key: 'home_recommend', title: 'Recommendation', imgStyleType: 4, sortOrder: 40 },
];

// 这些 ID 必须在 Treasure 表里已存在，否则会违反外键
const BIND_IDS = ['10', '120', '122', '111', '7', '19'];

async function main() {
    await db.$transaction(async (tx) => {
        // 如果 ActSection.onDelete = Cascade，删父表就会联动清子表，不必两次 deleteMany
        await tx.actSection.deleteMany({});

        // 逐个 upsert，拿到稳定的 sectionId
        const sectionByKey = {};
        for (const s of SECTIONS) {
            const rec = await tx.actSection.upsert({
                where: { key: s.key },           // 需要 Prisma 模型里 key 有 @unique
                create: s,
                update: { title: s.title, imgStyleType: s.imgStyleType, sortOrder: s.sortOrder },
            });
            sectionByKey[rec.key] = rec.id;
        }

        // 只处理 home_special 的绑定
        const specialId = sectionByKey['home_special'];
        if (specialId) {
            // 自动探测 Treasure.id 类型（Int / String）
            const sample = await tx.treasure.findFirst({ select: { id: true } });
            const toTid = (v) => sample && typeof sample.id === 'number' ? Number(v) : String(v);

            // 过滤掉不存在的 treasure，避免 FK 错误
            const wanted = BIND_IDS.map(toTid);
            const exist = await tx.treasure.findMany({
                where: { id: { in: wanted } },
                select: { id: true },
            });
            const existSet = new Set(exist.map(x => x.id));

            const data = wanted
                .filter(id => existSet.has(id))
                .map((tid, i) => ({
                    sectionId: specialId,
                    treasureId: tid,
                    sortOrder: i + 1,
                }));

            // 先清这个区的绑定，再写入
            await tx.actSectionItem.deleteMany({ where: { sectionId: specialId } });
            if (data.length) {
                await tx.actSectionItem.createMany({ data, skipDuplicates: true });
            } else {
                console.warn('[seed] home_special 没有任何有效的 treasure 绑定，请检查 BIND_IDS');
            }
        }
    });
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => db.$disconnect());