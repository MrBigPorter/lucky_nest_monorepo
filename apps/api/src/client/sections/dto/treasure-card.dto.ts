export class TreasureCardDto {
  treasure_id!: string;
  lottery_time!: number;
  treasure_name!: string;
  img_style_type!: number;
  lottery_mode!: number;
  treasure_cover_img!: string;
  product_name!: string;
  cost_amount!: number;
  main_image_list!: string[];
  seq_shelves_quantity!: number;
  seq_buy_quantity!: number;
  min_buy_quantity!: number;
  buy_quantity_rate!: string;
  unit_amount!: number;
}

export class ActSectionDto {
  act_id!: string;
  img_style_type!: number;
  treasure_resp!: TreasureCardDto[];
}
