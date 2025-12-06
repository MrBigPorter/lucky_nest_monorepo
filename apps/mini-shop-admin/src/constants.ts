import {
  Product,
  Category,
  Coupon,
  ActivityZone,
  RechargePlan,
  DashboardStats,
  User,
  Order,
  Withdrawal,
  Banner,
  TreasureGroup,
  SignInRule,
  GrowthRule,
  LotteryDraw,
  VipTier,
  SystemNotification,
  LotteryActivity,
  RechargeOrder,
  Transaction,
  Role,
  AdminUser,
  OperationLog,
  Article,
  Faq,
  FunnelData,
  ProductMetric,
  CohortData,
  WorkOrder,
  BettingRecord,
  LoginLog,
  ReferralUser,
} from '@/type/types.ts';

export const MOCK_STATS: DashboardStats = {
  totalRevenue: 124500,
  activeUsers: 8432,
  newOrders: 156,
  pendingIssues: 12,
};

export const MOCK_USERS: User[] = [
  {
    id: '1001',
    nickname: 'CryptoKing',
    avatar: 'https://i.pravatar.cc/150?u=1',
    phone: '+63 917 123 4567',
    email: 'king@crypto.com',
    vipLevel: 3,
    realBalance: 5400,
    coinBalance: 200,
    kycStatus: 4,
    joinDate: '2023-11-01',
    status: 'active',
    inviterId: '',
  },
  {
    id: '1002',
    nickname: 'Lizzie_99',
    avatar: 'https://i.pravatar.cc/150?u=2',
    phone: '+63 918 987 6543',
    email: 'liz@gmail.com',
    vipLevel: 1,
    realBalance: 120,
    coinBalance: 50,
    kycStatus: 1,
    kycImages: {
      front: 'https://placehold.co/400x250/000/fff?text=ID+Front',
      back: '',
      holding: '',
    },
    joinDate: '2024-01-15',
    status: 'active',
    inviterId: '1001',
  },
  {
    id: '1003',
    nickname: 'WinnerGuy',
    avatar: 'https://i.pravatar.cc/150?u=3',
    phone: '+63 922 555 1212',
    email: 'winner@yahoo.com',
    vipLevel: 0,
    realBalance: 0,
    coinBalance: 10,
    kycStatus: 0,
    joinDate: '2024-02-10',
    status: 'banned',
    banReason: 'Multiple accounts detected',
    inviterId: '1002',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    seq: 'TRE001',
    name: 'iPhone 15 Pro Max',
    price: 10,
    cost: 1200,
    totalShares: 500,
    soldShares: 450,
    category: 'Electronics',
    status: 'active',
    image:
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80',
    lotteryMode: 1,
    sortOrder: 1,
    description:
      'The ultimate iPhone. Forged in titanium. Features the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
    purchaseLimit: 10,
    tags: ['Hot', 'Tech'],
    autoRestart: true,
  },
  {
    id: '2',
    seq: 'TRE002',
    name: 'Honda Click 125i',
    price: 50,
    cost: 2500,
    totalShares: 1000,
    soldShares: 120,
    category: 'Vehicles',
    status: 'active',
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80',
    lotteryMode: 1,
    sortOrder: 2,
    description:
      'The Game Changer. New Honda Click 125i powered by Smart Enhanced Power (eSP) with liquid cooling system.',
    purchaseLimit: 5,
    tags: ['Best Value'],
    autoRestart: false,
  },
  {
    id: '3',
    seq: 'TRE003',
    name: 'Cash ₱50,000',
    price: 100,
    cost: 50000,
    totalShares: 600,
    soldShares: 600,
    category: 'Cash',
    status: 'ended',
    image:
      'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=300&q=80',
    lotteryMode: 2,
    lotteryTime: '2024-03-01 20:00',
    sortOrder: 3,
    description:
      'Instant cash prize sent directly to your wallet or GCash account.',
    purchaseLimit: 50,
    tags: ['Instant'],
    autoRestart: true,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: '5001',
    orderNo: 'ORD20240315001',
    user: { id: '1001', name: 'CryptoKing' },
    product: {
      id: '1',
      name: 'iPhone 15 Pro Max',
      image:
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=50&q=80',
    },
    amount: 500,
    shares: 50,
    status: 'paid',
    isWinning: false,
    date: '2024-03-15 14:30',
  },
  {
    id: '5002',
    orderNo: 'ORD20240314088',
    user: { id: '1002', name: 'Lizzie_99' },
    product: {
      id: '3',
      name: 'Cash ₱50,000',
      image:
        'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=50&q=80',
    },
    amount: 100,
    shares: 1,
    status: 'paid',
    isWinning: true,
    luckyCode: '100555',
    deliveryStatus: 'pending',
    date: '2024-03-14 09:15',
  },
];

