// Internal daily job entry point. Run it once per UTC day with the tgcloud CLI
// (see .github/workflows/daily-airdrop.yml). Mini App callers are admin-gated.
import { db } from 'sdk';
import { sql } from 'sdk/db';
import { resolveTgId, getTotalUpgrades, requireAdmin, COUNTRIES } from '../lib/game.js';
import { DAILY_AIRDROP_POOL, buildDailyAirdropPlan } from '../lib/airdropMath.js';
import { dailyAirdropRewards } from '../schema.js';

const PLANNING_LOCK_STALE_SECONDS = 30 * 60;
const INSERT_BATCH_SIZE = 100; // 7 columns/row stays below SQLite's bind limit.

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

async function getRun(runDate) {
  return db.get(sql`SELECT * FROM daily_airdrop_runs WHERE run_date = ${runDate}`);
}

async function createOrGetRun(runDate) {
  const inserted = await db.run(sql`
    INSERT INTO daily_airdrop_runs
      (run_date, pool_amount, status, active_countries, total_recipients, total_paid, created_at)
    VALUES (${runDate}, ${DAILY_AIRDROP_POOL}, 'planning', 0, 0, 0, unixepoch())
    ON CONFLICT(run_date) DO NOTHING
  `);
  return { run: await getRun(runDate), created: Number(inserted?.rowsAffected || 0) > 0 };
}

async function createPlan(runDate) {
  // Plan only selected-country players. Rank order is deterministic and matches
  // the game's user leaderboard: upgrades, points, then Telegram ID.
  const rawUsers = await db.all(sql`
    SELECT id, tg_id, username, country_id, points, upgrades
    FROM users
    WHERE country_id > 0
  `);
  const users = rawUsers.map((user) => ({
    ...user,
    telegramId: Number(user.tgId ?? user.tg_id),
    countryId: Number(user.countryId ?? user.country_id ?? 0),
    points: safeNumber(user.points),
    totalUpgrades: getTotalUpgrades(user),
  }));
  const result = buildDailyAirdropPlan(users, COUNTRIES, DAILY_AIRDROP_POOL);

  // While a run is in 'planning', no credits have been applied. If a previous
  // planning attempt died part-way through writing rows, reset and rebuild it.
  await db.run(sql`DELETE FROM daily_airdrop_rewards WHERE run_date = ${runDate}`);
  for (let offset = 0; offset < result.plan.length; offset += INSERT_BATCH_SIZE) {
    const batch = result.plan.slice(offset, offset + INSERT_BATCH_SIZE).map((reward) => ({
      runDate,
      tgId: reward.telegramId,
      countryId: reward.countryId,
      countryRank: reward.countryRank,
      userRank: reward.userRank,
      amount: reward.amount,
      status: 'pending',
    }));
    await db.insert(dailyAirdropRewards).values(batch).run();
  }

  await db.run(sql`
    UPDATE daily_airdrop_runs
    SET pool_amount = ${result.totalPool},
        status = 'planned',
        active_countries = ${result.activeCountries},
        total_recipients = ${result.recipients},
        total_paid = 0
    WHERE run_date = ${runDate} AND status = 'planning'
  `);
  return result;
}

