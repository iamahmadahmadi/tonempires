// GET /api/settings/:userId  → { language, music, soundEffects, animations, walletConnected }
// POST /api/settings/:userId (body: same fields) → { settings, message } (legacy shape)
import { resolveTgId, getSettings, saveSettings } from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { ...{} };

  // POST body carries the patch; the platform's endpoint only receives the JSON body,
  // so a settings POST is detected by the presence of a settings-shaped body.
  const body = input || {};
  const isUpdate = Object.keys(body).some((k) =>
    ['language', 'music', 'soundEffects', 'animations', 'walletConnected'].includes(k),
  );
  if (isUpdate) {
    const saved = await saveSettings(tgId, body);
    return { success: true, settings: saved, message: 'Settings saved' };
  }
  return getSettings(tgId);
}
