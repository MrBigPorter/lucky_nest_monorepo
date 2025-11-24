// apps/api/scripts/seed/seed-wallet.ts
import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'node:crypto';

const db = new PrismaClient();
const D = (n: number | string) => new Prisma.Decimal(n);

// 简单生成交易号
function genTxnNo(prefix: string) {
    const now = new Date();
    const ts = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14); // yyyyMMddHHmmss
    const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}${ts}${rand}`;
}

// 可选：给一些不同的余额，显得更“自然”
function pickTarget() {
    // 现金: 3k~12k，金币: 10k~60k（按需改）
    const cash = 3000 + Math.floor(Math.random() * 9000);
    const coins = 10000 + Math.floor(Math.random() * 50000);
    return { cash: D(cash), coins: D(coins) };
}

async function ensureRichWalletByPhone(phone: string) {
    const phoneMd5 = crypto.createHash('md5').update(phone).digest('hex');

    // 1) 确保 User 存在
    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
        user = await db.user.create({
            data: {
                phone,
                phoneMd5,
                nickname: `Tester ${phone.slice(-4)}`,
                avatar: `https://picsum.photos/seed/lucky-${phone}/200/200`,
                vipLevel: 0,
                kycStatus: 0,
            },
        });
        console.log(`✅ Created test user: ${user.id} (${phone})`);
    } else {
        console.log(`ℹ️ Test user exists: ${user.id} (${phone})`);
    }

    // 2) 目标余额
    const target = pickTarget(); // { cash, coins }
    const targetCash = target.cash;
    const targetCoins = target.coins;

    // 3) upsert 钱包
    let wallet = await db.userWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
        wallet = await db.userWallet.create({
            data: {
                userId: user.id,
                realBalance: targetCash,
                coinBalance: targetCoins,
                frozenBalance: D(0),
                totalRecharge: targetCash,
                totalWithdraw: D(0),
            },
        });
        console.log(`✅ Created wallet for user: ${user.id} cash=${targetCash} coins=${targetCoins}`);
    } else {
        wallet = await db.userWallet.update({
            where: { userId: user.id },
            data: {
                realBalance: targetCash,
                coinBalance: targetCoins,
                totalRecharge: targetCash, // 简单覆盖（测试环境）
            },
        });
        console.log(`✅ Updated wallet for user: ${user.id} cash=${targetCash} coins=${targetCoins}`);
    }

    // 4) 插两条钱包流水（测试环境不去查重，重复跑可接受）
    const cashTxnNo = genTxnNo('RC'); // Recharge Cash
    const coinTxnNo = genTxnNo('CC'); // Coin Credit
    const now = new Date();

    await db.walletTransaction.create({
        data: {
            transactionNo: cashTxnNo,
            userId: user.id,
            walletId: wallet.id,
            beforeBalance: D(0),
            afterBalance: targetCash,
            transactionType: 1, // 1=充值
            balanceType: 1,     // 1=现金
            amount: targetCash,
            relatedId: null,
            relatedType: 'seed_recharge',
            description: 'Seed: initial cash recharge',
            remark: `seed batch at ${now.toISOString()}`,
            status: 1,
        },
    });

    await db.walletTransaction.create({
        data: {
            transactionNo: coinTxnNo,
            userId: user.id,
            walletId: wallet.id,
            beforeBalance: D(0),
            afterBalance: targetCoins,
            transactionType: 4, // 4=奖励
            balanceType: 2,     // 2=金币
            amount: targetCoins,
            relatedId: null,
            relatedType: 'seed_bonus',
            description: 'Seed: initial coin bonus',
            remark: `seed batch at ${now.toISOString()}`,
            status: 1,
        },
    });
}

// 生成 N 个“有钱钱包”
// basePrefix 用于手机号前缀（菲律宾本地 10 位样例），你也可以换成你 H5 的测试号段
export async function seedRichWallets(count = 10, basePrefix = '9451') {
    // 确保顺序执行，避免同时大量连接（也可以 Promise.all，但注意连接池）
    for (let i = 0; i < count; i++) {
        const suffix = (100000 + i).toString(); // 保证不短
        const phone = `${basePrefix}${suffix}`.slice(0, 10); // 保证 10 位
        await ensureRichWalletByPhone(phone);
    }
    console.log(`🎉 Done. Seeded ${count} rich wallets.`);
}

// 保留单个测试用户的老方法（需要可以继续用）
export async function seedTestUserWallet() {
    await ensureRichWalletByPhone('9451297268');
}

// 直接运行该文件：node/ts-node 执行
if (require.main === module) {
    seedRichWallets(10)
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await db.$disconnect();
        });
}