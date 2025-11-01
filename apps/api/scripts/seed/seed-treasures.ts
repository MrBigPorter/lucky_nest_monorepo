// apps/api/scripts/seed/seed-treasures.ts
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

// ============ 小工具 ============
const coalesce = <T>(...vals: Array<T | null | undefined>) =>
    vals.find(v => v !== null && v !== undefined) as T | undefined;

const must = <T>(val: T | undefined | null, msg: string): T => {
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        throw new Error(msg);
    }
    return val as T;
};

const toDate = (ms?: number | null) => (ms && Number(ms) > 0 ? new Date(Number(ms)) : null);
const toNumber = (v: any) => (v == null ? undefined : Number(v));

// ============ 分类规则（可按需改） ============
const CATEGORY_RULES = [
    { name: 'Cash', keywords: [/₱\s*\d/i, /\bphp\b/i, /\bcash\b/i, /\bmoney\b/i] },
    { name: 'Tech', keywords: [/iphone|apple|airpods|ipad|mac|realme|samsung|xiaomi|laptop|watch/i] },
    { name: 'Home', keywords: [/vacuum|cooker|blender|fryer|pan|kettle|lamp|fan|chair|sofa/i] },
    { name: 'Hot',  keywords: [/hot/i] },
];

async function ensureCategories(names: string[]): Promise<Map<string, number>> {
    if (!names.length) return new Map<string, number>();

    type CatRow = { id: number; name: string };

    const existing: CatRow[] = await prisma.productCategory.findMany({
        where: { name: { in: names } },
        select: { id: true, name: true },
    });

    const have = new Set(existing.map(x => x.name));
    const missing = names.filter(n => !have.has(n));


    if (missing.length) {
        await prisma.productCategory.createMany({
            data: missing.map(n => ({ name: n })),
            skipDuplicates: true,
        });
    }

    // 重新查一遍，返回完整映射
    const rows = await prisma.productCategory.findMany({
        where: { name: { in: names } },
        select: { id: true, name: true },
    });

    const set = new Map<string, number>();
    for (const row of rows) set.set(row.name, row.id);
    return set;
}

function pickCategoriesByName(title: string): string[] {
    const hit = new Set<string>();
    for (const rule of CATEGORY_RULES) {
        if (rule.keywords.some(re => re.test(title))) hit.add(rule.name);
    }
    // 最少加一个“Hot”兜底，便于前台有东西可展示
    if (hit.size === 0) hit.add('Hot');
    return [...hit];
}

// ============ JSON 扁平化读取 ============
// 支持 3 种来源：TREASURES_INLINE(字符串) -> 文件 -> 报错
async function loadRows(): Promise<any[]> {
    const inline = process.env.TREASURES_INLINE;
    if (inline && inline.trim()) {
        const json = JSON.parse(inline);
        return normalize(json);
    }

    const file =
        process.env.TREASURES_FILE ??
        path.resolve(process.cwd(), 'scripts/seed/data/treasuresList.json');

    console.log('[seed] reading:', file);
    const text = await fs.readFile(file, 'utf8');
    const json = JSON.parse(text);
    return normalize(json);
}

// 兼容：数组 / {data[]} / {data[].treasure_resp[]} / {list[]} / {treasures[]}
function normalize(json: any): any[] {
    if (Array.isArray(json)) return json;

    if (Array.isArray(json?.treasure_resp)) return json.treasure_resp;

    if (Array.isArray(json?.data)) {
        const blocks = json.data;
        if (blocks.length && Array.isArray(blocks[0]?.treasure_resp)) {
            // 扁平化：把外层块的 act_id/img_style_type 挂到每个宝贝上
            return blocks.flatMap((b: any) =>
                (b.treasure_resp ?? []).map((t: any) => ({
                    ...t,
                    act_id: b.act_id,
                    block_img_style_type: b.img_style_type,
                })),
            );
        }
        return blocks;
    }

    if (Array.isArray(json?.list)) return json.list;
    if (Array.isArray(json?.treasures)) return json.treasures;

    const keys = typeof json === 'object' ? Object.keys(json) : ['<non-object>'];
    throw new Error(`[seed] JSON must be an array. Got keys: ${keys.join(', ')}`);
}

