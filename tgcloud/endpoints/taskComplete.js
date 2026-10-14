// POST /api/task/complete and /api/task/verify
import { db } from 'sdk';
import { sql } from 'sdk/db';
import {
  resolveTgId, getOrCreateUser, parseCompletedTasks,
  DEFAULT_TASKS, getTotalUpgrades,
} from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { status: 'error', error: 'telegramId is required' };

  const taskName = input?.taskName || 'Watch Ads';
  const task = DEFAULT_TASKS.find((item) => item.task_name === taskName);
  if (!task) return { status: 'error', error: 'Unknown task' };

  const user = await getOrCreateUser(tgId);
  const parsed = parseCompletedTasks(user);
  const done = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...parsed } : {};
  const existing = done[taskName] || { count: 0, status: 'pending' };

  // Watch Ads is repeatable. Other task rewards are one-time. Note: providers
  // still need server-side verification before an ad/social claim is abuse-proof.
  if (taskName !== 'Watch Ads' && Number(existing.count || 0) > 0) {
    return {
      status: 'already_completed',
      pointsEarned: 0,
      points: Number(user.points || 0),
      earnings: Number(user.earnings || 0),
      alreadyCompleted: true,
    };
  }

  // Enforce requirements that can be checked against server-owned state.
  if (taskName === 'Invite Friends') {
    const row = await db.get(sql`SELECT COUNT(*) AS c FROM users WHERE referred_by = ${tgId}`);
    if (Number(row?.c || 0) < 1) return { status: 'error', error: 'invite_friends_required' };
  }
  if (taskName === 'Daily Upgrade' && getTotalUpgrades(user) < 1) {
    return { status: 'error', error: 'upgrade_required' };
  }

  const currentJson = typeof user.completed_tasks === 'string'
    ? user.completed_tasks
    : JSON.stringify(user.completed_tasks ?? {});
  const now = new Date().toISOString();
  done[taskName] = {
    ...existing,
    count: Number(existing.count || 0) + 1,
    status: 'completed',
    completedAt: now,
  };
  const nextJson = JSON.stringify(done);
  const result = await db.run(sql`
    UPDATE users
    SET completed_tasks = ${nextJson},
        points = COALESCE(points, 0) + ${task.points},
        earnings = COALESCE(earnings, 0) + ${task.points * 100}
    WHERE id = ${user.id} AND COALESCE(completed_tasks, '{}') = ${currentJson}
  `);

  // Compare-and-set means only one overlapping request can claim the same
  // prior state. Ask the client to refresh instead of paying a stale request.
  if (!result?.rowsAffected) {
    const latest = await db.get(sql`SELECT completed_tasks, points, earnings FROM users WHERE id = ${user.id}`);
    const latestDoneRaw = latest?.completed_tasks;
    const latestDone = typeof latestDoneRaw === 'string'
      ? (() => { try { return JSON.parse(latestDoneRaw) || {}; } catch { return {}; } })()
      : (latestDoneRaw || {});
    if (taskName !== 'Watch Ads' && Number(latestDone?.[taskName]?.count || 0) > 0) {
      return {
        status: 'already_completed', pointsEarned: 0,
        points: Number(latest?.points || 0), earnings: Number(latest?.earnings || 0),
        alreadyCompleted: true,
      };
    }
    return { status: 'error', error: 'task_state_changed_retry' };
  }

  const fresh = await db.get(sql`SELECT points, earnings FROM users WHERE id = ${user.id}`);
  return {
    status: 'completed',
    pointsEarned: task.points,
    points: Number(fresh?.points || 0),
    earnings: Number(fresh?.earnings || 0),
  };
}
