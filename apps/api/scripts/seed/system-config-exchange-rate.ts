import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 10 = 10 coins = ₱1
    const key = 'exchange_rate';
    const value = '10';

    const cfg = await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    });

    console.log('✅ system_configs upserted:', cfg);
}

main()
    .catch((e) => {
        console.error('❌ seed system_configs error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });