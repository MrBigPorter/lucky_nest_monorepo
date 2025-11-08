// apps/api/scripts/seed/seed-sections.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============ 配置区 ============
const SECTIONS = [
    { key: 'home_ending',    title: 'Ending Soon',    imgStyleType: 1, sortOrder: 10 },
    { key: 'home_special',   title: 'Special Area',   imgStyleType: 2, sortOrder: 20 },
    { key: 'home_featured',  title: 'Featured',       imgStyleType: 3, sortOrder: 30 },
    { key: 'home_recommend', title: 'Recommendation', imgStyleType: 4, sortOrder: 40 },
];

// 绑定候选：支持环境变量 SPECIAL_BIND_IDS="10,120,122" 覆盖
const BIND_IDS = (process.env.SPECIAL_BIND_IDS ?? '10,120,122,111,7,19')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

// 当候选都不存在时，兜底自动挑选的数量
const FALLBACK_PICK = Number(process.env.SPECIAL_FALLBACK_PICK ?? 12);

// ============ DMMF 工具 ============
function makeCasterByScalar(typeName: string) {
    if (typeName === 'Int') {
        return (v: unknown) => {
            const n = Number(v);
            if (!Number.isFinite(n)) throw new Error(`[seed] Invalid Int id: ${v}`);
            return n;
        };
    }
    if (typeName === 'BigInt') {
        return (v: unknown) => {
            try { return BigInt(v as any); } catch { throw new Error(`[seed] Invalid BigInt id: ${v}`); }
        };
    }
    // String/UUID/Cuid 等按字符串
    return (v: unknown) => String(v);
}

/**
 * 解析 ActSectionItem ↔ Treasure 的外键信息：
 * - localFkName: ActSectionItem 上本地外键标量字段名（如 treasureId/treasure_id）
 * - localScalarType: 本地外键标量类型（String/Int/BigInt…）
 * - targetModel: 目标模型名（应为 Treasure）
 * - targetIdName: 目标模型主键字段名（如 treasureId）
 * - targetIdScalarType: 目标主键标量类型
 */
function resolveTreasureFkInfo() {
    const dm = (Prisma as any).dmmf?.datamodel;
    if (!dm) throw new Error('[seed] Prisma.dmmf is not available');

    const actSectionItem =
        dm.models.find((m: any) => m.name === 'ActSectionItem')
        || dm.models.find((m: any) => /act[_-]?section[_-]?item/i.test(m.name));
    if (!actSectionItem) {
        const modelNames = dm.models.map((m: any) => m.name).join(', ');
        throw new Error(`[seed] Cannot find model "ActSectionItem". Existing: ${modelNames}`);
    }

    // 优先走关系字段，能拿到 relationFromFields / relationToFields
    const relField =
        actSectionItem.fields.find((f: any) => f.relationName && f.type === 'Treasure')
        || actSectionItem.fields.find((f: any) => f.relationName && /treasure/i.test(f.type));

    let localFkName: string | undefined;
    let targetModelName = 'Treasure';
    if (relField?.relationFromFields?.length) {
        localFkName = relField.relationFromFields[0];
        targetModelName = relField.type;
    }

    // 若关系字段不给 fromFields，再尝试基于命名猜测本地标量字段
    if (!localFkName) {
        const guess =
            actSectionItem.fields.find((f: any) => !f.relationName && /^treasure[_-]?id$/i.test(f.name))
            || actSectionItem.fields.find((f: any) => !f.relationName && /treasure/i.test(f.name) && f.kind === 'scalar');
        if (guess) localFkName = guess.name;
    }

    const localFkField = localFkName
        ? actSectionItem.fields.find((f: any) => f.name === localFkName)
        : undefined;
    const localScalarType = localFkField?.type ?? 'String';

    // 目标模型与主键
    const targetModel =
        dm.models.find((m: any) => m.name === targetModelName)
        || dm.models.find((m: any) => m.name.toLowerCase() === String(targetModelName).toLowerCase());
    if (!targetModel) {
        throw new Error(`[seed] Cannot find target model "${targetModelName}" from relation`);
    }
    const idField =
        targetModel.fields.find((f: any) => f.isId)
        || targetModel.fields.find((f: any) => f.name === 'id');
    const targetIdName = idField?.name ?? 'id';
    const targetIdScalarType = idField?.type ?? 'String';

    return {
        localFkName: localFkName ?? 'treasureId',
        localScalarType,
        targetModel: targetModel.name,
        targetIdName,
        targetIdScalarType,
    };
}

// ============ 主流程 ============
async function main() {
    const fk = resolveTreasureFkInfo();
    const castLocal = makeCasterByScalar(fk.localScalarType);
    const castTarget = makeCasterByScalar(fk.targetIdScalarType);

    console.log('[seed] FK resolved:',
        { localFkName: fk.localFkName, localScalarType: fk.localScalarType, targetIdName: fk.targetIdName, targetIdScalarType: fk.targetIdScalarType });

    await prisma.$transaction(async (tx) => {
        // 1) 先清空区表（如模型设置了 onDelete: Cascade，会联动清掉 item）
        await tx.actSection.deleteMany({});
        console.log('[seed] actSection cleared');

        // 2) upsert 区块，拿到稳定 sectionId 映射
        const sectionByKey: Record<string, number> = {};
        for (const s of SECTIONS) {
            const rec = await tx.actSection.upsert({
                where: { key: s.key },
                create: s,
                update: { title: s.title, imgStyleType: s.imgStyleType, sortOrder: s.sortOrder },
            });
            sectionByKey[rec.key] = rec.id;
        }
        console.log('[seed] sections upserted:', sectionByKey);

        // 3) 只处理 home_special 的绑定（可按需扩展到其它 key）
        const specialId = sectionByKey['home_special'];
        if (!specialId) {
            console.warn('[seed] NO section "home_special" created. Skip binding.');
            return;
        }

        // 3.1 先把候选 ID 转成目标主键类型
        const wantedRaw = BIND_IDS;
        const wantedTyped = wantedRaw.map(castTarget);

        // 3.2 过滤为“Treasure 表中确实存在”的 ID
        const exist = await tx.treasure.findMany({
            where: { [fk.targetIdName]: { in: wantedTyped } } as any,
            select: { [fk.targetIdName]: true } as any,
        });
        const existSet = new Set(exist.map((x: any) => x[fk.targetIdName]));

        const picked = wantedTyped.filter((id) => existSet.has(id));

        if (!picked.length) {
            // 3.3 全部不存在时，自动兜底挑一些最新的宝贝
            const fallback = await tx.treasure.findMany({
                orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
                take: FALLBACK_PICK,
                select: { [fk.targetIdName]: true } as any,
            });
            const fbIds = fallback.map((x: any) => x[fk.targetIdName]);
            console.warn('[seed] SpecialArea: none of SPECIAL_BIND_IDS exist. Fallback to latest:', fbIds);
            picked.push(...fbIds);
        } else {
            const missing = wantedTyped.filter((id) => !existSet.has(id));
            if (missing.length) {
                console.warn('[seed] SpecialArea: some IDs not found and will be skipped:', missing);
            }
        }

        // 3.4 清这个区的老绑定
        await tx.actSectionItem.deleteMany({ where: { sectionId: specialId } });
        console.log('[seed] actSectionItem cleared for home_special');

        // 3.5 组装插入数据（动态本地外键名）
        const rows = picked.map((tid, i) => ({
            sectionId: specialId,
            sortOrder: i + 1,
            [fk.localFkName]: castLocal(tid),
        }));

        if (!rows.length) {
            console.warn('[seed] SpecialArea: nothing to insert even after fallback.');
            return;
        }

        const res = await tx.actSectionItem.createMany({ data: rows, skipDuplicates: true });
        console.log(`[seed] SpecialArea inserted ${res.count} items (requested=${rows.length})`);
    });

    console.log('[seed] sections seeding done.');
}

// ============ 入口 ============
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());