export const MOCK_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'W001',
    user: {
      id: '1001',
      name: 'CryptoKing',
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
    amount: 2000,
    fee: 20,
    method: 'GCash',
    accountNo: '09171234567',
    status: 'pending',
    date: '2024-03-16 10:00',
  },
  {
    id: 'W002',
    user: {
      id: '1002',
      name: 'Lizzie_99',
      avatar: 'https://i.pravatar.cc/150?u=2',
    },
    amount: 500,
    fee: 5,
    method: 'Bank',
    accountNo: 'BDO 1234567890',
    status: 'approved',
    date: '2024-03-15 16:20',
  },
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: '1',
    title: 'New User Promo',
    image: 'https://picsum.photos/800/300?random=10',
    position: 'home',
    status: 'active',
  },
  {
    id: '2',
    title: 'Car Giveaway',
    image: 'https://picsum.photos/800/300?random=11',
    position: 'activity',
    status: 'active',
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', productCount: 120 },
  { id: '2', name: 'Vehicles', productCount: 45 },
  { id: '3', name: 'Cash', productCount: 10 },
  { id: '4', name: 'Luxury', productCount: 85 },
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME2024',
    discount: 10,
    type: 'percent',
    category: 'new_user',
    expiryDate: '2024-12-31',
    usageLimit: 1000,
    usedCount: 450,
  },
  {
    id: '2',
    code: 'SUMMER50',
    discount: 50,
    type: 'fixed',
    category: 'general',
    expiryDate: '2024-08-31',
    usageLimit: 200,
    usedCount: 199,
  },
  {
    id: '3',
    code: 'OVER1000',
    discount: 100,
    type: 'fixed',
    category: 'threshold',
    minPurchase: 1000,
    expiryDate: '2024-12-31',
    usageLimit: 5000,
    usedCount: 1200,
  },
];

export const MOCK_ACTIVITIES: ActivityZone[] = [
  {
    id: '1',
    title: 'Summer Sale Zone',
    description: 'Hot items for hot days',
    startTime: '2024-06-01',
    endTime: '2024-08-31',
    active: true,
  },
  {
    id: '2',
    title: 'VIP Exclusive',
    description: 'High-end products for gold members',
    startTime: '2024-01-01',
    endTime: '2024-12-31',
    active: true,
  },
];

export const MOCK_RECHARGE_PLANS: RechargePlan[] = [
  { id: '1', amount: 100, bonus: 5, tag: 'Starter' },
  { id: '2', amount: 500, bonus: 50, tag: 'Popular' },
  { id: '3', amount: 1000, bonus: 150, tag: 'Best Value' },
];