async function creditPendingRewards(runDate) {
  const pending = await db.all(sql`
    SELECT id, tg_id, country_id, country_rank, user_rank, amount
    FROM daily_airdrop_rewards
    WHERE run_date = ${runDate} AND status = 'pending'
    ORDER BY country_rank, user_rank, tg_id
  `);
  let newlyCredited = 0;

  for (const reward of pending) {
    const tgId = Number(reward.tgId ?? reward.tg_id);
    const amount = Math.max(0, Math.floor(safeNumber(reward.amount)));
    const user = await db.get(sql`
      SELECT id, last_airdrop_date, last_airdrop_amount
      FROM users WHERE tg_id = ${tgId}
    `);
    if (!user) {
      return { ok: false, error: 'airdrop_recipient_missing', telegramId: tgId, newlyCredited };
    }

    const lastDate = String(user.lastAirdropDate ?? user.last_airdrop_date ?? '');
    const lastAmount = safeNumber(user.lastAirdropAmount ?? user.last_airdrop_amount);

    // Recovery path: a prior invocation updated the balance and then stopped
    // before marking this ledger row credited. These markers prevent a double-pay.
    if (lastDate === runDate) {
      if (lastAmount !== amount) {
        return { ok: false, error: 'airdrop_credit_marker_mismatch', telegramId: tgId, newlyCredited };
      }
      await db.run(sql`
        UPDATE daily_airdrop_rewards SET status = 'credited'
        WHERE id = ${reward.id} AND status = 'pending'
      `);
      continue;
    }

    if (lastDate && lastDate > runDate) {
      return { ok: false, error: 'airdrop_date_out_of_order', telegramId: tgId, newlyCredited };
    }

    const credit = await db.run(sql`
      UPDATE users
      SET earnings = COALESCE(earnings, 0) + ${amount},
          last_airdrop_date = ${runDate},
          last_airdrop_amount = ${amount}
      WHERE tg_id = ${tgId}
        AND (last_airdrop_date IS NULL OR last_airdrop_date < ${runDate})
    `);

    if (Number(credit?.rowsAffected || 0) > 0) {
      newlyCredited += 1;
      await db.run(sql`
        UPDATE daily_airdrop_rewards SET status = 'credited'
        WHERE id = ${reward.id} AND status = 'pending'
      `);
      continue;
    }

    // Another overlapping invocation may have credited this exact reward.
    const latest = await db.get(sql`
      SELECT last_airdrop_date, last_airdrop_amount FROM users WHERE tg_id = ${tgId}
    `);
    if (String(latest?.lastAirdropDate ?? latest?.last_airdrop_date ?? '') === runDate &&
        safeNumber(latest?.lastAirdropAmount ?? latest?.last_airdrop_amount) === amount) {
      await db.run(sql`
        UPDATE daily_airdrop_rewards SET status = 'credited'
        WHERE id = ${reward.id} AND status = 'pending'
      `);
      continue;
    }
    return { ok: false, error: 'airdrop_credit_conflict', telegramId: tgId, newlyCredited };
  }

  const status = await db.get(sql`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status = 'credited' THEN amount ELSE 0 END) AS paid
    FROM daily_airdrop_rewards WHERE run_date = ${runDate}
  `);
  const pendingCount = safeNumber(status?.pending);
  const totalPaid = safeNumber(status?.paid);
  if (pendingCount === 0) {
    await db.run(sql`
      UPDATE daily_airdrop_runs
      SET status = 'completed', total_paid = ${totalPaid}, completed_at = unixepoch()
      WHERE run_date = ${runDate} AND status = 'planned'
    `);
    return { ok: true, completed: true, recipients: safeNumber(status?.total), totalPaid, newlyCredited };
  }
  return { ok: false, completed: false, pending: pendingCount, totalPaid, newlyCredited };
}

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) throw new Error('daily_airdrop_admin_context_required');
  await requireAdmin(tgId);

  const runDate = utcDate();
  const { run: initialRun, created } = await createOrGetRun(runDate);
  if (!initialRun) throw new Error('airdrop_run_create_failed');
  if (initialRun.status === 'completed') {
    return {
      success: true,
      status: 'already_completed',
      date: runDate,
      pool: safeNumber(initialRun.pool_amount ?? initialRun.poolAmount),
      totalPaid: safeNumber(initialRun.total_paid ?? initialRun.totalPaid),
      recipients: safeNumber(initialRun.total_recipients ?? initialRun.totalRecipients),
    };
  }

  let planSummary = null;
  let run = initialRun;
  if (String(run.status) === 'planning') {
    const createdAt = safeNumber(run.created_at ?? run.createdAt);
    const age = Math.floor(Date.now() / 1000) - createdAt;
    if (!created && age >= 0 && age < PLANNING_LOCK_STALE_SECONDS) {
      throw new Error(`airdrop_planning_in_progress:${runDate}:retry_after_${PLANNING_LOCK_STALE_SECONDS - age}_seconds`);
    }

    // Claim/reset the planning phase before writing the snapshot. The external
    // cron workflow also uses a concurrency group to keep invocations serial.
    await db.run(sql`
      UPDATE daily_airdrop_runs SET status = 'planning', pool_amount = ${DAILY_AIRDROP_POOL},
        created_at = unixepoch(), active_countries = 0, total_recipients = 0, total_paid = 0
      WHERE run_date = ${runDate} AND status = 'planning'
    `);
    planSummary = await createPlan(runDate);
    run = await getRun(runDate);
  }

  if (String(run?.status) !== 'planned') {
    if (String(run?.status) === 'completed') {
      return { success: true, status: 'already_completed', date: runDate };
    }
    throw new Error(`airdrop_not_ready:${run?.status || 'unknown'}:${runDate}`);
  }

  const payout = await creditPendingRewards(runDate);
  if (!payout.ok) {
    console.error('Daily airdrop distribution requires recovery', { date: runDate, ...payout });
    throw new Error(`daily_airdrop_retry_required:${payout.error || 'pending_rewards'}:${runDate}`);
  }
  return {
    success: true,
    date: runDate,
    status: payout.completed ? 'completed' : 'pending',
    pool: safeNumber(run.pool_amount ?? run.poolAmount),
    activeCountries: safeNumber(run.active_countries ?? run.activeCountries),
    recipients: payout.recipients,
    totalPaid: payout.totalPaid,
    newlyCredited: payout.newlyCredited,
    countries: planSummary?.countries,
  };
}
