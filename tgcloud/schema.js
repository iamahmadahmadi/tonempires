import { table, integer, text, boolean, index, uniqueIndex, sql } from 'sdk/db';

// One user table serves both the TON Empires game and the shop.
// Identity is the verified Telegram id from ctx.initData.user.
export const users = table('users', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  tgId:        integer('tg_id').unique(),
  username:    text('username'),
  name:        text('name'),       // shop profile name
  phone:       text('phone'),
  address:     text('address'),
  city:        text('city'),
  country:     text('country'),
  zipcode:     text('zipcode'),
  countryId:   integer('country_id').default(0),  // 0 = not selected yet; supported country id otherwise
  points:      integer('points').default(0),
  earnings:    integer('earnings').default(0),    // game currency
  upgrades:    text('upgrades', { mode: 'json' }).default({}),   // { upgradeId: level }
  completedTasks: text('completed_tasks', { mode: 'json' }).default({}),
  dailyStreak: integer('daily_streak').default(0),
  dailyClaimedAt: integer('daily_claimed_at', { mode: 'timestamp' }),
  lastAirdropDate: text('last_airdrop_date'),
  lastAirdropAmount: integer('last_airdrop_amount').default(0),
  referredBy:  integer('referred_by'),
  referralEarnings: integer('referral_earnings').default(0),
  isPremium:   boolean('is_premium').default(false),
  isAdmin:     boolean('is_admin').default(false),
  createdAt:   integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  referredByIdx: index('idx_users_referred_by').on(t.referredBy),
}));

export const settings = table('settings', {
  tgId:     integer('tg_id').primaryKey(),
  language: text('language').default('en'),
  music:    boolean('music').default(true),
  soundEffects: boolean('sound_effects').default(true),
  animations: boolean('animations').default(true),
  walletConnected: boolean('wallet_connected').default(false),
});

export const products = table('products', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  description: text('description'),
  price:       integer('price').notNull().default(0),   // game currency
  stock:       integer('stock').notNull().default(0),
  createdAt:   integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const cart = table('cart', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  tgId:      integer('tg_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity:  integer('quantity').notNull().default(1),
}, (t) => ({
  cartUserIdx:  index('idx_cart_tg').on(t.tgId),
  cartUniqueIdx: uniqueIndex('uq_cart_tg_product').on(t.tgId, t.productId),
}));

export const orders = table('orders', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  tgId:      integer('tg_id').notNull(),
  totalPrice: integer('total_price').notNull().default(0),
  status:    text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  ordersUserIdx:  index('idx_orders_tg').on(t.tgId),
  ordersStatusIdx: index('idx_orders_status').on(t.status),
}));

export const orderItems = table('order_items', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  orderId:   integer('order_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity:  integer('quantity').notNull().default(1),
  price:     integer('price').notNull().default(0),
}, (t) => ({
  orderItemsOrderIdx: index('idx_order_items_order').on(t.orderId),
}));

export const admins = table('admins', {
  id:    integer('id').primaryKey({ autoIncrement: true }),
  tgId:  integer('tg_id').unique(),
  email: text('email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});


// Auditable, idempotent daily airdrop distribution. One run per UTC date;
// a unique recipient key prevents duplicate ledger entries for a user/day.
export const dailyAirdropRuns = table('daily_airdrop_runs', {
  runDate: text('run_date').primaryKey(),
  poolAmount: integer('pool_amount').notNull(),
  status: text('status').notNull().default('planning'), // planning | planned | completed
  activeCountries: integer('active_countries').notNull().default(0),
  totalRecipients: integer('total_recipients').notNull().default(0),
  totalPaid: integer('total_paid').notNull().default(0),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  completedAt: integer('completed_at'),
});

export const dailyAirdropRewards = table('daily_airdrop_rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runDate: text('run_date').notNull(),
  tgId: integer('tg_id').notNull(),
  countryId: integer('country_id').notNull(),
  countryRank: integer('country_rank').notNull(),
  userRank: integer('user_rank').notNull(),
  amount: integer('amount').notNull().default(0),
  status: text('status').notNull().default('pending'), // pending | credited
  createdAt: integer('created_at').default(sql`(unixepoch())`),
}, (t) => ({
  dailyRecipientUniqueIdx: uniqueIndex('uq_airdrop_date_user').on(t.runDate, t.tgId),
  dailyRunIdx: index('idx_airdrop_date_status').on(t.runDate, t.status),
}));
