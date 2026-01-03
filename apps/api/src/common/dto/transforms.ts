import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsPhoneNumber, ValidationOptions } from 'class-validator';
import Decimal from 'decimal.js';
import parsePhoneNumberFromString from 'libphonenumber-js';

// ==========================================
//   基础工具函数 (Internal Helpers)
// ==========================================

/** 判断值是否为空 (undefined, null, 空字符串, 纯空格) */
const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** 安全转 Number */
const safeNumber = (v: unknown): number | undefined => {
  if (isEmpty(v)) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** 安全转 Int */
const safeInt = (v: unknown): number | undefined => {
  const n = safeNumber(v);
  if (n === undefined) return undefined;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : undefined;
};

/** 安全转 Decimal string */
const safeDecimalToFixedString = (
  value: unknown,
  fractionDigits: number,
  defaultValue: string,
): string => {
  if (isEmpty(value)) return defaultValue;

  try {
    // Prisma.Decimal / Decimal.js 实例大多有 toFixed
    if (typeof value === 'object' && value !== null && 'toFixed' in value) {
      return (value as any).toFixed(fractionDigits);
    }

    // string / number
    const d = new Decimal(value as any);
    return d.toFixed(fractionDigits);
  } catch {
    return defaultValue;
  }
};

// ==========================================
//  Input DTO 专用 (Query / Body -> DTO)
//    原则: 宽容处理，清洗数据，用于接收前端参数
//    配置: { toClassOnly: true } 确保只在接收数据时运行
// ==========================================

/** 数字转换：'1' -> 1, '1.5' -> 1.5, '' -> undefined */
export function ToNumber() {
  return applyDecorators(
    Transform(({ value }) => safeNumber(value), { toClassOnly: true }),
  );
}

/** 整数转换 */
export function ToInt() {
  return applyDecorators(
    Transform(({ value }) => safeInt(value), { toClassOnly: true }),
  );
}

/** 浮点转换 */
export function ToFloat() {
  return ToNumber();
}

/** 布尔转换：支持 'true', 'on', '1', 'yes' 等宽松输入 */
export function ToBool() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        if (typeof value === 'boolean') return value;

        if (typeof value === 'number') {
          if (value === 1) return true;
          if (value === 0) return false;
          return undefined;
        }

        const v = String(value).trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(v)) return true;
        if (['false', '0', 'no', 'off'].includes(v)) return false;
        return undefined;
      },
      { toClassOnly: true },
    ),
  );
}

/**
 * 将空字符串 ''、纯空格 '   ' 或字符串 'null' 转换为真正的 null
 * 用于 DTO 清洗（例如 unique 字段）
 */
export function ToNull() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'string') {
          const v = value.trim();
          if (v === '' || v.toLowerCase() === 'null') return null;
        }
        return value;
      },
      { toClassOnly: true },
    ),
  );
}

/** 字符串清洗：去除首尾空格，空字符串转 undefined */
export function ToTrimmedString() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        const s = String(value).trim();
        return s.length > 0 ? s : undefined;
      },
      { toClassOnly: true },
    ),
  );
}

/** 转小写 + Trim (Email, Username) */
export function ToLowerCase() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        return String(value).trim().toLowerCase();
      },
      { toClassOnly: true },
    ),
  );
}

/** 转大写 + Trim (Codes, Currencies) */
export function ToUpperCase() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        return String(value).trim().toUpperCase();
      },
      { toClassOnly: true },
    ),
  );
}

/** 手机号清洗：只保留数字 */
export function ToPurePhone() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        return String(value).replace(/\D/g, '');
      },
      { toClassOnly: true },
    ),
  );
}

/** 整数数组：?ids=1,1,a,2 -> [1,2] (去重+过滤) */
export function ToIntArray(opts: { delimiter?: string } = {}) {
  const { delimiter = ',' } = opts;
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;

        const arr = Array.isArray(value)
          ? value
          : String(value).split(delimiter);

        const nums = arr
          .map((v) => safeInt(v))
          .filter((n): n is number => typeof n === 'number');

        return Array.from(new Set(nums));
      },
      { toClassOnly: true },
    ),
  );
}

/** 日期字符串 -> Date 对象 */
export function ToDate() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        const d = new Date(value as any);
        return isNaN(d.getTime()) ? undefined : d;
      },
      { toClassOnly: true },
    ),
  );
}

/** JSON 字符串 -> 对象 */
export function ToJsonObject() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        if (isEmpty(value)) return undefined;
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(String(value));
        } catch {
          return undefined;
        }
      },
      { toClassOnly: true },
    ),
  );
}

// ==========================================
//  Output DTO 专用 (DB/Plain -> Response DTO)
//    原则: 绝对安全，处理 Prisma Decimal/BigInt，格式化输出
//    注意：你们当前用 plainToInstance 输出，所以 Transform 默认即可（不要 toPlainOnly）
// ==========================================

