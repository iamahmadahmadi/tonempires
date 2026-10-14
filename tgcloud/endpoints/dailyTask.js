// GET /api/daily-task?telegramId=…
// Frontend reads { url, discount, name, claimed }.
// POST /api/daily-task/verify { telegramId, secretWord } — legacy shape:
//   success → { success: true, discount }; error → { error: 'wrong_word' | ... }
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getOrCreateUser, DAILY_TASK } from '../lib/game.js';

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { url: '', discount: 0, name: '', claimed: true };

  const user = await getOrCreateUser(tgId);
  const row = await db.get(sql`SELECT daily_streak AS streak, daily_claimed_at AS claimedAt FROM users WHERE tg_id = ${tgId}`);
  const lastClaim = row?.claimedAt
    ? new Date(Number(row.claimedAt) * 1000).toISOString().slice(0, 10)
    : null;
  const claimedToday = lastClaim === todayUtc();

  return {
    url: '',
    discount: DAILY_TASK.reward,
    name: 'Daily Secret Word',
    claimed: claimedToday,
    streak: Number(row?.streak || 0),
  };
}
