// GET /api/leaderboard?countryId=… → top10 array (HomePage widget).
// Global/country pages use separate `leaderboardGlobal` / `leaderboardCountry` endpoints for userRank.
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { leaderboardRows } from '../lib/game.js';

export default async function (input, ctx) {
  const allUsers = await db.all(sql`
    SELECT id, tg_id, username, country_id, points, earnings, upgrades FROM users
  `);

  const countryId = input?.countryId ? Number(input.countryId) : null;
  const rows = leaderboardRows(allUsers, countryId);

  return rows.slice(0, 10);
}
