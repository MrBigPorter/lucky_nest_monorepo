import { Transform } from 'class-transformer';
import { applyDecorators } from '@nestjs/common';

/** 将空值视为未传 */
const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** 数字：'1' → 1；''/undefined → undefined */
export function ToNumber() {
  return applyDecorators(
    Transform(({ value }) => (isEmpty(value) ? undefined : Number(value))),
  );
}

/** 整数：同 ToNumber，但交给 @IsInt 做最终校验 */
export function ToInt() {
  return ToNumber();
}

/** 浮点数：同 ToNumber，交给 @IsNumber({ allowNaN:false }) 做校验 */
export function ToFloat() {
  return ToNumber();
}

/** 布尔：支持 true/false/1/0/yes/no/on/off（大小写不敏感） */
export function ToBool() {
  return applyDecorators(
    Transform(({ value }) => {
      if (isEmpty(value)) return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number')
        return value === 1 ? true : value === 0 ? false : undefined;
      const v = String(value).trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(v)) return true;
      if (['false', '0', 'no', 'off'].includes(v)) return false;
      return undefined; // 交给 @IsBoolean 报 400
    }),
  );
}

/** 字符串：trim，空串→undefined；非字符串则转成字符串再 trim */
export function ToTrimmedString() {
  return applyDecorators(
    Transform(({ value }) => {
      if (isEmpty(value)) return undefined;
      const s = String(value).trim();
      return s.length ? s : undefined;
    }),
  );
}

/** 逗号分隔或数组 → int[]；空值→[] 或 undefined（默认 [] 更好用） */
export function ToIntArray(
  opts: { delimiter?: string; emptyAs?: 'undefined' | 'emptyArray' } = {},
) {
  const { delimiter = ',', emptyAs = 'emptyArray' } = opts;
  return applyDecorators(
    Transform(({ value }) => {
      if (isEmpty(value)) return emptyAs === 'undefined' ? undefined : [];
      const arr = Array.isArray(value) ? value : String(value).split(delimiter);
      const nums = arr
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && Number.isInteger(n));
      return nums;
    }),
  );
}

/** 日期：ISO 字符串/时间戳 → Date；非法 → undefined（让 @IsDate 报错） */
export function ToDate() {
  return applyDecorators(
    Transform(({ value }) => {
      if (isEmpty(value)) return undefined;
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d;
    }),
  );
}

/** Enum 转换：大小写不敏感匹配到枚举值（不匹配→undefined，让 @IsEnum 报错） */
export function ToEnum<E extends Record<string, string | number>>(EnumType: E) {
  const values = new Set(
    Object.values(EnumType).map((v) => String(v).toLowerCase()),
  );
  return applyDecorators(
    Transform(({ value }) => {
      if (isEmpty(value)) return undefined;
      const v = String(value).toLowerCase();
      if (!values.has(v)) return undefined;
      // 找到原始枚举值返回（保持大小写/数值）
      for (const [k, val] of Object.entries(EnumType)) {
        if (String(val).toLowerCase() === v) return val;
      }
      return undefined;
    }),
  );
}
