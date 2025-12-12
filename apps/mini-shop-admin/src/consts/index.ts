import { ORDER_STATUS } from '@lucky/shared';

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PAID]: 'green', // Ready to ship
  // [ORDER_STATUS.SHIPPED]: 'blue',
  // [ORDER_STATUS.RECEIVED]: 'purple', // or 'delivered'
  [ORDER_STATUS.CANCELED]: 'gray',
  [ORDER_STATUS.PENDING_PAYMENT]: 'yellow',
  [ORDER_STATUS.REFUNDED]: 'red',
} as const;