export const MOCK_RECHARGE_ORDERS: RechargeOrder[] = [
  {
    id: 'R001',
    orderNo: 'RC240320001',
    user: {
      id: '1001',
      name: 'CryptoKing',
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
    amount: 1000,
    bonus: 150,
    method: 'GCash',
    status: 'success',
    date: '2024-03-20 10:15',
  },
  {
    id: 'R002',
    orderNo: 'RC240320002',
    user: {
      id: '1002',
      name: 'Lizzie_99',
      avatar: 'https://i.pravatar.cc/150?u=2',
    },
    amount: 500,
    bonus: 50,
    method: 'PayMaya',
    status: 'pending',
    date: '2024-03-20 11:30',
  },
  {
    id: 'R003',
    orderNo: 'RC240319099',
    user: {
      id: '1003',
      name: 'WinnerGuy',
      avatar: 'https://i.pravatar.cc/150?u=3',
    },
    amount: 100,
    bonus: 5,
    method: 'Bank',
    status: 'failed',
    date: '2024-03-19 14:20',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'T001',
    transactionNo: 'TXN24032001',
    user: { id: '1001', name: 'CryptoKing' },
    type: 'deposit',
    amount: 1150,
    balanceBefore: 4250,
    balanceAfter: 5400,
    date: '2024-03-20 10:15',
  },
  {
    id: 'T002',
    transactionNo: 'TXN24032002',
    user: { id: '1001', name: 'CryptoKing' },
    type: 'buy',
    amount: -500,
    balanceBefore: 5400,
    balanceAfter: 4900,
    date: '2024-03-20 10:45',
  },
  {
    id: 'T003',
    transactionNo: 'TXN24031905',
    user: { id: '1002', name: 'Lizzie_99' },
    type: 'win',
    amount: 50000,
    balanceBefore: 120,
    balanceAfter: 50120,
    date: '2024-03-19 16:00',
  },
  {
    id: 'T004',
    transactionNo: 'TXN24031906',
    user: { id: '1002', name: 'Lizzie_99' },
    type: 'withdraw',
    amount: -50000,
    balanceBefore: 50120,
    balanceAfter: 120,
    date: '2024-03-19 17:00',
  },
];

export const MOCK_GROUPS: TreasureGroup[] = [
  {
    id: 'G1001',
    product: {
      id: '1',
      name: 'iPhone 15 Pro Max',
      image:
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=50&q=80',
    },
    creator: {
      id: '1001',
      name: 'CryptoKing',
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
    currentSize: 45,
    targetSize: 50,
    status: 'active',
    createdAt: '2024-03-20 10:00',
    expiresAt: '2024-03-21 10:00',
  },
  {
    id: 'G1002',
    product: {
      id: '2',
      name: 'Honda Click',
      image:
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=50&q=80',
    },
    creator: {
      id: '1002',
      name: 'Lizzie_99',
      avatar: 'https://i.pravatar.cc/150?u=2',
    },
    currentSize: 100,
    targetSize: 100,
    status: 'completed',
    createdAt: '2024-03-19 14:00',
    expiresAt: '2024-03-20 14:00',
  },
];

export const MOCK_SIGN_IN_RULES: SignInRule[] = [
  { id: '1', day: 1, rewardType: 'coin', amount: 10 },
  { id: '2', day: 2, rewardType: 'coin', amount: 20 },
  { id: '3', day: 3, rewardType: 'coin', amount: 30 },
  { id: '4', day: 4, rewardType: 'coin', amount: 40 },
  { id: '5', day: 5, rewardType: 'coupon', amount: 0, couponId: '2' },
  { id: '6', day: 6, rewardType: 'coin', amount: 80 },
  { id: '7', day: 7, rewardType: 'cash', amount: 5 },
];

export const MOCK_GROWTH_RULES: GrowthRule[] = [
  {
    id: '1',
    type: 'register',
    rewardType: 'coupon',
    amount: 0,
    couponId: '1',
    isActive: true,
  },
  { id: '2', type: 'invite', rewardType: 'coin', amount: 50, isActive: true },
  {
    id: '3',
    type: 'join_group',
    rewardType: 'coin',
    amount: 5,
    isActive: true,
  },
];

export const MOCK_LOTTERY_DRAWS: LotteryDraw[] = [
  {
    id: 'L001',
    product: {
      id: '1',
      name: 'MacBook Pro 16"',
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=100&q=80',
    },
    totalShares: 2000,
    fillRate: 100,
    status: 'pending',
  },
  {
    id: 'L002',
    product: {
      id: '2',
      name: 'PlayStation 5',
      image:
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=100&q=80',
    },
    totalShares: 500,
    fillRate: 100,
    status: 'completed',
    winner: { id: '1001', name: 'CryptoKing', code: '49210' },
    hash: '000000000000000000086c6b9074b6a9388062e76d91363673059489',
    drawTime: '2024-03-20 15:30',
  },
  {
    id: 'L003',
    product: {
      id: '3',
      name: 'Gold Bar 10g',
      image:
        'https://images.unsplash.com/photo-1610375460969-d941b747af6f?auto=format&fit=crop&w=100&q=80',
    },
    totalShares: 1000,
    fillRate: 85,
    status: 'pending',
  },
];

export const MOCK_VIP_TIERS: VipTier[] = [
  {
    level: 0,
    name: 'Bronze',
    threshold: 0,
    benefits: ['Basic Support'],
    color: 'bg-gray-400',
  },
  {
    level: 1,
    name: 'Silver',
    threshold: 500,
    benefits: ['Daily Coin +10%', 'Priority Support'],
    color: 'bg-slate-300',
  },
  {
    level: 2,
    name: 'Gold',
    threshold: 2000,
    benefits: ['Daily Coin +20%', 'Withdrawal Fee 1%'],
    color: 'bg-yellow-400',
  },
  {
    level: 3,
    name: 'Platinum',
    threshold: 10000,
    benefits: ['Daily Coin +50%', 'No Withdrawal Fee', 'Personal Manager'],
    color: 'bg-indigo-400',
  },
  {
    level: 4,
    name: 'Diamond',
    threshold: 50000,
    benefits: ['All Platinum Benefits', 'Exclusive Events', 'Birthday Gift'],
    color: 'bg-cyan-400',
  },
];

export const MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'N001',
    title: 'Maintenance Update',
    message: 'System will be down for 2 hours tonight.',
    target: 'all',
    sentCount: 8432,
    date: '2024-03-20',
    status: 'sent',
  },
  {
    id: 'N002',
    title: 'VIP Bonus',
    message: 'Exclusive bonus for Gold members.',
    target: 'vip',
    sentCount: 150,
    date: '2024-03-19',
    status: 'sent',
  },
];

