// apps/api/scripts/seed/seed-ads.cjs
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const PREFIX = process.env.PREFIX || 'ad_';  // 只删本前缀，避免误删历史
const now = new Date();
const in30d = new Date(Date.now() + 30 * 24 * 3600 * 1000);

// 占位图工具
const pic = (seed, w = 1200, h = 400) =>
    `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}`;

// ① 单图广告：跳产品列表（分类=0）
const singleAd = {
    id: 'ad_home_top',
    title: 'Home Top Ad',
    adPosition: 1,            // 首页顶部
    fileType: 1,              // 图片
    img: pic('ad1'),
    imgStyleType: 0,
    sortType: 1,              // 单图
    // 内页跳转
    jumpCate: 2,
    jumpUrl: '/products?category_id=0',
    relatedId: null,
    startTime: now,
    endTime: in30d,
    status: 1,
    sortOrder: 2,
};

// ② 三图广告：三张分别去 登录、产品详情、邀请
const gridAd = {
    id: 'ad_home_grid_1',
    title: 'New Member Promo',
    adPosition: 1,
    fileType: 1,
    imgStyleType: 0,
    sortType: 2,              // 三图栅格
    img: '',
    bannerArray: [
        {
            id: 258,
            title: '新会员活动 A',
            img: pic('ad4', 600, 600),
            img_style_type: 0,
            // 内页：登录
            jump_cate: 2,
            jump_url: '/signin',
            related_title_id: null,
            show_type: 1,
            file_type: 1,
        },
        {
            id: 259,
            title: '热卖详情',
            img: pic('ad5', 600, 600),
            img_style_type: 0,
            // 产品详情：3 + related_title_id
            jump_cate: 3,
            jump_url: '',
            related_title_id: '1701',
            show_type: 1,
            file_type: 1,
        },
        {
            id: 260,
            title: '邀请好友',
            img: pic('ad6', 600, 600),
            img_style_type: 0,
            jump_cate: 2,
            jump_url: '/invite',
            related_title_id: null,
            show_type: 1,
            file_type: 1,
        },
    ],
    startTime: now,
    endTime: in30d,
    status: 1,
    sortOrder: 18,
};

async function main() {
    await db.$transaction(async (tx) => {
        const del = await tx.advertisement.deleteMany({
            where: { id: { startsWith: PREFIX } },
        });
        console.log('deleted ads:', del.count);

        const ins = await tx.advertisement.createMany({
            data: [singleAd, gridAd],
            skipDuplicates: true,
        });
        console.log('inserted ads:', ins.count);
    });

    const total = await db.advertisement.count();
    console.log('ads total =', total);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => db.$disconnect());