/**
 * Decimal / Number / String -> String (保留小数位，永不炸)
 */
export function DecimalToString(
  fractionDigits: number = 2,
  defaultValue: string = '0.00',
) {
  return applyDecorators(
    // 提示 class-transformer：目标是 string
    Type(() => String),
    Transform(({ value }) => {
      return safeDecimalToFixedString(value, fractionDigits, defaultValue);
    }),
  );
}

/** Decimal / String / Number -> Number (注意精度风险) */
export function DecimalToNumber(defaultValue: number | null = 0) {
  return applyDecorators(
    Type(() => Number),
    Transform(({ value }) => {
      if (isEmpty(value)) return defaultValue;

      // Prisma.Decimal / Decimal.js 实例
      if (typeof value === 'object' && value !== null && 'toNumber' in value) {
        try {
          return (value as any).toNumber();
        } catch {
          return defaultValue;
        }
      }

      const n = Number(value);
      return Number.isFinite(n) ? n : defaultValue;
    }),
  );
}

/** BigInt -> String (解决 JSON 序列化崩溃) */
export function BigIntToString() {
  return applyDecorators(
    Type(() => String),
    Transform(({ value }) => {
      if (value === null || value === undefined) return null;
      return String(value);
    }),
  );
}

/**
 * 强力转换：任意格式 (Date | string | number) -> Timestamp (毫秒 number)
 * 无效日期返回 null（不会 NaN）
 */
export function DateToTimestamp() {
  return applyDecorators(
    Type(() => Date),
    Transform(({ value }) => {
      if (value === null || value === undefined) return null;

      if (value instanceof Date) {
        const t = value.getTime();
        return Number.isFinite(t) ? t : null;
      }

      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }

      if (typeof value === 'string') {
        const d = new Date(value);
        const t = d.getTime();
        return Number.isFinite(t) ? t : null;
      }

      return null;
    }),
  );
}

/** 字符串脱敏 (手机号/邮箱/卡号) */
export function MaskString(
  type: 'phone' | 'email' | 'idcard' | 'bankcard' = 'phone',
) {
  return applyDecorators(
    Type(() => String),
    Transform(({ value }) => {
      if (isEmpty(value)) return null;
      const str = String(value);

      if (type === 'phone' && str.length >= 7) {
        return str.replace(/(\d{3})\d{3,4}(\d{4})/, '$1****$2');
      }

      if (type === 'email' && str.includes('@')) {
        const [name, domain] = str.split('@');
        if (name.length <= 2) return `${name}***@${domain}`;
        return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
      }

      if (type === 'bankcard' && str.length > 8) {
        const prefix = str.slice(0, 4);
        const suffix = str.slice(-4);
        const maskLength = str.length - 8;
        return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
      }

      if (type === 'idcard') {
        return str.replace(/^(\d{6})\d{8}(\w{4})$/, '$1********$2');
      }

      return str;
    }),
  );
}

/** URL 拼前缀 (CDN) */
export function ToUrl(prefix: string) {
  return applyDecorators(
    Type(() => String),
    Transform(({ value }) => {
      if (isEmpty(value)) return null;
      const str = String(value);

      if (str.startsWith('http://') || str.startsWith('https://')) return str;

      const cleanPrefix = prefix.replace(/\/$/, '');
      const cleanValue = str.replace(/^\//, '');
      return `${cleanPrefix}/${cleanValue}`;
    }),
  );
}

// ==========================================
// Phone Validation (Input)
// ==========================================

export interface PhoneOptions extends ValidationOptions {
  /**
   * 是否严格限制为菲律宾号码？
   * - true (默认): 只允许 PH 号码，拒绝其他国家号码
   * - false: 允许全球号码，但如果无法识别国家，优先尝试解析为 PH
   */
  strictPH?: boolean;
}

export function IsSmartPhone(options?: PhoneOptions) {
  const { strictPH = true, ...validationOptions } = options || {};

  return applyDecorators(
    // ✅ 只在入参时清洗
    Transform(
      ({ value }) => {
        if (typeof value !== 'string') return value;

        const phoneNumber = parsePhoneNumberFromString(value, 'PH');

        if (phoneNumber && phoneNumber.isValid()) {
          if (strictPH && phoneNumber.country !== 'PH') {
            return value;
          }

          // 严格检查：必须是移动电话
          const t = phoneNumber.getType();
          if (t !== 'MOBILE' && t !== 'FIXED_LINE_OR_MOBILE') {
            return value;
          }

          return phoneNumber.number; // E.164
        }

        return value;
      },
      { toClassOnly: true },
    ),

    IsPhoneNumber(strictPH ? 'PH' : undefined, {
      message: strictPH
        ? 'Invalid Philippines phone number format'
        : 'Invalid phone number format',
      ...validationOptions,
    }),
  );
}
