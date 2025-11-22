// apps/api/scripts/seed/index.ts
import { seedSystemConfigExchangeRate } from './system-config-exchange-rate';
import { seedProductCategories } from './product-category-list';
import { seedTreasures } from './seed-treasures';
import { seedBanners } from './seed-banners';
import { seedAdvertisements } from './seed-ads';
import { seedActSections } from './seed-sections';
import { seedTestUserWallet } from './seed-wallet';

async function main() {
    await seedSystemConfigExchangeRate();
    await seedProductCategories();
    await seedTreasures();
    await seedBanners();
    await seedAdvertisements();
    await seedActSections();
     await seedTestUserWallet();
}

main()
    .then(() => {
        console.log('✅ All seed finished');
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });