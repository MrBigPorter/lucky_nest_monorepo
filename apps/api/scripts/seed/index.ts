import { seedSystemConfigExchangeRate } from './system-config-exchange-rate';
import { seedProductCategories } from './product-category-list';
import { seedTreasures } from './seed-treasures';
import { seedBanners } from './seed-banners';
import { seedAdvertisements } from './seed-ads';
import { seedActSections } from './seed-sections';
import { seedFlashSale } from './seed-flash-sale';
import { seedCoupons } from './seed-coupons';
import { seedTestUserWallet } from './seed-wallet';
import { seedGroups } from './seed-groups';

async function main() {
  console.log('\n🌱  JoyMinis Demo Seed ─────────────────────────');
  console.log(`    ${new Date().toISOString()}\n`);

  // [1] 基础配置
  await seedSystemConfigExchangeRate();

  // [2] 产品分类（需在产品前执行，供 seedTreasures 内部查 id）
  await seedProductCategories();

  // [3] 抽奖产品 + 产品-分类关联（依赖分类）
  await seedTreasures();

  // [4] 活动专区 + 关联商品（依赖产品）
  await seedActSections();

  // [5] 首页 / 活动页 Banner
  await seedBanners();

  // [6] 广告位
  await seedAdvertisements();

  // [7] 秒杀场次 + 秒杀商品（依赖产品）
  await seedFlashSale();

  // [8] 优惠券模板
  await seedCoupons();

  // [9] 测试用户 + 钱包（本地开发用）
  await seedTestUserWallet();

  // [10] 拼团演示数据（依赖产品 + 测试用户）
  await seedGroups();

  console.log('\n✨  Seed 完成！\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌  Seed 失败:', e);
    process.exit(1);
  });
