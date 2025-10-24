import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const IN  = path.resolve(process.env.ERROR_CODES_YAML ?? 'config/error-codes.yaml');
const OUT = path.resolve(process.env.ERROR_CODES_TS   ?? 'src/common/error-codes.gen.ts');

if (!fs.existsSync(IN)) {
    console.error(`[gen] YAML not found: ${IN}`);
    process.exit(1);
}

const list = yaml.load(fs.readFileSync(IN, 'utf8'));
if (!Array.isArray(list)) {
    console.error('[gen] YAML must be an array');
    process.exit(1);
}

const toKey = (s) => {
    if (!s || typeof s !== 'string') return null;
    return s
        .normalize('NFKD')
        .replace(/[^\w]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
};

const usedKeyToCode = new Map(); // key -> code（用于冲突检测）

const ensureUniqueKey = (baseKey, code, explicit) => {
    let k = baseKey;
    if (usedKeyToCode.has(k)) {
        const prev = usedKeyToCode.get(k);
        if (prev === code) return k; // 同一 code 重复行，允许
        // 显式 key 冲突 -> 强制人工处理
        if (explicit) {
            throw new Error(
                `[gen] duplicated explicit key "${k}" for different codes: ${prev} vs ${code}. ` +
                `Please change one "key" in YAML.`,
            );
        }
        // 自动派生 key 冲突 -> 自动加后缀
        k = `${baseKey}_${code}`;
        // 再次极端防御（理论上不会再冲突）
        if (usedKeyToCode.has(k) && usedKeyToCode.get(k) !== code) {
            k = `${baseKey}_${code}_DUP`;
        }
    }
    usedKeyToCode.set(k, code);
    return k;
};

let items = [];
for (let i = 0; i < list.length; i++) {
    const it = list[i] ?? {};
    const codeNum = Number((it.code ?? '').toString());
    if (!Number.isInteger(codeNum)) {
        console.error(`[gen] invalid code @${i}: ${it.code}`);
        process.exit(1);
    }

    const explicitKey = typeof it.key === 'string' && it.key.trim().length > 0;
    let key = explicitKey ? it.key.trim() : (toKey(it.message) || `CODE_${codeNum}`);

    // TS 标识符检查
    if (!/^[$A-Z_][0-9A-Z_$]*$/.test(key)) key = `CODE_${key}`;

    key = ensureUniqueKey(key, codeNum, explicitKey);

    items.push({ code: codeNum, key });
}

// 按 code 去重（若 YAML 里同一 code 多行，仅取首次）
const uniqByCode = new Map();
for (const it of items) if (!uniqByCode.has(it.code)) uniqByCode.set(it.code, it);
items = [...uniqByCode.values()];

const out = [
    '// *** AUTO-GENERATED. DO NOT EDIT. ***',
    'export const CODE = {',
    ...items.map(({ key, code }) => `  ${key}: ${code},`),
    '} as const;',
    '',
    'export type CodeKey = keyof typeof CODE;',
    'export type CodeValue = (typeof CODE)[CodeKey];',
    'export const codeOf = (k: CodeKey): CodeValue => CODE[k];',
    'export const isCodeKey = (v: string): v is CodeKey => v in CODE;',
    '',
].join('\n');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out + '\n', 'utf8');
console.log(`[gen] Wrote ${OUT} with ${items.length} codes.`);