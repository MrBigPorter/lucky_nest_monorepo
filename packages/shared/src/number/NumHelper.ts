import numbro from "numbro";
import "./numbro-setup";
type FormatOptions = {
  placeholder?: string;
};

export class NumHelper {
  /**
   * 金额 (Standard)
   * 1234.5 => ₱1,234.50
   */
  static formatMoney(
    val: string | number | undefined | null,
    opts: FormatOptions = {},
  ) {
    const { placeholder = "-" } = opts;
    if (val === null || val === undefined || val === "") return placeholder;

    // Numbro 的 formatCurrency API
    return numbro(val).formatCurrency({
      thousandSeparated: true,
      mantissa: 2, // 保留2位小数
    });
  }

  /**
   * 紧凑金额 (Compact/Average)
   * 1500 => ₱1.50k
   */
  static formatMoneyCompact(val: string | number | undefined | null) {
    if (!val) return "-";
    // '0.00a' 语法 Numbro 也支持，但他有更高级的对象配置
    return (
      "₱" +
      numbro(val)
        .format({
          average: true,
          mantissa: 2,
        })
        .toUpperCase()
    ); // k/m 变大写
  }

  /**
   * 普通数字
   * 123456 => 123,456
   */
  static formatNumber(val: string | number | undefined | null) {
    if (val === null || val === undefined) return "0";
    return numbro(val).format({
      thousandSeparated: true,
      mantissa: 0, // 无小数
    });
  }

  /**
   * 百分比
   * 0.1234 => 12.34%
   */
  static formatRate(val: string | number | undefined | null) {
    if (!val) return "-";
    return numbro(val).format({
      output: "percent",
      mantissa: 2,
    });
  }

  /**
   * 字节大小 (Byte)
   * 1024 => 1KB
   */
  static formatBytes(val: string | number | undefined | null) {
    if (!val) return "0B";
    return numbro(val).format({
      output: "byte",
      base: "binary", // 1024进制
      mantissa: 1,
    });
  }

  /**
   * 反向解析 (Input -> Number)
   * "₱1,234.50" -> 1234.5
   */
  static unformat(val: string): number {
    return numbro.unformat(val);
  }
}
