import { db, EndpointError } from 'sdk';
import { eq, sql } from 'sdk/db';

export const COUNTRIES = [
  { id: 1, name: 'Iran', iso: 'IR', population: 0 },
  { id: 2, name: 'United States', iso: 'US', population: 0 },
  { id: 3, name: 'Germany', iso: 'DE', population: 0 },
  { id: 4, name: 'France', iso: 'FR', population: 0 },
  { id: 5, name: 'Turkey', iso: 'TR', population: 0 },
  { id: 6, name: 'India', iso: 'IN', population: 0 },
  { id: 7, name: 'China', iso: 'CN', population: 0 },
  { id: 8, name: 'Brazil', iso: 'BR', population: 0 },
  { id: 9, name: 'United Kingdom', iso: 'GB', population: 0 },
  { id: 10, name: 'United Arab Emirates', iso: 'AE', population: 0 },
];

export const DEFAULT_SETTINGS = {
  language: 'en', music: true, soundEffects: true, animations: true, walletConnected: false,
};

export const UPGRADE_BLUEPRINTS = [
  ['Culture', 'Food', 1000, 10], ['Culture', 'Clothes', 2000, 20], ['Culture', 'Cinema', 4000, 35],
  ['Education', 'Schools', 2000, 20], ['Education', 'Universities', 2500, 25], ['Education', 'AI', 3000, 30],
  ['Energy', 'Power Plants', 1800, 18], ['Energy', 'Renewable Energy', 2200, 22], ['Energy', 'Energy Efficiency', 2400, 24],
  ['Environment', 'Municipality', 1700, 17], ['Environment', 'Waste Management', 1900, 19], ['Environment', 'Agriculture', 1600, 16],
  ['Financial', 'Banks', 3000, 30], ['Financial', 'Exchanges', 3200, 32], ['Financial', 'Governments', 3500, 35],
  ['Financial', 'Stocks', 2800, 28], ['Financial', 'Minerals', 2700, 27], ['Financial', 'Jobs', 2600, 26],
  ['Healthcare', 'Pharmaceutical Industry', 4000, 40], ['Healthcare', 'Hospitals', 3800, 38], ['Healthcare', 'Clinics', 3600, 36],
  ['Technology', 'Space Program', 5000, 50], ['Technology', 'Research Labs', 4800, 48], ['Technology', 'Internet Infrastructure', 4600, 46],
  ['Transportation', 'Roads', 2000, 20], ['Transportation', 'Public Transit', 2200, 22], ['Transportation', 'Airports', 2400, 24],
].map(([group_name, name, baseCost, starBaseCost], index) => ({
  id: index + 1, group_name, name, baseCost, starBaseCost,
}));

export const DEFAULT_TASKS = [
  { id: 1, task_name: 'Watch Ads', description: 'watch_ads_description', points: 1, icon: '/Watch Ads.svg', link: '' },
  { id: 2, task_name: 'Invite Friends', description: 'invite_friends_description', points: 5, icon: '/Invite Friends.svg', link: '' },
  { id: 3, task_name: 'Follow X', description: 'follow_x_description', points: 2, icon: '/Follow X.svg', link: 'https://x.com/tonempires' },
  { id: 4, task_name: 'Subscribe YouTube', description: 'subscribe_youtube_description', points: 2, icon: '/Subscribe YouTube.svg', link: 'https://youtube.com' },
  { id: 5, task_name: 'Daily Upgrade', description: 'daily_upgrade_description', points: 3, icon: '/Daily Upgrade.svg', link: '' },
];

export const DAILY_TASK = { secretWord: 'empire', reward: 500 };

// The Mini App passes the Telegram id as ?telegramId= / ?userId= / body field.
// The platform-verified ctx.initData.user wins when present.
export function resolveTgId(_input, ctx) {
  // Endpoints must use the identity verified by Telegram Serverless. A client
  // supplied telegramId/userId is not proof of identity and must never permit
  // reading or mutating another player's account.
  const verifiedId = Number(ctx?.initData?.user?.id);
  return Number.isSafeInteger(verifiedId) && verifiedId > 0 ? verifiedId : null;
}

