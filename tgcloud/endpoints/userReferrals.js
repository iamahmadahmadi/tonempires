// GET /api/user/referrals
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getOrCreateUser } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { referrals: 0, earnings: 0 };

  const user = await getOrCreateUser(tgId);
  const countRow = await db.get(sql`SELECT COUNT(*) AS c FROM users WHERE referred_by = ${tgId}`);
  return {
    referrals: Number(countRow?.c || 0),
    earnings: user.referral_earnings || 0,
  };
}
