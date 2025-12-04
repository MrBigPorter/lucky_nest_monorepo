type Row = any;

export function mapTreasure(row: Row) {
  // 统一 id 为字符串
  const treasureId = String(row.treasure_id ?? row.id);

  // buy_rate 统一成字符串两位小数
  const rateRaw =
    row.buy_quantity_rate ??
    (row.seq_shelves_quantity
      ? (Number(row.seq_buy_quantity ?? 0) * 100) /
        Number(row.seq_shelves_quantity)
      : 0);
  const buyRate = Number(rateRaw || 0).toFixed(2);

  return {
    treasure_id: treasureId,
    treasure_name: row.treasure_name ?? row.name ?? '',
    product_name: row.product_name ?? '',
    treasure_cover_img: row.treasure_cover_img ?? null,
    main_image_list: row.main_image_list ?? [],
    cost_amount: Number(row.cost_amount ?? 0),
    unit_amount: Number(row.unit_amount ?? 1),

    seq_shelves_quantity: row.seq_shelves_quantity ?? null,
    seq_buy_quantity: row.seq_buy_quantity ?? null,
    min_buy_quantity: row.min_buy_quantity ?? null,

    buy_quantity_rate: Number(buyRate),

    lottery_mode: Number(row.lottery_mode ?? 1),
    lottery_time: Number(row.lottery_time ?? 0),

    img_style_type: Number(row.img_style_type ?? 0),

    hot_score_3d: Number(row.hot_score3d ?? row.hot_score_3d ?? 0),
    hot_score_7d: Number(row.hot_score7d ?? row.hot_score_7d ?? 0),
  };
}
