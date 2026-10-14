// GET /api/user/check → { exists, isNew, openedApp }
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { exists: false, isNew: true, openedApp: false };

  const row = await db.get(sql`SELECT id, country_id FROM users WHERE tg_id = ${tgId}`);
  // A partially initialized account without a selected country should still be
  // sent through Country Selection instead of being treated as onboarded.
  const exists = Boolean(row && Number(row.countryId ?? row.country_id ?? 0) > 0);
  return { exists, isNew: !exists, openedApp: exists };
}
