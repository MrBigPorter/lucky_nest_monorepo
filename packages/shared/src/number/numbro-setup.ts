import numbro from "numbro";

// 1. 注册自定义语言包 (菲律宾英语)
numbro.registerLanguage({
  languageTag: "en-PH",
  delimiters: {
    thousands: ",",
    decimal: ".",
  },
  abbreviations: {
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t",
  },
  ordinal: (number) => {
    return number === 1
      ? "st"
      : number === 2
        ? "nd"
        : number === 3
          ? "rd"
          : "th";
  },
  currency: {
    symbol: "₱",
    position: "prefix",
    code: "PHP",
  },
  formats: {
    fourDigits: {
      totalLength: 4,
      spaceSeparated: false,
      average: false,
    },
    fullWithTwoDecimals: {
      output: "currency",
      mantissa: 2,
      spaceSeparated: false,
      thousandSeparated: true,
    },
    // 🔥 补全这个缺失的属性
    fullWithTwoDecimalsNoCurrency: {
      mantissa: 2,
      spaceSeparated: false,
      thousandSeparated: true,
    },
    fullWithNoDecimals: {
      output: "currency",
      mantissa: 0,
      spaceSeparated: false,
      thousandSeparated: true,
    },
  },
});

// 2. 激活它
numbro.setLanguage("en-PH");

export default numbro;
