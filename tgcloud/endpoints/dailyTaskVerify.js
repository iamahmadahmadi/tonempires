// POST /api/daily-task/verify
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getOrCreateUser, DAILY_TASK } from '../lib/game.js';

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { error: 'verification_failed' };

  const word = String(input?.secretWord ?? input?.word ?? '').trim().toLowerCase();
  if (word !== DAILY_TASK.secretWord) return { error: 'wrong_word' };

  await getOrCreateUser(tgId);
  const row = await db.get(sql`SELECT id, earnings, daily_streak AS streak, daily_claimed_at AS claimedAt FROM users WHERE tg_id = ${tgId}`);
  const lastClaim = row?.claimedAt
    ? new Date(Number(row.claimedAt) * 1000).toISOString().slice(0, 10)
    : null;
  if (lastClaim === todayUtc()) return { error: 'already_claimed' };

  const nowSec = Math.floor(Date.now() / 1000);
  const todayStartSec = Math.floor(new Date(`${todayUtc()}T00:00:00.000Z`).getTime() / 1000);
  const claim = await db.run(sql`
    UPDATE users
    SET daily_streak = COALESCE(daily_streak, 0) + 1,
        daily_claimed_at = ${nowSec},
        earnings = COALESCE(earnings, 0) + ${DAILY_TASK.reward}
    WHERE id = ${row.id}
      AND (daily_claimed_at IS NULL OR daily_claimed_at < ${todayStartSec})
  `);

  if (!claim?.rowsAffected) return { error: 'already_claimed' };

  return { success: true, discount: DAILY_TASK.reward, streak: Number(row.streak || 0) + 1 };
}