// ============ 行映射（Raw -> Prisma.TreasureCreateInput） ============
function mapOne(r: any, i: number): Prisma.TreasureCreateInput {
    const rawId = coalesce<number | string>(r.treasure_id, r.id, r.seq) ?? `AUTO-${Date.now()}-${i}`;
    const id = String(rawId);

    const name = coalesce<string>(r.treasure_name, r.treasureName, r.product_name, r.productName);
    must(name, `Row#${i} 缺少 treasure_name/treasureName`);

    const buyRate = r.buy_quantity_rate != null ? Number(r.buy_quantity_rate) : undefined;

    return {
        id,
        treasureSeq: coalesce<string>(r.treasure_seq, r.treasureSeq) ?? `SEQ-${id}`,
        treasureName: name!,
        productName: coalesce<string>(r.product_name, r.productName) ?? null,
        treasureCoverImg: coalesce<string>(r.treasure_cover_img, r.cover, r.image) ?? null,
        mainImageList: r.main_image_list ?? r.mainImageList ?? null,

        costAmount: toNumber(r.cost_amount ?? r.costAmount) ?? null,
        unitAmount: toNumber(r.unit_amount ?? r.unitAmount) ?? 1,
        cashAmount: toNumber(r.cash_amount ?? r.cashAmount) ?? null,

        seqShelvesQuantity: toNumber(r.seq_shelves_quantity ?? r.seqShelvesQuantity) ?? null,
        seqBuyQuantity: toNumber(r.seq_buy_quantity ?? r.seqBuyQuantity) ?? 0,
        minBuyQuantity: toNumber(r.min_buy_quantity ?? r.minBuyQuantity) ?? null,
        maxPerBuyQuantity: toNumber(r.max_per_buy_quantity ?? r.maxPerBuyQuantity) ?? null,
        buyQuantityRate: buyRate ?? null,

        lotteryMode: toNumber(r.lottery_mode ?? r.lotteryMode) ?? null,     // 1=售罄 2=定时
        lotteryTime: toDate(r.lottery_time ?? r.lotteryTime),
        lotteryDelayTime: toDate(r.lottery_delay_time ?? r.lotteryDelayTime),
        lotteryDelayState: toNumber(r.lottery_delay_state ?? r.lotteryDelayState) ?? 0,

        imgStyleType: toNumber(r.img_style_type ?? r.imgStyleType) ?? 0,
        virtual: toNumber(r.virtual) ?? 2,

        groupMaxNum: toNumber(r.group_max_num ?? r.groupMaxNum) ?? 9999,

        maxUnitCoins: toNumber(r.max_unit_coins ?? r.maxUnitCoins) ?? null,
        maxUnitAmount: toNumber(r.max_unit_amount ?? r.maxUnitAmount) ?? null,

        charityAmount: toNumber(r.charity_amount ?? r.charityAmount) ?? null,
        cashState: toNumber(r.cash_state ?? r.cashState) ?? null,
        ruleContent: r.rule_content ?? r.ruleContent ?? null,
        desc: r.desc ?? r.description ?? null,
        state: 1,
    };
}

// ============ 主流程 ============
async function main() {
    const DRY = process.env.DRY_RUN === '1';
    const rows = await loadRows();
    console.log('[seed] total treasures:', rows.length);

    // 1) 分类准备
    const allCatNames = [...new Set(CATEGORY_RULES.map(r => r.name))];
    const catsMap = await ensureCategories(allCatNames); // name -> id

    // 2) 批处理
    let ok = 0, fail = 0;
    const joinPairs: Array<{ treasureId: string; categoryId: number }> = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
            const data = mapOne(r, i);
            const { id: tid, ...updateData } = data; // update 不要改主键
            const catNames = pickCategoriesByName(data.treasureName);
            const catIds = catNames.map(n => catsMap.get(n)).filter(Boolean) as number[];

            if (DRY) {
                console.log(`[dry] upsert treasure id=${tid}, name="${data.treasureName}", cats=${catNames.join(',')}`);
            } else {
                await prisma.treasure.upsert({
                    where: { id: tid },
                    update: updateData,
                    create: data,
                });
            }

            // 记录 join
            for (const cid of catIds) joinPairs.push({ treasureId: data.id!, categoryId: cid });
            ok++;
        } catch (e: any) {
            fail++;
            const ctx = {
                i,
                sample: {
                    treasure_id: rows[i]?.treasure_id,
                    treasure_seq: rows[i]?.treasure_seq,
                    treasure_name: rows[i]?.treasure_name,
                },
            };
            console.error(`[seed] row#${i} failed: ${e?.message ?? e}`, ctx);
        }
    }

    // 3) 写 join 表（去重 + 批量）
    if (!DRY && joinPairs.length) {
        // 去重
        const uniq = new Map<string, { treasureId: string; categoryId: number }>();
        for (const p of joinPairs) uniq.set(`${p.treasureId}::${p.categoryId}`, p);
        const data = [...uniq.values()];
        await prisma.treasureCategory.createMany({
            data,
            skipDuplicates: true,
        });
    }

    console.log(`seed done. ok=${ok}, fail=${fail}, joins=${joinPairs.length} ${DRY ? '(dry-run)' : ''}`);
}

// ============ 入口 ============
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });