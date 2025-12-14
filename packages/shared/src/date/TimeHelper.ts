import dayjs, { OpUnitType, QUnitType, Dayjs } from "dayjs";
import "./dayjs-setup"; //  必须引入配置

//  环境检测
const IS_SERVER = typeof window === "undefined";

//  格式常量池
export const DATE_FORMATS = {
  DATETIME: "YYYY-MM-DD HH:mm:ss", // 2025-12-14 14:30:00
  DATE: "YYYY-MM-DD", // 2025-12-14
  TIME: "HH:mm:ss", // 14:30:00
  MONTH: "YYYY-MM", // 2025-12
  NO_YEAR: "MM-DD HH:mm", // 12-14 14:30
  FILE_SAFE: "YYYYMMDD_HHmmss", // 20251214_143000
  TRANSACTION: "YYYYMMDDHHmmssSSS", // 20251214143000123
};

export type TimeRangeType =
  | "today"
  | "yesterday"
  | "week"
  | "last7days"
  | "last30days"
  | "month"
  | "quarter"
  | "year";

export class TimeHelper {
  // ==========================================
  //  国际化控制 (Client Only)
  // ==========================================

  /**
   * 设置全局语言 (仅限客户端/浏览器)
   *  在 Next.js/NestJS 服务端调用会被自动忽略，防止污染全局
   */
  static setLocale(lang: string) {
    if (IS_SERVER) {
      // 服务端静默忽略，或者打印 warn
      return;
    }
    dayjs.locale(lang);
  }

  // ==========================================
  // A. [展示类] 格式化 (String)
  // ==========================================

  static formatDateTime(val: any, placeholder = "-"): string {
    return this._format(val, DATE_FORMATS.DATETIME, placeholder);
  }

  static formatDate(val: any, placeholder = "-"): string {
    return this._format(val, DATE_FORMATS.DATE, placeholder);
  }

  static formatShort(val: any): string {
    return this._format(val, DATE_FORMATS.NO_YEAR);
  }

  /**
   * 相对时间 (智能环境判断)
   * @param val 时间
   * @param lang (可选) 强制指定语言。
   * - 后端/Server Component: 必须传 lang (否则默认英文)
   * - 前端/Client Component: 可不传 (跟随 setLocale)
   */
  static formatRelative(val: any, lang?: string): string {
    const d = this._toDayjs(val);
    if (!d) return "-";

    // 1. 显式传参 (最高优)
    if (lang) return d.locale(lang).fromNow();

    // 2. 服务端兜底 (防止并发污染，强制英文或默认)
    if (IS_SERVER) return d.locale("en").fromNow();

    // 3. 客户端跟随全局
    return d.fromNow();
  }

  static formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return "00:00:00";
    const d = dayjs.duration(seconds, "seconds");
    const H = Math.floor(d.asHours()).toString().padStart(2, "0");
    const m = d.minutes().toString().padStart(2, "0");
    const s = d.seconds().toString().padStart(2, "0");
    return `${H}:${m}:${s}`;
  }

  static formatForTransaction(): string {
    return dayjs().format(DATE_FORMATS.TRANSACTION);
  }

  // ==========================================
  // B. [数据类] Prisma/Database
  // ==========================================

  static toDate(val: any): Date | undefined {
    return this._toDayjs(val)?.toDate();
  }

  static getStartOfDay(val?: any): Date {
    return (this._toDayjs(val) || dayjs()).startOf("day").toDate();
  }

  static getEndOfDay(val?: any): Date {
    return (this._toDayjs(val) || dayjs()).endOf("day").toDate();
  }

  static getStartOf(unit: OpUnitType | QUnitType, val?: any): Date {
    return (this._toDayjs(val) || dayjs()).startOf(unit).toDate();
  }

  static getEndOf(unit: OpUnitType | QUnitType, val?: any): Date {
    return (this._toDayjs(val) || dayjs()).endOf(unit).toDate();
  }

  // ==========================================
  // C. [业务逻辑] 日历/签到
  // ==========================================

  static getDaysInMonth(val: any): number {
    return (this._toDayjs(val) || dayjs()).daysInMonth();
  }

  static getFirstWeekDay(val: any): number {
    return (this._toDayjs(val) || dayjs()).startOf("month").day();
  }

  static isToday(val: any): boolean {
    const d = this._toDayjs(val);
    return d ? d.isSame(dayjs(), "day") : false;
  }

  static isYesterday(val: any): boolean {
    const d = this._toDayjs(val);
    return d ? d.isSame(dayjs().subtract(1, "day"), "day") : false;
  }

  static diffDays(from: any, to: any = new Date()): number {
    const d1 = this._toDayjs(from);
    const d2 = this._toDayjs(to);
    if (!d1 || !d2) return 0;
    return d2.startOf("day").diff(d1.startOf("day"), "day");
  }

  // ==========================================
  // D. [后台快捷查询]
  // ==========================================

  static getRange(type: TimeRangeType) {
    const now = dayjs();
    let start, end;
    switch (type) {
      case "today":
        start = now.startOf("day");
        end = now.endOf("day");
        break;
      case "yesterday":
        start = now.subtract(1, "day").startOf("day");
        end = now.subtract(1, "day").endOf("day");
        break;
      case "week":
        start = now.startOf("isoWeek");
        end = now.endOf("isoWeek");
        break;
      case "last7days":
        start = now.subtract(6, "day").startOf("day");
        end = now.endOf("day");
        break;
      case "last30days":
        start = now.subtract(29, "day").startOf("day");
        end = now.endOf("day");
        break;
      case "month":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "quarter":
        start = now.startOf("quarter");
        end = now.endOf("quarter");
        break;
      case "year":
        start = now.startOf("year");
        end = now.endOf("year");
        break;
      default:
        start = now.startOf("day");
        end = now.endOf("day");
    }
    return { gte: start.toDate(), lte: end.toDate() };
  }

  // ==========================================
  //  核心兼容 (iOS Safety Valve)
  // ==========================================

  private static _toDayjs(val: any): Dayjs | null {
    if (val === null || val === undefined || val === "") return null;
    // 🍎 iOS Safari 补丁: 2025-12-14 12:00:00 -> 2025/12/14 12:00:00
    if (typeof val === "string" && val.includes("-") && !val.includes("T")) {
      const d = dayjs(val);
      if (d.isValid()) return d;
      return dayjs(val.replace(/-/g, "/"));
    }
    const d = dayjs(val);
    return d.isValid() ? d : null;
  }

  private static _format(
    val: any,
    template: string,
    placeholder = "-",
  ): string {
    const d = this._toDayjs(val);
    if (!d) return placeholder;
    return d.format(template);
  }
}