export function getCountry(nameOrId) {
  const requested = String(nameOrId ?? '').toLowerCase();
  return (
    COUNTRIES.find((c) => String(c.id) === requested) ||
    COUNTRIES.find((c) => c.name.toLowerCase() === requested) ||
    COUNTRIES[0]
  );
}

function parseJsonColumn(value, fallback) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value || fallback;
}

export function parseUpgrades(user) {
  return parseJsonColumn(user.upgrades, {});
}

export function parseCompletedTasks(user) {
  return parseJsonColumn(user.completed_tasks ?? user.completedTasks, {});
}

export function getTotalUpgrades(user) {
  const u = parseUpgrades(user);
  return Object.values(u).reduce((sum, level) => sum + Number(level || 0), 0);
}

export function listUpgradesForUser(user) {
  const levels = parseUpgrades(user);
  return UPGRADE_BLUEPRINTS.map((upgrade) => {
    const level = Number(levels[String(upgrade.id)] || 0);
    return {
      id: upgrade.id, group_name: upgrade.group_name, name: upgrade.name, level,
      cost: upgrade.baseCost * Math.pow(2, level),
      starCost: upgrade.starBaseCost * Math.pow(2, level),
    };
  });
}

export function leaderboardRows(allUsers, countryId = null) {
  const rows = allUsers
    .filter((u) => Number(u.countryId ?? u.country_id ?? 0) > 0)
    .filter((u) => !countryId || Number(u.countryId ?? u.country_id) === Number(countryId))
    .map((u) => {
      const telegramId = Number(u.tgId ?? u.tg_id);
      const resolvedCountryId = Number(u.countryId ?? u.country_id ?? 1);
      return {
        telegramId,
        username: u.username || `User_${telegramId}`,
        countryId: resolvedCountryId,
        totalUpgrades: getTotalUpgrades(u),
        points: Number(u.points || 0),
        isPresident: false,
      };
    })
    .sort((a, b) => b.totalUpgrades - a.totalUpgrades || b.points - a.points || a.telegramId - b.telegramId)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  if (rows[0]) rows[0].isPresident = true;
  return rows;
}

// Population means the number of TON Empires players assigned to this country,
// not the country's real-world population. Always read it from live player data.
export async function getCountryPopulation(countryId) {
  const row = await db.get(sql`SELECT COUNT(*) AS population FROM users WHERE country_id = ${countryId}`);
  return Number(row?.population || 0);
}

// Shape the frontend's HomePage/Upgrades pages read.
export async function publicUserPayload(user) {
  const countryId = Number(user.countryId ?? user.country_id ?? 0);
  const country = COUNTRIES.find((c) => c.id === countryId) || null;
  return {
    user: {
      telegramId: user.tgId ?? user.tg_id,
      username: user.username || `User_${user.tgId ?? user.tg_id}`,
      points: user.points || 0,
    },
    country: {
      id: country?.id ?? 0,
      name: country?.name ?? '',
      population: country ? await getCountryPopulation(country.id) : 0,
      iso: country?.iso ?? '',
    },
    countryId,
    earnings: user.earnings || 0,
    points: user.points || 0,
    upgrades: listUpgradesForUser(user),
    totalUpgrades: getTotalUpgrades(user),
    isPremium: Boolean(user.isPremium ?? user.is_premium),
  };
}

export async function getUser(tgId) {
  return db.get(sql`SELECT * FROM users WHERE tg_id = ${tgId}`);
}