export const MOCK_LOTTERY_ACTIVITIES: LotteryActivity[] = [
  {
    id: 'A001',
    name: 'Daily Lucky Wheel',
    coverImage: 'https://picsum.photos/seed/wheel/800/400',
    template: 'wheel',
    startTime: '2024-01-01',
    endTime: '2024-12-31',
    status: 'active',
    sortOrder: 1,
    rules: {
      costType: 'coin',
      costAmount: 10,
      dailyLimit: 1,
      totalLimit: 0,
      minVipLevel: 0,
    },
    prizes: [
      {
        id: 'P1',
        type: 'product',
        name: 'iPhone 15',
        image:
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=100&q=80',
        value: '1',
        probability: 0.1,
        stock: 1,
        displayIndex: 1,
        sortOrder: 1,
      },
      {
        id: 'P2',
        type: 'coin',
        name: '100 Coins',
        image: '',
        value: 100,
        probability: 20,
        stock: 9999,
        displayIndex: 2,
        sortOrder: 2,
      },
      {
        id: 'P3',
        type: 'empty',
        name: 'Try Again',
        image: '',
        probability: 79.9,
        stock: 9999,
        displayIndex: 3,
        sortOrder: 3,
      },
    ],
  },
  {
    id: 'A002',
    name: 'New Year Mystery Box',
    coverImage: 'https://picsum.photos/seed/box/800/400',
    template: 'box',
    startTime: '2024-02-01',
    endTime: '2024-02-28',
    status: 'ended',
    sortOrder: 2,
    rules: {
      costType: 'balance',
      costAmount: 50,
      dailyLimit: 0,
      totalLimit: 3,
      minVipLevel: 1,
    },
    prizes: [],
  },
];

export const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    permissions: ['*.*'],
    description: 'Full system access',
  },
  {
    id: '2',
    name: 'Finance',
    permissions: ['finance.*', 'order.read'],
    description: 'Manage withdrawals and deposits',
  },
  {
    id: '3',
    name: 'Operations',
    permissions: ['user.read', 'order.read', 'marketing.*', 'lottery.*'],
    description: 'Manage daily operations',
  },
];

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'A001',
    username: 'admin',
    roleId: '1',
    roleName: 'Super Admin',
    status: 'active',
    lastLogin: '2024-03-21 10:00',
  },
  {
    id: 'A002',
    username: 'finance_jane',
    roleId: '2',
    roleName: 'Finance',
    status: 'active',
    lastLogin: '2024-03-20 16:30',
  },
];

