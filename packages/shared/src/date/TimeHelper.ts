import dayjs from "dayjs";
import "./dayjs-setup"; // 确保插件已加载

// 定义常用格式常量，方便以后全局统一修改
const FORMATS = {
  DATETIME: "YYYY-MM-DD HH:mm:ss", // 标准时间: 2025-12-14 14:30:00
  DATE: "YYYY-MM-DD", // 仅日期: 2025-12-14
  TIME: "HH:mm:ss", // 仅时间: 14:30:00
  MONTH: "YYYY-MM", // 月份报表: 2025-12
  COMPACT: "MMM D, YYYY", // 紧凑/美式: Dec 14, 2025
};

type TimeOptions = {
  placeholder?: string; // 空值占位符
  format?: string; // 允许覆盖默认格式
};

export class TimeHelper {
  /**
   * 标准日期时间 (表格/详情页专用)
   * 场景：创建时间、更新时间、日志时间
   * Example: "2025-12-14 14:30:05"
   */
  static formatDateTime(
    val: string | number | Date | undefined | null,
    opts: TimeOptions = {},
  ) {
    return this._format(val, opts.format || FORMATS.DATETIME, opts.placeholder);
  }

  /**
   * 仅日期 (Date Only)
   * 场景：出生日期、开始/结束日期、筛选器
   * Example: "2025-12-14"
   */
  static formatDate(
    val: string | number | Date | undefined | null,
    opts: TimeOptions = {},
  ) {
    return this._format(val, opts.format || FORMATS.DATE, opts.placeholder);
  }

  /**
   * 相对时间 (Relative Time)
   * 场景：操作日志、消息通知 (Message Center)
   * Example: "3 hours ago", "in 5 days", "a few seconds ago"
   */
  static formatRelative(val: string | number | Date | undefined | null) {
    if (!this._isValid(val)) return "-";
    return dayjs(val).fromNow();
  }

  /**
   * 月份格式化 (Month)
   * 场景：财务报表、月度统计
   * Example: "2025-12"
   */
  static formatMonth(val: string | number | Date | undefined | null) {
    return this._format(val, FORMATS.MONTH);
  }

  /**
   * 提交给后端的 ISO 格式 (API Payload)
   * 场景：表单提交前，把 Date 对象转为字符串
   * Example: "2025-12-14T06:30:00.000Z"
   */
  static toISO(val: string | number | Date | undefined | null) {
    if (!this._isValid(val)) return undefined; // 表单提交通常 undefined 会被过滤
    return dayjs(val).toISOString();
  }

  /**
   * 获取时间戳 (毫秒)
   * 场景：需要进行时间比对或计算时
   */
  static toTimestamp(val: string | number | Date | undefined | null): number {
    if (!this._isValid(val)) return 0;
    return dayjs(val).valueOf();
  }

  // ================= 私有辅助方法 =================

  /**
   * 统一格式化核心逻辑
   */
  private static _format(val: any, formatTemplate: string, placeholder = "-") {
    if (!this._isValid(val)) return placeholder;
    return dayjs(val).format(formatTemplate);
  }

  /**
   * 校验是否为有效时间
   * dayjs(null).isValid() 是 false，但 dayjs(undefined) 会变成当前时间，必须特判
   */
  private static _isValid(val: any): boolean {
    if (val === null || val === undefined || val === "") return false;
    const d = dayjs(val);
    return d.isValid();
  }
}
