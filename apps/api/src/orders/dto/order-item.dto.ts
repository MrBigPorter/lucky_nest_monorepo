class Treasure{
    treasureName!: string;
    treasureCoverImg!: string;
}
export class OrderItemDto {
    orderId!: string;
    orderNo!: string;
    createdAt!: number;
    buyQuantity!: number;
    treasureId!: string;
    unitPrice!: string;
    originalAmount!: string;
    discountAmount!: string;
    couponAmount!: string;
    coinAmount!: string;
    finalAmount!: string;
    orderStatus!: number;
    payStatus!: number;
    refundStatus!: number;
    paidAt!: null;
    treasure!:Treasure
}

