// POST /api/upgrade { upgradeId, useStars }. Coin upgrades are enabled; Stars fail closed.
// Success returns { newLevel, earnings }; errors are returned as { error }.
import { db } from 'sdk';
import { sql } from 'sdk/db';
import {
  resolveTgId, getOrCreateUser, getUser, listUpgradesForUser, parseUpgrades,
} from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { error: 'telegramId is required' };

  // The legacy implementation let `useStars: true` skip the coin deduction,
  // even though createInvoice returned only a t.me/share URL. Fail closed until
  // real Telegram Stars invoices are recorded and verified server-side.
  if (input?.useStars) {
    return { success: false, error: 'star_payments_not_configured' };
  }

  const upgradeId = Number(input?.upgradeId);
  if (!upgradeId) return { error: 'upgradeId is required' };

  const user = await getOrCreateUser(tgId);
  const upgrade = listUpgradesForUser(user).find((item) => item.id === upgradeId);
  if (!upgrade) return { error: 'Upgrade not found' };

  if (Number(user.earnings || 0) < upgrade.cost) {
    return { error: 'Not enough coins' };
  }

  const levels = parseUpgrades(user);
  levels[String(upgradeId)] = Number(levels[String(upgradeId)] || 0) + 1;
  const previousUpgrades = typeof user.upgrades === 'string'
    ? user.upgrades
    : JSON.stringify(user.upgrades ?? {});
  const updatedUpgrades = JSON.stringify(levels);
  const updated = await db.run(sql`
    UPDATE users
    SET earnings = COALESCE(earnings, 0) - ${upgrade.cost},
        points = COALESCE(points, 0) + 1,
        upgrades = ${updatedUpgrades}
    WHERE id = ${user.id}
      AND COALESCE(earnings, 0) >= ${upgrade.cost}
      AND COALESCE(upgrades, '{}') = ${previousUpgrades}
  `);

  if (!updated?.rowsAffected) {
    const latest = await getUser(tgId);
    if (Number(latest?.earnings || 0) < upgrade.cost) return { error: 'Not enough coins' };
    return { error: 'upgrade_conflict_retry' };
  }

  const latest = await getUser(tgId);
  const latestLevels = parseUpgrades(latest || {});
  return {
    success: true,
    newLevel: Number(latestLevels[String(upgradeId)] || 0),
    earnings: Number(latest?.earnings || 0),
  };
}
