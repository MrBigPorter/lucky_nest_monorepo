import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { Decimal } from 'decimal.js';

// ==========================================
//   基础工具函数 (Internal Helpers)
// ==========================================

/** 判断值是否为空 (undefined, null, 空字符串) */
const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// ==========================================
//  Input DTO 专用 (Query / Body -> DTO)
//    原则: 宽容处理，清洗数据，用于接收前端参数
//    配置: { toClassOnly: true } 确保只在接收数据时运行
// ==========================================

/** 数字转换：'1' -> 1, '1.5' -> 1.5, '' -> undefined */
export function ToNumber() {
  return applyDecorators(
    Transform(({ value }) => (isEmpty(value) ? undefined : Number(value)), {
      toClassOnly: true,
    }),
  );
}

export function ToInt() {
  return ToNumber();
}

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
 * 用于 DTO 清洗，特别是 Unique 字段
 */
export function ToNull() {
  return applyDecorators(
    Transform(
      ({ value }) => {
        // 1. 如果本来就是 null 或 undefined，统一返回 null (或者保持原样，视业务需求定)
        if (value === undefined || value === null) {
          return null;
        }

        // 2. 如果是字符串，进行清洗
        if (typeof value === 'string') {
          const v = value.trim();
          // 如果是空字符串，或者是字符串 "null" (忽略大小写)
          if (v === '' || v.toLowerCase() === 'null') {
            return null;
          }
        }

        // 3. 其他情况保持原值 (比如传的是数字或其他有效值)
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
      ({ value }) =>
        isEmpty(value) ? undefined : String(value).trim().toLowerCase(),
      { toClassOnly: true },
    ),
  );
}

/** 转大写 + Trim (Codes, Currencies) */
export function ToUpperCase() {
  return applyDecorators(
    Transform(
      ({ value }) =>
        isEmpty(value) ? undefined : String(value).trim().toUpperCase(),
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
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n) && Number.isInteger(n));
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
        const d = new Date(value);
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
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      },
      { toClassOnly: true },
    ),
  );
}

// ==========================================
//  Output DTO 专用 (DTO -> Response)
//    原则: 绝对安全，处理 Prisma Decimal/BigInt，格式化输出
//    注意：为了配合 plainToInstance，通常不加 { toPlainOnly: true }
// ==========================================

/**
 * Decimal / Number -> String (保留小数位)
 *  核心修复：
 * 1. 使用 @Type(() => String) 覆盖元数据，防止底层尝试 new Decimal(undefined)
 * 2. 内部 try-catch 兜底
 */
export function DecimalToString(
  fractionDigits: number = 2,
  defaultValue: string = '0.00',
) {
  return applyDecorators(
    // 关键：告诉 class-transformer 这是一个字符串，别瞎猜类型
    Type(() => String),
    Transform(({ value }) => {
      // 1) 空值拦截
      if (value === null || value === undefined) {
        return defaultValue;
      }

      try {
        // 2) Prisma Decimal 对象 (自带 toFixed)
        if (typeof value === 'object' && 'toFixed' in value) {
          return (value as any).toFixed(fractionDigits);
        }

        // 3) 普通数字或字符串 -> Decimal -> toFixed
        // 使用 new Decimal 确保精度，且它能处理 string/number
        const d = new Decimal(value);
        return d.toFixed(fractionDigits);
      } catch (error) {
        return defaultValue;
      }
    }),
  );
}

/** Decimal / String -> Number (注意精度风险) */
export function DecimalToNumber(defaultValue: number | null = 0) {
  return applyDecorators(
    Type(() => Number),
    Transform(({ value }) => {
      if (value === null || value === undefined) return defaultValue;
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

/** Date -> Timestamp (毫秒) */
export function DateToTimestamp() {
  return applyDecorators(
    // 显式声明类型为 Date，帮助底层识别
    Type(() => Date),
    Transform(({ value }) => {
      if (value === null || value === undefined) return null;
      if (value instanceof Date) return value.getTime();
      return value; // 如果已经是时间戳，原样返回
    }),
  );
}

/** 字符串脱敏 (手机号/邮箱) */
export function MaskString(type: 'phone' | 'email' | 'idcard' = 'phone') {
  return applyDecorators(
    Type(() => String),
    Transform(({ value }) => {
      if (isEmpty(value)) return null;
      const str = String(value);

      if (type === 'phone' && str.length >= 7) {
        return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      }

      if (type === 'email' && str.includes('@')) {
        const [name, domain] = str.split('@');
        if (name.length <= 2) return `${name}***@${domain}`;
        return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
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
      if (str.startsWith('http://') || str.startsWith('https://')) {
        return str;
      }
      const cleanPrefix = prefix.replace(/\/$/, '');
      const cleanValue = str.replace(/^\//, '');
      return `${cleanPrefix}/${cleanValue}`;
    }),
  );
}
