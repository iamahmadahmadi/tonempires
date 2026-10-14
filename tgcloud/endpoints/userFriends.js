// GET /api/user/friends
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getOrCreateUser } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { friends: [] };

  await getOrCreateUser(tgId);
  const offset = Number(input?.offset) || 0;
  const friends = await db.all(sql`
    SELECT tg_id, username, earnings FROM users
    WHERE referred_by = ${tgId}
    ORDER BY id LIMIT 20 OFFSET ${offset}
  `);

  return {
    friends: friends.map((f) => ({
      telegram_id: f.tg_id,
      username: f.username || `User_${f.tg_id}`,
      balance: f.earnings || 0,
    })),
  };
}
