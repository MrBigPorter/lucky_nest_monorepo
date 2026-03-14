// apps/api/scripts/seed/seed-admin-user.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const db = new PrismaClient();

/**
 * 确保超级管理员存在
 * 模仿 ensureRichWalletByPhone 的逻辑：先查、后增/改
 */
async function ensureSuperAdmin(username: string, plainPassword: string) {
  console.log(`ℹ️ Checking admin user: ${username}`);

  // 1. 加密密码 (生产环境必须哈希)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  // 2. 执行 Upsert 操作
  const admin = await db.adminUser.upsert({
    where: { username },
    update: {
      password: hashedPassword, // 允许运行脚本重置密码
      updatedAt: new Date(),
    },
    create: {
      id: 'admin_init_001', // 对应你的 schema.prisma id 字段
      username: username,
      password: hashedPassword,
      realName: '超级管理员',
      role: 'super_admin', // 权限标识
      status: 1, // 1=启用
    },
  });

  console.log(`✅ Admin user ${username} is ready. (ID: ${admin.id})`);
}

/**
 * 主入口函数：模仿 seedRichWallets 的导出风格
 */
export async function seedInitialAdmins() {
  // 你可以在这里定义多个初始账号
  const defaultAdmins = [
    {
      user: process.env.ADMIN_SEED_USERNAME ?? 'admin',
      pass: process.env.ADMIN_SEED_PASSWORD ?? 'change_me_on_first_login',
    },
  ];

  for (const item of defaultAdmins) {
    await ensureSuperAdmin(item.user, item.pass);
  }

  console.log('🎉 Admin seeding completed.');
}

// 支持直接运行：node/tsx 执行
if (require.main === module) {
  seedInitialAdmins()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
