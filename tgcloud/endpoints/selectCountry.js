// POST /api/user/select-country
import {
  resolveTgId, COUNTRIES, getOrCreateUser, getUser, saveUser, applyReferralReward, publicUserPayload,
} from '../lib/game.js';

export default async function (input, ctx) {
  const tgId = resolveTgId(input, ctx);
  if (!tgId) return { error: 'telegramId is required' };

  const requestedCountry = String(input?.country ?? '').trim().toLowerCase();
  const country = COUNTRIES.find((item) =>
    String(item.id) === requestedCountry || item.name.toLowerCase() === requestedCountry || item.iso.toLowerCase() === requestedCountry
  );
  if (!country) return { error: 'unsupported_country' };
  const referrerTgId = Number(input?.referrer) || null;
  const telegramUser = ctx?.initData?.user || {};
  const isPremium = Boolean(telegramUser.is_premium);
  const verifiedName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim()
    || telegramUser.username
    || `User_${tgId}`;

  const user = await getOrCreateUser(tgId, {
    name: verifiedName,
    isPremium,
  });

  user.country_id = country.id;
  user.username = verifiedName;
  user.is_premium = isPremium ? 1 : 0;
  await saveUser(user);

  if (referrerTgId) {
    await applyReferralReward(referrerTgId, tgId, isPremium);
  }

  const fresh = await getUser(tgId);
  return await publicUserPayload(fresh);
}
