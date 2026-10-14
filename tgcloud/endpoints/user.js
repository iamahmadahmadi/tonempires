// GET /api/user?telegramId=… | POST /api/user (frontend never POSTs here, but the
// legacy Express router had /user on this group; keep the read side).
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getOrCreateUser, publicUserPayload, getSettings } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { error: 'telegramId is required' };

  const user = await getOrCreateUser(tgId);
  const payload = await publicUserPayload(user);
  const settings = await getSettings(tgId);
  return { ...payload, settings };
}
