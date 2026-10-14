// GET /api/leaderboard/global
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, leaderboardRows } from '../lib/game.js';

export default async function (input, ctx) {
  const allUsers = await db.all(sql`
    SELECT id, tg_id, username, country_id, points, earnings, upgrades FROM users
  `);
  const rows = leaderboardRows(allUsers);
  const tgId = resolveTgId(input, ctx);
  const userRank = tgId ? rows.find((r) => Number(r.telegramId) === tgId) || null : null;
  return { top10: rows.slice(0, 10), userRank };
}
