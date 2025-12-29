type Row = any;

export function mapTreasure(row: Row) {
  const treasureId = String(row.treasure_id ?? row.id ?? '');

  const rateRaw =
    row.buy_quantity_rate ??
    (row.seq_shelves_quantity
      ? (Number(row.seq_buy_quantity ?? 0) * 100) /
        Number(row.seq_shelves_quantity)
      : 0);
  const buyRate = Number(Number(rateRaw || 0).toFixed(2));

  return {
    // 基础必填项
    treasureId: treasureId,
    treasureName: row.treasure_name ?? row.name ?? '',
    buyQuantityRate: buyRate,

    // 金额类：前端定义为 String?，所以这里我们要转成 String
    // 如果前端使用 JsonNumConverter 处理，后端返回 Number 也可以，
    // 但根据你提供的 dart 代码，它们被定义为 String?，建议转为字符串。
    costAmount: row.cost_amount ? String(row.cost_amount) : '0.00',
    unitAmount: Number(row.unit_amount ?? 1), // 前端用了 toDouble 转换，这里传数字
    maxUnitCoins: row.max_unit_coins ? String(row.max_unit_coins) : '0',
    maxUnitAmount: row.max_unit_amount ? String(row.max_unit_amount) : '0.00',
    charityAmount: row.charity_amount ? String(row.charity_amount) : '0.00',

    // 数字/状态类
    imgStyleType: Number(row.img_style_type ?? 0),
    lotteryMode: Number(row.lottery_mode ?? 1),
    // 注意：前端 lotteryTime 是 int?，后端如果是 Date 对象需要转成时间戳
    lotteryTime: row.lottery_time
      ? Math.floor(new Date(row.lottery_time).getTime() / 1000)
      : 0,

    seqBuyQuantity: Number(row.seq_buy_quantity ?? 0),
    seqShelvesQuantity: Number(row.seq_shelves_quantity ?? 0),
    minBuyQuantity: Number(row.min_buy_quantity ?? 1),
    maxPerBuyQuantity: Number(row.max_per_buy_quantity ?? 0),
    cashState: Number(row.cash_state ?? 1),
    rate: row.rate ? Number(row.rate) : 0,

    // 字符串/列表类
    productName: row.product_name ?? '',
    treasureSeq: row.treasure_seq ?? '',
    treasureCoverImg: row.treasure_cover_img ?? '',
    mainImageList: Array.isArray(row.main_image_list)
      ? row.main_image_list
      : [],
    ruleContent: row.rule_content ?? '',
    desc: row.desc ?? '',

    // 热度评分 (前端模型里虽然没写，但建议保留供以后扩展)
    hotScore3d: Number(row.hot_score_3d ?? 0),
  };
}