export async function getOrCreateUser(tgId, payload = {}) {
  let user = await getUser(tgId);
  if (user) return user;

  const premiumBonus = payload.isPremium ? 15000 : 5000;
  const selectedCountryId = payload.country ? getCountry(payload.country).id : 0;
  await db.run(sql`
    INSERT INTO users (tg_id, username, country_id, points, earnings, upgrades, completed_tasks, is_premium)
    VALUES (${tgId}, ${payload.name || payload.username || `User_${tgId}`},
            ${selectedCountryId}, 0, ${25000 + premiumBonus}, '{}', '{}',
            ${payload.isPremium ? 1 : 0})
  `);
  return getUser(tgId);
}

// Partial update keyed on the row id — never touches tg_id/created_at.
export async function saveUser(user) {
  const { id } = user;
  if (!id) return user;

  const set = {};
  for (const key of ['username', 'name', 'phone', 'address', 'city', 'country', 'zipcode',
                     'country_id', 'points', 'earnings', 'upgrades', 'completed_tasks',
                     'daily_streak', 'daily_claimed_at', 'referred_by', 'referral_earnings',
                     'is_premium', 'is_admin']) {
    if (user[key] !== undefined) set[key] = user[key] === undefined ? null : user[key];
  }
  const assigns = Object.keys(set);
  if (assigns.length === 0) return user;

  // Build the SET clause with each value as its own bound parameter — the
  // platform's sql template takes values positionally, not a params object.
  let query = sql`UPDATE users SET `;
  assigns.forEach((c, i) => {
    query = i === 0
      ? sql`${query}${sql.raw(c)} = ${set[c]}`
      : sql`${query}, ${sql.raw(c)} = ${set[c]}`;
  });
  await db.run(sql`${query} WHERE id = ${id}`);
  return user;
}

export async function applyReferralReward(referrerTgId, referredTgId, isPremium) {
  const referrerTg = Number(referrerTgId);
  const referredTg = Number(referredTgId);
  if (!referrerTg || !referredTg || referrerTg === referredTg) return;

  const referred = await getUser(referredTg);
  if (!referred || referred.referred_by) return;

  const referrer = await getUser(referrerTg);
  if (!referrer) return;

  const reward = isPremium ? 15000 : 5000;
  // Atomically claim the referral before crediting the inviter. This guards
  // against duplicate starts/retries awarding the same referral twice.
  const claim = await db.run(sql`
    UPDATE users SET referred_by = ${referrerTg}
    WHERE id = ${referred.id} AND (referred_by IS NULL OR referred_by = 0)
  `);
  if (!claim?.rowsAffected) return;
  await db.run(sql`
    UPDATE users SET referral_earnings = COALESCE(referral_earnings, 0) + ${reward}, earnings = COALESCE(earnings, 0) + ${reward}
    WHERE id = ${referrer.id}
  `);
}

export async function getSettings(tgId) {
  const row = await db.get(sql`SELECT * FROM settings WHERE tg_id = ${tgId}`);
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    language: row.language, music: Boolean(row.music), soundEffects: Boolean(row.sound_effects),
    animations: Boolean(row.animations), walletConnected: Boolean(row.wallet_connected),
  };
}

export async function saveSettings(tgId, patch) {
  const current = await getSettings(tgId);
  const merged = { ...current, ...(patch || {}) };
  await db.run(sql`
    INSERT INTO settings (tg_id, language, music, sound_effects, animations, wallet_connected)
    VALUES (${tgId}, ${merged.language}, ${merged.music ? 1 : 0}, ${merged.soundEffects ? 1 : 0},
            ${merged.animations ? 1 : 0}, ${merged.walletConnected ? 1 : 0})
    ON CONFLICT(tg_id) DO UPDATE SET
      language = ${merged.language}, music = ${merged.music ? 1 : 0},
      sound_effects = ${merged.soundEffects ? 1 : 0}, animations = ${merged.animations ? 1 : 0},
      wallet_connected = ${merged.walletConnected ? 1 : 0}
  `);
  return merged;
}

export async function requireAdmin(tgId) {
  const user = await getUser(tgId);
  if (!user || !user.is_admin) {
    throw new EndpointError('Admin access required', { code: 'FORBIDDEN' });
  }
  return user;
}
