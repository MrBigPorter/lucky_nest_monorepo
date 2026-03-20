import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Load env files when running scripts from host machine.
 *
 * In Docker, DATABASE_URL is already injected and this becomes a no-op.
 * On host, it also rewrites db host to localhost so Prisma can reach Postgres.
 */
export function loadEnvForHost(): void {
  if (process.env.DATABASE_URL) return;

  const searchRoots = [
    process.cwd(),
    resolve(process.cwd(), '../..'),
    resolve(process.cwd(), '../../..'),
  ];

  for (const root of searchRoots) {
    for (const name of ['deploy/.env.dev', 'deploy/.env', '.env']) {
      const envPath = resolve(root, name);
      if (!existsSync(envPath)) continue;

      for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) process.env[key] = val;
      }

      if (process.env.DATABASE_URL?.includes('@db:')) {
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
          '@db:',
          '@localhost:',
        );
        console.log(`\n  ℹ️  已加载: ${envPath}`);
        console.log('  ℹ️  DB host: db -> localhost (宿主机直接运行)\n');
      }
      return;
    }
  }
}
