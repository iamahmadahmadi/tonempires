// /api/user/points, /api/user/rank, /api/user/role, /api/user/upgrades
// Frontend reads different fields from each; return the union.
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getOrCreateUser, leaderboardRows, getTotalUpgrades } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { points: 0, rank: 1, role: 'Citizen', totalUpgrades: 0 };

  const user = await getOrCreateUser(tgId);
  const allUsers = await db.all(sql`
    SELECT id, tg_id, username, country_id, points, earnings, upgrades FROM users
  `);

  const globalRows = leaderboardRows(allUsers);
  const globalRank = globalRows.find((r) => Number(r.telegramId) === tgId)?.rank || 1;
  const countryRows = Number(user.country_id || 0) > 0 ? leaderboardRows(allUsers, user.country_id) : [];
  const countryRank = countryRows.find((r) => Number(r.telegramId) === tgId)?.rank || null;

  return {
    points: user.points || 0,
    // HomePage compares rank with this country's player population, so `rank`
    // must be the user's rank inside their selected country. Keep global rank
    // available separately for any screen that needs it.
    rank: countryRank ?? 0,
    countryRank: countryRank ?? 0,
    globalRank,
    role: countryRank === 1 ? 'President' : 'Citizen',
    totalUpgrades: getTotalUpgrades(user),
  };
}
