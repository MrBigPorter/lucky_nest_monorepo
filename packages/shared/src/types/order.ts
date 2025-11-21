export const ORDER_STATUS = {
     /// 订单状态: 1-待支付 2-支付中 3-已支付 4-已取消 5-已退款
    PENDING_PAYMENT: 1,
    PROCESSING_PAYMENT: 2,
    PAID: 3,
    CANCELED: 4,
    REFUNDED: 5,
}

export const PAY_STATUS = {
    /// 支付状态: 0-未支付 1-已支付 2-支付失败
    UNPAID: 0,
    PAID: 1,
    FAILED: 2,

}