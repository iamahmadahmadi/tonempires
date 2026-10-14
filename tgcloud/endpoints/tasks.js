// GET /api/tasks?userId=…
import { resolveTgId, getOrCreateUser, parseCompletedTasks, DEFAULT_TASKS } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return [];

  const user = await getOrCreateUser(tgId);
  const done = parseCompletedTasks(user);
  return DEFAULT_TASKS.map((task) => ({
    ...task,
    status: done[task.task_name]?.status || 'pending',
    completion_count: done[task.task_name]?.count || 0,
  }));
}
