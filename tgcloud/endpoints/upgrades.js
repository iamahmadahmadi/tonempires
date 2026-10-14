// GET /api/upgrades?telegramId=… | POST /api/upgrade { telegramId, upgradeId, useStars }
// Both live under the legacy /api/upgrade(s) group; the platform gives us one
// POST endpoint per module, so `upgrade` is the write and `upgrades` the read.
import { db, EndpointError } from 'sdk';
import { sql } from 'sdk/db';
import {
  resolveTgId, getOrCreateUser, listUpgradesForUser, parseUpgrades, saveUser,
} from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { error: 'telegramId is required' };

  const user = await getOrCreateUser(tgId);
  return listUpgradesForUser(user);
}
