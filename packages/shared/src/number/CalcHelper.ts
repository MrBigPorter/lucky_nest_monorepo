import Decimal from "decimal.js";

// 全局配置：默认保留8位小数进行运算，防止无限循环小数报错
// 这里的 precision 不是最后结果的小数位，是运算过程中的精度
Decimal.set({ precision: 20 });

type NumLike = string | number | Decimal;

export class CalcHelper {
  /**
   * 转为 Decimal 对象（私有方法）
   * 处理 null/undefined/NaN，保证不崩
   */
  private static toDecimal(val: NumLike | undefined | null): Decimal {
    if (val === null || val === undefined || val === "") return new Decimal(0);
    try {
      return new Decimal(val);
    } catch (e) {
      console.warn("CalcHelper: Invalid number", val);
      return new Decimal(0);
    }
  }

  // ==============================
  // 基础四则运算 (返回 number，方便后续使用)
  // ==============================

  /**
   * 加法 (a + b + c...)
   * Example: CalcHelper.add(0.1, 0.2) => 0.3
   */
  static add(...args: (NumLike | undefined | null)[]): number {
    if (args.length === 0) return 0;
    // 累加
    const total = args.reduce((acc, curr) => {
      return this.toDecimal(acc).plus(this.toDecimal(curr));
    }, 0);
    return (total as Decimal).toNumber();
  }

  /**
   * 减法 (a - b)
   * Example: CalcHelper.sub(1.0, 0.9) => 0.1
   */
  static sub(a: NumLike, b: NumLike): number {
    return this.toDecimal(a).minus(this.toDecimal(b)).toNumber();
  }

  /**
   * 乘法 (a * b)
   * Example: CalcHelper.mul(19.99, 100) => 1999 (不是 1998.99999)
   */
  static mul(a: NumLike, b: NumLike): number {
    return this.toDecimal(a).times(this.toDecimal(b)).toNumber();
  }

  /**
   * 除法 (a / b)
   * Example: CalcHelper.div(10, 3) => 3.3333...
   */
  static div(a: NumLike, b: NumLike): number {
    const decimalB = this.toDecimal(b);
    if (decimalB.isZero()) {
      console.error("CalcHelper: Division by zero");
      return 0;
    }
    return this.toDecimal(a).dividedBy(decimalB).toNumber();
  }

  // ==============================
  // 高级运算
  // ==============================

  /**
   * 精确保留小数 (四舍五入)
   * JS 原生的 toFixed 有 bug (1.335.toFixed(2) => 1.33 也就是"四舍六入五成双"的问题)
   * Decimal.js 的保留是标准的
   */
  static round(num: NumLike, decimals: number = 2): number {
    // Decimal.ROUND_HALF_UP 就是标准的“四舍五入”
    return this.toDecimal(num)
      .toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP)
      .toNumber();
  }

  /**
   * 向上取整 (Ceil)
   * 场景：计算分页总页数，或者运费向上取整
   */
  static ceil(num: NumLike): number {
    return this.toDecimal(num).ceil().toNumber();
  }

  /**
   * 向下取整 (Floor)
   */
  static floor(num: NumLike): number {
    return this.toDecimal(num).floor().toNumber();
  }

  /**
   * 计算总价 (单价 * 数量) 并保留 2 位
   * 这是一个快捷方法，因为电商后台太常用了
   */
  static calcTotalPrice(price: NumLike, quantity: NumLike): number {
    const raw = this.mul(price, quantity);
    return this.round(raw, 2);
  }
}
