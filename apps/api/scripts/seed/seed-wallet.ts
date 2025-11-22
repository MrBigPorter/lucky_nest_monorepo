// apps/api/scripts/seed/seed-wallet.ts
import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'node:crypto';

const db = new PrismaClient();
const D = (n: number | string) => new Prisma.Decimal(n);

// 简单生成交易号
function genTxnNo(prefix: string) {
    const now = new Date();
    const ts = now
        .toISOString()
        .replace(/[-:.TZ]/g, '')
        .slice(0, 14); // yyyyMMddHHmmss
    const rand = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
    return `${prefix}${ts}${rand}`;
}

export async function seedTestUserWallet() {
    // 测试手机号，可以按你 H5 那一套来
    const phone = '9451297266';
    const countryCode = '63'; // 你现在默认菲律宾
    const phoneMd5 = crypto.createHash('md5').update(phone).digest('hex');

    // 1) 先确保有一个 User
    let user = await db.user.findUnique({
        where: { phone },
    });

    if (!user) {
        user = await db.user.create({
            data: {
                phone,
                phoneMd5,
                nickname: 'Test Lucky User',
                avatar:
                    'https://picsum.photos/seed/lucky-test-user/200/200', // 随便一张头像
                vipLevel: 0,
                kycStatus: 0,
            },
        });
        console.log(`✅ Created test user: ${user.id} (${phone})`);
    } else {
        console.log(`ℹ️ Test user already exists: ${user.id} (${phone})`);
    }

    // 2) 准备一个「目标余额」
    const targetCash = D(5000);   // 5000 PHP 现金
    const targetCoins = D(20000); // 20000 coins

    // 3) upsert 钱包
    let wallet = await db.userWallet.findUnique({
        where: { userId: user.id },
    });

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
        console.log(`✅ Created wallet for user: ${user.id}`);
    } else {
        wallet = await db.userWallet.update({
            where: { userId: user.id },
            data: {
                realBalance: targetCash,
                coinBalance: targetCoins,
                // 累加一下充值总额，也可以直接覆盖，看你需求
                totalRecharge: targetCash,
            },
        });
        console.log(`✅ Updated wallet for user: ${user.id}`);
    }

    // 4) 插入两条钱包流水（如果你不想重复插，可以先清理同用户同类型的测试流水）
    //    这里用 transactionNo 唯一，反复跑会多几条没关系（纯测试环境）
    const cashTxnNo = genTxnNo('RC'); // Recharge Cash
    const coinTxnNo = genTxnNo('CC'); // Coin Credit

    const now = new Date();

    // 现金充值流水：balanceType = 1（现金），transactionType = 1（充值）
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
            remark: `Seed script at ${now.toISOString()}`,
            status: 1,
        },
    });

    // 金币发放流水：balanceType = 2（金⽐），transactionType = 4（奖励）
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
            remark: `Seed script at ${now.toISOString()}`,
            status: 1,
        },
    });

    console.log(
        `✅ Seeded wallet balance for ${phone}: cash=${targetCash.toString()}, coins=${targetCoins.toString()}`,
    );
}