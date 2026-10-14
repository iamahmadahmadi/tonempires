import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const calls = [];
const originalFetch = async () => { throw new Error('window.fetch should not be used by the official SDK path'); };
globalThis.window = {
  location: { hostname: 'app8161138471.tgcloud.ai', origin: 'https://app8161138471.tgcloud.ai', port: '' },
  fetch: originalFetch,
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  Telegram: {
    WebApp: {
      initData: 'synthetic-test-only',
      Serverless: {
        call(endpoint, input, callback) {
          calls.push({ endpoint, input });
          queueMicrotask(() => callback(null, { endpoint, received: input }));
        },
      },
    },
  },
};

const apiSource = await readFile(new URL('../frontend/src/services/api.js', import.meta.url), 'utf8');
const apiModule = await import(`data:text/javascript;base64,${Buffer.from(apiSource).toString('base64')}`);
const { apiRequest } = apiModule;
const checks = [
  ['/api/user?telegramId=123', 'user', { telegramId: '123' }],
  ['/api/user/check?telegramId=123', 'userCheck', { telegramId: '123' }],
  ['/api/tasks?userId=123', 'tasks', { userId: '123' }],
  ['/api/statistics', 'statistics', {}],
  ['/api/settings/84895335', 'settings', {}],
  ['/api/leaderboard?countryId=4', 'leaderboard', { countryId: '4' }],
  ['/api/leaderboard/global?userId=123', 'leaderboardGlobal', { userId: '123' }],
  ['/api/leaderboard/country?countryId=2&userId=123', 'leaderboardCountry', { countryId: '2', userId: '123' }],
  ['/api/user/select-country', 'selectCountry', { country: 'Iran' }],
  ['/api/task/complete?taskName=Watch%20Ads', 'taskComplete', { taskName: 'Watch Ads' }],
  ['/api/task/verify?taskName=Follow%20X', 'taskComplete', { taskName: 'Follow X' }],
  ['/api/daily-task?telegramId=123', 'dailyTask', { telegramId: '123' }],
  ['/api/daily-task/verify?secretWord=empire', 'dailyTaskVerify', { secretWord: 'empire' }],
  ['/api/upgrades?telegramId=123', 'upgrades', { telegramId: '123' }],
  ['/api/upgrade', 'upgrade', { upgradeId: 2 }],
  ['/api/user/points?userId=123', 'userStatus', { userId: '123' }],
  ['/api/user/friends?offset=20', 'userFriends', { offset: '20' }],
  ['/api/user/referrals', 'userReferrals', {}],
  ['/api/countries', 'countries', {}],
  ['/api/create-invoice', 'createInvoice', {}],
];

for (const [path, expectedEndpoint, expectedBody] of checks) {
  const before = calls.length;
  const result = await apiRequest(path, { method: 'GET', body: JSON.stringify(path.includes('select-country') ? { country: 'Iran' } : (path === '/api/upgrade' ? { upgradeId: 2 } : {})) });
  assert.equal(calls.length, before + 1, `${path} should make exactly one Serverless.call`);
  const call = calls.at(-1);
  assert.equal(call.endpoint, expectedEndpoint, `${path} endpoint mapping`);
  for (const [key, value] of Object.entries(expectedBody)) {
    assert.equal(call.input[key], value, `${path} query/body field ${key}`);
  }
  assert.equal(result.endpoint, expectedEndpoint);
}

assert.equal(window.fetch, originalFetch, 'the service must not globally intercept fetch');
window.Telegram.WebApp.initData = '';
await assert.rejects(
  () => apiRequest('/api/user'),
  (error) => error.status === 401 && /authentication data is missing/i.test(error.message),
  'production host should fail closed when Telegram initData is absent',
);
console.log(`Serverless transport smoke test passed (${checks.length} endpoint mappings, auth guard, no fetch interceptor).`);