export const MOCK_OPERATION_LOGS: OperationLog[] = [
  {
    id: 'L001',
    adminName: 'admin',
    action: 'Approved Withdrawal',
    target: 'W002',
    ip: '192.168.1.1',
    date: '2024-03-21 10:05',
  },
  {
    id: 'L002',
    adminName: 'admin',
    action: 'Created Activity',
    target: 'A001',
    ip: '192.168.1.1',
    date: '2024-03-20 14:00',
  },
  {
    id: 'L003',
    adminName: 'finance_jane',
    action: 'Rejected Withdrawal',
    target: 'W001',
    ip: '192.168.1.5',
    date: '2024-03-20 09:30',
  },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'How to Deposit using GCash',
    category: 'guide',
    status: 'published',
    author: 'admin',
    publishDate: '2024-01-01',
    views: 1250,
  },
  {
    id: '2',
    title: 'Maintenance Notice (March)',
    category: 'announcement',
    status: 'published',
    author: 'admin',
    publishDate: '2024-03-01',
    views: 5000,
  },
];

export const MOCK_FAQS: Faq[] = [
  {
    id: '1',
    question: 'How do I withdraw my winnings?',
    answer: 'Go to wallet and click withdraw.',
    category: 'finance',
    sortOrder: 1,
  },
  {
    id: '2',
    question: 'Is this legal?',
    answer: 'Yes, we are licensed by PAGCOR.',
    category: 'general',
    sortOrder: 2,
  },
];

export const MOCK_FUNNEL_DATA: FunnelData[] = [
  { stage: 'Site Visits', users: 15000, rate: 100, dropOff: 0 },
  { stage: 'Registered', users: 5200, rate: 34.6, dropOff: 65.4 },
  { stage: 'KYC Verified', users: 3800, rate: 73.0, dropOff: 27.0 },
  { stage: 'First Deposit', users: 2100, rate: 55.2, dropOff: 44.8 },
  { stage: 'Purchased', users: 1850, rate: 88.0, dropOff: 12.0 },
  { stage: 'Repurchased', users: 1200, rate: 64.8, dropOff: 35.2 },
];

export const MOCK_PRODUCT_METRICS: ProductMetric[] = [
  {
    id: '1',
    name: 'iPhone 15',
    salesVolume: 450,
    profitMargin: 5,
    revenue: 4500,
    category: 'Electronics',
  }, // High Vol, Low Margin (Cash Cow)
  {
    id: '2',
    name: 'Luxury Watch',
    salesVolume: 50,
    profitMargin: 45,
    revenue: 22500,
    category: 'Luxury',
  }, // Low Vol, High Margin (Star)
  {
    id: '3',
    name: 'Cheap Headset',
    salesVolume: 1200,
    profitMargin: 2,
    revenue: 2400,
    category: 'Electronics',
  }, // High Vol, Low Margin
  {
    id: '4',
    name: 'Old Tablet',
    salesVolume: 20,
    profitMargin: 5,
    revenue: 100,
    category: 'Electronics',
  }, // Low Vol, Low Margin (Dog)
  {
    id: '5',
    name: 'Gold Bar 10g',
    salesVolume: 300,
    profitMargin: 15,
    revenue: 45000,
    category: 'Cash',
  }, // Mid Vol, Mid Margin
];

export const MOCK_COHORT_DATA: CohortData[] = [
  { date: 'Oct 2023', users: 1200, retention: [100, 45, 38, 32, 28, 25] },
  { date: 'Nov 2023', users: 1450, retention: [100, 48, 42, 35, 30] },
  { date: 'Dec 2023', users: 1800, retention: [100, 52, 45, 40] },
  { date: 'Jan 2024', users: 2100, retention: [100, 55, 48] },
  { date: 'Feb 2024', users: 2400, retention: [100, 58] },
  { date: 'Mar 2024', users: 2800, retention: [100] },
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'W001',
    ticketNo: 'T2024032201',
    user: {
      id: '1001',
      name: 'CryptoKing',
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
    subject: 'Deposit issue via GCash',
    message: 'I deposited 500 but it did not reflect.',
    status: 'open',
    priority: 'high',
    createdAt: '2024-03-22 10:00',
    replies: [],
  },
  {
    id: 'W002',
    ticketNo: 'T2024032105',
    user: {
      id: '1002',
      name: 'Lizzie_99',
      avatar: 'https://i.pravatar.cc/150?u=2',
    },
    subject: 'How to upgrade VIP?',
    message: 'I want to know the requirements.',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-03-21 14:00',
    replies: [
      {
        sender: 'support',
        message: 'Hi, you need 2000 deposit.',
        time: '2024-03-21 14:30',
      },
    ],
  },
];

