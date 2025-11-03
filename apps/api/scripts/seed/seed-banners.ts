// apps/api/scripts/seed/seed-banners.js
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();


const now = new Date();
const in7d = new Date(Date.now() + 7 * 24 * 3600 * 1000);

// 注意：schema 是 gridId，不是 carouselId
const data = [
    // ===== Home / Top / Carousel #1 =====
    {
        id: 'bn_home_top_1',
        title: 'Home Top · Slide 1',
        bannerCate: 1, position: 0, showType: 2,
        gridId: 'home-top-1', sortOrder: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky1/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_home_top_2',
        title: 'Home Top · Slide 2',
        bannerCate: 1, position: 0, showType: 2,
        gridId: 'home-top-1', sortOrder: 2,
        bannerImgUrl: 'https://picsum.photos/seed/lucky2/1200/500',
        fileType: 1, jumpCate: 3, relatedTitleId: '1701',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_home_top_3',
        title: 'Home Top · Slide 3',
        bannerCate: 1, position: 0, showType: 2,
        gridId: 'home-top-1', sortOrder: 3,
        bannerImgUrl: 'https://picsum.photos/seed/lucky3/1200/500',
        fileType: 1, jumpCate: 2, jumpUrl: '/promo/123',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Home / Top / Carousel #2 =====
    {
        id: 'bn_home_top2_1',
        title: 'Home Top · Group 2 · Slide 1',
        bannerCate: 1, position: 0, showType: 2,
        gridId: 'home-top-2', sortOrder: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky4/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com/deals',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_home_top2_2',
        title: 'Home Top · Group 2 · Slide 2',
        bannerCate: 1, position: 0, showType: 2,
        gridId: 'home-top-2', sortOrder: 2,
        bannerImgUrl: 'https://picsum.photos/seed/lucky5/1200/500',
        fileType: 1, jumpCate: 3, relatedTitleId: '1684',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Home / Middle / Single =====
    {
        id: 'bn_home_mid_single_1',
        title: 'Home Middle · Single',
        bannerCate: 1, position: 1, showType: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky6/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com/signup-bonus',
        imgStyleType: 0,
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Home / Bottom / Carousel =====
    {
        id: 'bn_home_bottom_1',
        title: 'Home Bottom · Slide 1',
        bannerCate: 1, position: 2, showType: 2,
        gridId: 'home-bottom-1', sortOrder: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky7/1200/500',
        fileType: 1, jumpCate: 2, jumpUrl: '/invite',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_home_bottom_2',
        title: 'Home Bottom · Slide 2',
        bannerCate: 1, position: 2, showType: 2,
        gridId: 'home-bottom-1', sortOrder: 2,
        bannerImgUrl: 'https://picsum.photos/seed/lucky8/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com/app',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_home_bottom_3',
        title: 'Home Bottom · Slide 3',
        bannerCate: 1, position: 2, showType: 2,
        gridId: 'home-bottom-1', sortOrder: 3,
        bannerImgUrl: 'https://picsum.photos/seed/lucky9/1200/500',
        fileType: 1, jumpCate: 3, relatedTitleId: '646',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Activity / Top / Carousel =====
    {
        id: 'bn_act_top_1',
        title: 'Activity Top · Slide 1',
        bannerCate: 2, position: 0, showType: 2,
        gridId: 'act-top-1', sortOrder: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky10/1200/500',
        fileType: 1, jumpCate: 2, jumpUrl: '/events/black-friday',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_act_top_2',
        title: 'Activity Top · Slide 2',
        bannerCate: 2, position: 0, showType: 2,
        gridId: 'act-top-1', sortOrder: 2,
        bannerImgUrl: 'https://picsum.photos/seed/lucky11/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com/event-rules',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_act_top_3',
        title: 'Activity Top · Slide 3',
        bannerCate: 2, position: 0, showType: 2,
        gridId: 'act-top-1', sortOrder: 3,
        bannerImgUrl: 'https://picsum.photos/seed/lucky12/1200/500',
        fileType: 1, jumpCate: 3, relatedTitleId: '647',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Activity / Middle / Single =====
    {
        id: 'bn_act_mid_single_1',
        title: 'Activity Middle · Single',
        bannerCate: 2, position: 1, showType: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky13/1200/500',
        fileType: 1, jumpCate: 2, jumpUrl: '/events/refer-and-earn',
        imgStyleType: 1,
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Product / Top / Carousel =====
    {
        id: 'bn_prod_top_1',
        title: 'Product Top · Slide 1',
        bannerCate: 3, position: 0, showType: 2,
        gridId: 'prod-top-1', sortOrder: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky14/1200/500',
        fileType: 1, jumpCate: 3, relatedTitleId: '1701',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
    {
        id: 'bn_prod_top_2',
        title: 'Product Top · Slide 2',
        bannerCate: 3, position: 0, showType: 2,
        gridId: 'prod-top-1', sortOrder: 2,
        bannerImgUrl: 'https://picsum.photos/seed/lucky15/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com/category/tech',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Product / Middle / Single =====
    {
        id: 'bn_prod_mid_single_1',
        title: 'Product Middle · Single',
        bannerCate: 3, position: 1, showType: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky16/1200/500',
        fileType: 1, jumpCate: 2, jumpUrl: '/products/hot',
        imgStyleType: 0,
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Home / Middle / Video =====
    {
        id: 'bn_home_mid_video_1',
        title: 'Home Middle · Video',
        bannerCate: 1, position: 1, showType: 1,
        fileType: 2,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        bannerImgUrl: 'https://picsum.photos/seed/lucky17/1200/500', // poster
        jumpCate: 5, jumpUrl: 'https://example.com/video-landing',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Activity / Bottom / Video =====
    {
        id: 'bn_act_bottom_video_1',
        title: 'Activity Bottom · Video',
        bannerCate: 2, position: 2, showType: 1,
        fileType: 2,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        bannerImgUrl: 'https://picsum.photos/seed/lucky18/1200/500',
        jumpCate: 2, jumpUrl: '/events/livestream',
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Home / Top / Single =====
    {
        id: 'bn_home_top_single_3',
        title: 'Home Top · Single',
        bannerCate: 1, position: 0, showType: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky19/1200/500',
        fileType: 1, jumpCate: 3, relatedTitleId: '646',
        imgStyleType: 1,
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },

    // ===== Product / Bottom / Single =====
    {
        id: 'bn_prod_bottom_single_1',
        title: 'Product Bottom · Single',
        bannerCate: 3, position: 2, showType: 1,
        bannerImgUrl: 'https://picsum.photos/seed/lucky20/1200/500',
        fileType: 1, jumpCate: 5, jumpUrl: 'https://example.com/help/delivery',
        imgStyleType: 0,
        activityAtStart: now, activityAtEnd: in7d, state: 1, validState: 1,
    },
];

async function main() {
    // 先删再插，放事务里
    await db.$transaction(async (tx) => {
        const delWhere = {};
        const del = await tx.banner.deleteMany({ where: delWhere });
        console.log('deleted banners:', del.count);

        const ins = await tx.banner.createMany({ data, skipDuplicates: true });
        console.log('inserted banners:', ins.count);
    });

    // 可选：如果你做了接口缓存，这里记得清缓存键（示例）
    // 比如 Redis 用 key: "banners:cate:*"
    // await clearBannerCache();
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => db.$disconnect());