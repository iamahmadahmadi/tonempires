// Daily airdrop distribution math. Amounts are denominated in in-game earnings
// coins. The source handoff did not specify the intended daily amount, so this
// is an explicit, easy-to-change default rather than a hidden assumption.
export const DAILY_AIRDROP_POOL = 1_000_000_000;

// Split an integer pool between pre-ranked entries, weighted by 1 / rank.
// Largest-remainder allocation guarantees the amounts sum exactly to the pool.
export function allocateRankWeightedPool(items, totalAmount) {
  const amount = Math.max(0, Math.floor(Number(totalAmount) || 0));
  if (!Array.isArray(items) || items.length === 0) return [];

  const weights = items.map((_, index) => 1 / (index + 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = items.map((item, index) => {
    const exact = amount * weights[index] / totalWeight;
    const base = Math.floor(exact);
    return { ...item, rank: index + 1, amount: base, _remainder: exact - base };
  });

  let remainder = amount - shares.reduce((sum, share) => sum + share.amount, 0);
  const remainderOrder = [...shares].sort((a, b) => b._remainder - a._remainder || a.rank - b.rank);
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    remainderOrder[index % remainderOrder.length].amount += 1;
  }

  return shares.map(({ _remainder, ...share }) => share);
}

const playerRankSort = (a, b) =>
  Number(b.totalUpgrades || 0) - Number(a.totalUpgrades || 0) ||
  Number(b.points || 0) - Number(a.points || 0) ||
  Number(a.telegramId) - Number(b.telegramId);

// Country rank = total country score (player points + upgrade levels).
// Player rank inside a country matches the game's leaderboard ordering.
export function buildDailyAirdropPlan(users, countries, totalPool = DAILY_AIRDROP_POOL) {
  const supportedCountryIds = new Set(countries.map((country) => Number(country.id)));
  const players = users.map((user) => ({
    ...user,
    telegramId: Number(user.telegramId ?? user.tgId ?? user.tg_id),
    countryId: Number(user.countryId ?? user.country_id ?? 0),
    points: Number(user.points || 0),
    totalUpgrades: Number(user.totalUpgrades ?? user.total_upgrades ?? 0),
  })).filter((user) => Number.isSafeInteger(user.telegramId) && user.telegramId > 0 && supportedCountryIds.has(user.countryId));

  const rankedCountries = countries.map((country) => {
    const members = players.filter((player) => player.countryId === Number(country.id)).sort(playerRankSort);
    return {
      ...country,
      members,
      countryScore: members.reduce((sum, player) => sum + player.points + player.totalUpgrades, 0),
    };
  }).filter((country) => country.members.length > 0)
    .sort((a, b) => b.countryScore - a.countryScore || Number(a.id) - Number(b.id));

  const countryShares = allocateRankWeightedPool(rankedCountries, totalPool);
  const plan = [];
  for (const countryShare of countryShares) {
    const userShares = allocateRankWeightedPool(countryShare.members, countryShare.amount);
    for (const userShare of userShares) {
      plan.push({
        telegramId: userShare.telegramId,
        countryId: Number(countryShare.id),
        countryRank: countryShare.rank,
        userRank: userShare.rank,
        amount: userShare.amount,
      });
    }
  }

  return {
    activeCountries: countryShares.length,
    recipients: plan.length,
    totalPool: Math.max(0, Math.floor(Number(totalPool) || 0)),
    totalPlanned: plan.reduce((sum, reward) => sum + reward.amount, 0),
    plan,
    countries: countryShares.map((country) => ({
      countryId: Number(country.id),
      countryName: country.name,
      countryRank: country.rank,
      countryScore: country.countryScore,
      poolAmount: country.amount,
      users: country.members.length,
    })),
  };
}