export const MOCK_BETTING_RECORDS: BettingRecord[] = [
  {
    id: 'B001',
    gameName: 'iPhone 15 Pro Max',
    roundId: 'R10023',
    amount: 10,
    status: 'loss',
    payout: 0,
    date: '2024-03-22 14:00',
  },
  {
    id: 'B002',
    gameName: 'Cash ₱50,000',
    roundId: 'R10024',
    amount: 50,
    status: 'win',
    payout: 50000,
    date: '2024-03-21 16:30',
  },
  {
    id: 'B003',
    gameName: 'Honda Click',
    roundId: 'R10025',
    amount: 20,
    status: 'pending',
    payout: 0,
    date: '2024-03-22 18:00',
  },
];

export const MOCK_LOGIN_LOGS: LoginLog[] = [
  {
    id: 'L001',
    ip: '192.168.1.1',
    device: 'iPhone 13',
    location: 'Manila, PH',
    date: '2024-03-22 10:00',
    status: 'success',
  },
  {
    id: 'L002',
    ip: '192.168.1.1',
    device: 'Windows 10 Chrome',
    location: 'Manila, PH',
    date: '2024-03-21 09:30',
    status: 'success',
  },
  {
    id: 'L003',
    ip: '203.112.4.5',
    device: 'Android 12',
    location: 'Cebu, PH',
    date: '2024-03-20 22:15',
    status: 'failed',
  },
];

export const MOCK_REFERRALS: ReferralUser[] = [
  {
    id: '1003',
    nickname: 'WinnerGuy',
    joinDate: '2024-02-10',
    totalContribution: 150,
  },
  {
    id: '1004',
    nickname: 'Newbie01',
    joinDate: '2024-03-01',
    totalContribution: 25,
  },
];

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    users: 'User Management',
    admin: 'admin User',
    products: 'Products',
    groups: 'Group Buying',
    orders: 'Orders & Delivery',
    marketing: 'Marketing',
    finance: 'Finance Center',
    system: 'System Settings',
    logout: 'Logout',
    revenue: 'Total Revenue',
    activeUsers: 'Active Users',
    newOrders: 'New Orders',
    add: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    status: 'Status',
    actions: 'Actions',
    kyc_pending: 'KYC Pending',
    winning: 'Winning',
    operations: 'Operations',
    lottery: 'Lottery Control',
    vip: 'VIP Config',
    notifications: 'Notifications',
    activity: 'Activity Config',
    admin_security: 'Admin & Security',
    content_cms: 'Content CMS',
    analytics: 'Data Analytics',
    service: 'Service Center',
  },
  zh: {
    dashboard: '仪表盘',
    users: '用户管理',
    admin: '管理员账号',
    products: '商品管理',
    groups: '拼团管理',
    orders: '订单与发货',
    marketing: '营销中心',
    finance: '财务中心',
    system: '系统设置',
    logout: '退出登录',
    revenue: '总收入',
    activeUsers: '活跃用户',
    newOrders: '新订单',
    add: '添加',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    search: '搜索...',
    status: '状态',
    actions: '操作',
    kyc_pending: 'KYC待审核',
    winning: '中奖',
    operations: '运营中心',
    lottery: '开奖控制',
    vip: 'VIP配置',
    notifications: '消息推送',
    activity: '活动配置',
    admin_security: '权限与安全',
    content_cms: '内容管理',
    analytics: '数据分析',
    service: '客服中心',
  },
};
