import assert from 'node:assert/strict';
import { allocateRankWeightedPool, buildDailyAirdropPlan } from '../tgcloud/lib/airdropMath.js';

const countryShares = allocateRankWeightedPool([{ id: 1 }, { id: 2 }, { id: 3 }], 1000);
assert.equal(countryShares.reduce((sum, item) => sum + item.amount, 0), 1000, 'all pool units are allocated');
assert.equal(countryShares[0].rank, 1);
assert.ok(countryShares[0].amount > countryShares[1].amount);
assert.ok(countryShares[1].amount > countryShares[2].amount);

const countries = [
  { id: 1, name: 'A', iso: 'AA', population: 0 },
  { id: 2, name: 'B', iso: 'BB', population: 0 },
  { id: 3, name: 'C', iso: 'CC', population: 0 },
];
const users = [
  { telegramId: 11, countryId: 1, points: 80, totalUpgrades: 10 },
  { telegramId: 12, countryId: 1, points: 30, totalUpgrades: 4 },
  { telegramId: 21, countryId: 2, points: 5, totalUpgrades: 1 },
  { telegramId: 31, countryId: 3, points: 0, totalUpgrades: 0 },
  { telegramId: 0, countryId: 1, points: 9999, totalUpgrades: 9999 },
  { telegramId: 99, countryId: 0, points: 9999, totalUpgrades: 9999 },
];
const plan = buildDailyAirdropPlan(users, countries, 1000);
assert.equal(plan.activeCountries, 3);
assert.equal(plan.recipients, 4, 'only users with a valid Telegram ID and selected country receive rewards');
assert.equal(plan.totalPlanned, 1000, 'hierarchical country/user allocation spends exactly the daily pool');
assert.equal(plan.plan.reduce((sum, row) => sum + row.amount, 0), 1000);

const user11 = plan.plan.find((row) => row.telegramId === 11);
const user12 = plan.plan.find((row) => row.telegramId === 12);
assert.equal(user11.countryRank, 1, 'highest-scoring country receives country rank 1');
assert.equal(user11.userRank, 1, 'highest-ranked user in country gets rank 1');
assert.ok(user11.amount > user12.amount, 'higher country-rank user share is larger');
assert.equal(plan.plan.find((row) => row.telegramId === 21).countryRank, 2);

const tinyPool = allocateRankWeightedPool([{ id: 1 }, { id: 2 }, { id: 3 }], 2);
assert.equal(tinyPool.reduce((sum, item) => sum + item.amount, 0), 2, 'small integer pools still conserve value');
assert.deepEqual(allocateRankWeightedPool([], 10), []);

console.log('Daily airdrop math tests passed.');
