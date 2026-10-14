// Telegram Serverless endpoint names are FLAT (no sub-paths).
// The Mini App's legacy paths are remapped here so page code stays unchanged.
const ENDPOINT_MAP = {
  '/api/user/check': 'userCheck',
  '/api/user/select-country': 'selectCountry',
  '/api/user/points': 'userStatus',
  '/api/user/rank': 'userStatus',
  '/api/user/role': 'userStatus',
  '/api/user/upgrades': 'userStatus',
  '/api/user/friends': 'userFriends',
  '/api/user/referrals': 'userReferrals',
  '/api/task/complete': 'taskComplete',
  '/api/task/verify': 'taskComplete',
  '/api/daily-task/verify': 'dailyTaskVerify',
  '/api/leaderboard/global': 'leaderboardGlobal',
  '/api/leaderboard/country': 'leaderboardCountry',
  '/api/create-invoice': 'createInvoice',
  '/api/user': 'user',
  '/api/countries': 'countries',
  '/api/settings': 'settings',
  '/api/statistics': 'statistics',
  '/api/upgrades': 'upgrades',
  '/api/upgrade': 'upgrade',
  '/api/tasks': 'tasks',
  '/api/daily-task': 'dailyTask',
  '/api/leaderboard': 'leaderboard',
};

function resolveEndpoint(path) {
  let pathname;
  let search = '';
  const source = String(path || '/');
  try {
    const parsed = /^https?:\/\//i.test(source)
      ? new URL(source)
      : new URL(source, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    pathname = parsed.pathname;
    search = parsed.search.replace(/^\?/, '');
  } catch {
    const question = source.indexOf('?');
    pathname = question >= 0 ? source.slice(0, question) : source;
    search = question >= 0 ? source.slice(question + 1) : '';
  }

  pathname = (pathname.startsWith('/') ? pathname : `/${pathname}`).replace(/\/+$/, '') || '/';
  // Match longest first so /api/leaderboard/global is not shadowed by
  // /api/leaderboard and /api/settings/:userId maps to the single `settings`
  // endpoint rather than an invalid name such as `settings84895335`.
  const match = Object.keys(ENDPOINT_MAP)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));

  if (match) {
    return { endpoint: ENDPOINT_MAP[match], pathname, search };
  }

  // Allow already-flat Serverless endpoint URLs, but reject unknown legacy
  // nested routes rather than silently generating an invalid endpoint name.
  const flat = pathname.match(/^\/api\/([A-Za-z_][A-Za-z0-9_]*)$/);
  if (flat) return { endpoint: flat[1], pathname, search };
  throw new Error(`No Telegram Serverless endpoint mapping exists for ${pathname}`);
}

function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    return 'http://localhost:5000';
  }
  return window.location.origin;
}

export const API_BASE_URL = (process.env.REACT_APP_API_URL || getDefaultApiBaseUrl()).replace(/\/$/, '');

const DEFAULT_TIMEOUT_MS = 8000;

export function getApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

// Use the deterministic mock only on a local developer server. On the live
// tgcloud.ai origin, missing initData must be visible as an auth error rather
// than silently showing fake data.
function isLocalDevelopment() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

const MOCK_TELEGRAM_ID = 84895335;

const MOCK_USER = {
  user: {
    telegramId: MOCK_TELEGRAM_ID,
    username: 'Ahmad',
    points: 7,
  },
  country: { id: 1, name: 'Iran', population: 1, iso: 'IR' },
  countryId: 1,
  earnings: 21600,
  points: 7,
  upgrades: [],
  totalUpgrades: 3,
  isPremium: false,
};

const MOCK_COUNTRIES = [
  { id: 1, name: 'Iran', iso: 'IR', population: 1 },
  { id: 2, name: 'United States', iso: 'US', population: 0 },
  { id: 3, name: 'Germany', iso: 'DE', population: 0 },
];

const MOCK_TASKS = [
  { id: 1, task_name: 'Watch Ads', description: 'watch_ads_description', points: 1, icon: '/Watch Ads.svg', link: '', status: 'pending', completion_count: 0 },
  { id: 2, task_name: 'Invite Friends', description: 'invite_friends_description', points: 5, icon: '/Invite Friends.svg', link: '', status: 'pending', completion_count: 0 },
  { id: 3, task_name: 'Follow X', description: 'follow_x_description', points: 2, icon: '/Follow X.svg', link: 'https://x.com/tonempires', status: 'pending', completion_count: 0 },
];

function mockResponse(endpoint, body) {
  const tgId = Number(body?.telegramId ?? body?.userId ?? MOCK_TELEGRAM_ID) || MOCK_TELEGRAM_ID;

  switch (endpoint) {
    case 'user':
      return { ...MOCK_USER, user: { ...MOCK_USER.user, telegramId: tgId } };
    case 'userCheck':
      return { exists: true, isNew: false, openedApp: true };
    case 'userStatus':
      return { points: 7, rank: 1, role: 'President', totalUpgrades: 3 };
    case 'userReferrals':
      return { referrals: 0, earnings: 0 };
    case 'userFriends':
      return { friends: [] };
    case 'countries':
      return MOCK_COUNTRIES;
    case 'tasks':
      return MOCK_TASKS;
    case 'dailyTask':
      return { url: '', discount: 500, name: 'Daily Secret Word', claimed: false, streak: 0 };
    case 'dailyTaskVerify':
      return String(body?.secretWord ?? '').toLowerCase() === 'empire'
        ? { success: true, discount: 500, streak: 1 }
        : { error: 'wrong_word' };
    case 'leaderboard':
    case 'leaderboardGlobal':
    case 'leaderboardCountry':
      return {
        top10: [{ username: 'Ahmad', totalUpgrades: 3, points: 7, isPresident: true, rank: 1 }],
        userRank: { username: 'Ahmad', totalUpgrades: 3, points: 7, isPresident: true, rank: 1 },
      };
    case 'statistics':
      return {
        countries: MOCK_COUNTRIES.map((c) => ({ ...c, budget: c.population ? 21600 : 0, points: c.population ? 10 : 0, users: c.population })),
        users: 1, totalUsers: 1, totalCountries: 3, totalUpgrades: 3,
        total_budget: 21600, total_population: 1, totalPoints: 7,
        topCountries: [{ ...MOCK_COUNTRIES[0], budget: 21600, points: 10, users: 1 }],
      };
    case 'upgrades':
      return [
        { id: 1, group_name: 'Culture', name: 'Food', level: 2, cost: 4000, starCost: 40 },
        { id: 2, group_name: 'Culture', name: 'Clothes', level: 1, cost: 4000, starCost: 40 },
        { id: 3, group_name: 'Culture', name: 'Cinema', level: 1, cost: 8000, starCost: 70 },
      ];
    case 'upgrade':
      return body?.useStars
        ? { success: false, error: 'star_payments_not_configured' }
        : { success: true, newLevel: 1, earnings: 17600 };
    case 'taskComplete':
      return { status: 'completed', pointsEarned: 1, points: 8, earnings: 21700 };
    case 'selectCountry':
      return { ...MOCK_USER, country: MOCK_COUNTRIES.find((c) => c.name === body?.country) || MOCK_COUNTRIES[0] };
    case 'settings':
      if (body?.language || body?.music !== undefined || body?.soundEffects !== undefined
        || body?.animations !== undefined || body?.walletConnected !== undefined) {
        return { success: true, settings: { language: 'en', music: true, soundEffects: true, animations: true, walletConnected: false }, message: 'Settings saved' };
      }
      return { language: 'en', music: true, soundEffects: true, animations: true, walletConnected: false };
    case 'createInvoice':
      return { success: false, error: 'star_payments_not_configured' };
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

function parseRequestBody(options) {
  let body = {};
  if (options?.body !== undefined && options.body !== null) {
    if (typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch { body = {}; }
    } else if (typeof options.body === 'object' && !Array.isArray(options.body)) {
      body = { ...options.body };
    }
  } else if (options?.data && typeof options.data === 'object' && !Array.isArray(options.data)) {
    body = { ...options.data };
  }
  return body;
}

function requestBodyFor(pathInfo, options) {
  const body = parseRequestBody(options);
  for (const [key, value] of new URLSearchParams(pathInfo.search).entries()) {
    if (!(key in body)) body[key] = value;
  }
  return body;
}

function normalizeServerlessError(error) {
  if (error instanceof Error) return error;
  const normalized = new Error(error?.message || 'Telegram Serverless request failed');
  if (error && typeof error === 'object') {
    if (error.status !== undefined) normalized.status = error.status;
    if (error.type !== undefined) normalized.type = error.type;
    if (error.parameters !== undefined) normalized.parameters = error.parameters;
    if (error.name !== undefined) normalized.name = error.name;
  }
  return normalized;
}

function callOfficialServerless(webApp, endpoint, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      const error = new Error(`Request to ${endpoint} timed out after ${timeoutMs} ms`);
      error.status = 408;
      reject(error);
    }, timeoutMs);

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(normalizeServerlessError(error));
      else resolve(result);
    };

    try {
      webApp.Serverless.call(endpoint, body, finish);
    } catch (error) {
      finish(error, null);
    }
  });
}

async function callServerlessFallback(endpoint, body, timeoutMs, initData) {
  // Compatibility path for an older Telegram web-app script. The production
  // path above uses Serverless.call(), which owns authentication/envelope
  // parsing. This fallback deliberately matches that script's wire format.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await window.fetch(`${API_BASE_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `TMA ${window.btoa(initData)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'omit',
      signal: controller.signal,
    });
    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : null; } catch {
      throw new Error(`Unexpected non-JSON response from ${endpoint} (HTTP ${response.status})`);
    }

    if (payload && typeof payload.ok === 'boolean') {
      if (!payload.ok) {
        const error = new Error(payload.description || `Request to ${endpoint} failed (HTTP ${response.status})`);
        error.status = payload.error_code || response.status;
        error.type = payload.error_type || '';
        error.parameters = payload.parameters;
        throw error;
      }
      return payload.result;
    }
    if (!response.ok) {
      const error = new Error(payload?.message || payload?.error || `Request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeout = new Error(`Request to ${endpoint} timed out after ${timeoutMs} ms`);
      timeout.status = 408;
      throw timeout;
    }
    throw normalizeServerlessError(error);
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const pathInfo = resolveEndpoint(path);
  const body = requestBodyFor(pathInfo, options);
  const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const initData = webApp?.initData || '';

  // Local browser testing is intentionally mocked. Never use mock data on the
  // deployed tgcloud.ai host: that masks missing Telegram authentication.
  if (!initData && isLocalDevelopment()) return mockResponse(pathInfo.endpoint, body);

  if (!initData) {
    const error = new Error('Telegram authentication data is missing. Open TON Empires from @TONEmpiresBot and try again.');
    error.status = 401;
    throw error;
  }

  // This is the supported Telegram Serverless transport. It performs POST,
  // adds the platform's TMA authorization header, and unwraps the response
  // envelope before this Promise resolves.
  if (typeof webApp?.Serverless?.call === 'function') {
    return callOfficialServerless(webApp, pathInfo.endpoint, body, timeoutMs);
  }

  // Fallback only for clients whose telegram-web-app.js predates Serverless.
  return callServerlessFallback(pathInfo.endpoint, body, timeoutMs, initData);
}

// Drop-in response shape for pages that historically called fetch(...). API
// transport is still centralized through apiRequest/Serverless.call.
export async function fetchApi(path, options = {}) {
  try {
    const payload = await apiRequest(path, options, options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const hasError = Boolean(payload && typeof payload === 'object' && (payload.error || payload.success === false));
    return makeFetchResponse(payload, hasError ? 400 : 200);
  } catch (error) {
    return makeFetchResponse({ error: error.message || 'Request failed', message: error.message || 'Request failed' }, Number(error.status) || 500);
  }
}

function makeFetchResponse(payload, status = 200) {
  const body = JSON.stringify(payload);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Request Failed',
    url: '',
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => payload,
    text: async () => body,
    bodyUsed: false,
  };
}

export function readJsonStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage`, error);
    return fallback;
  }
}

export function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write ${key} to localStorage`, error);
  }
}

export function getCachedUserData(telegramId) {
  return readJsonStorage(`tonempires:user:${telegramId}`, null);
}

export function setCachedUserData(telegramId, userData) {
  writeJsonStorage(`tonempires:user:${telegramId}`, userData);
}

export function createFallbackUserData(telegramId) {
  return {
    country: 'Unknown',
    population: 0,
    points: 0,
    earnings: 0,
    upgrades: {},
    countryId: null,
    telegramId,
  };
}

export async function getSettings(userId, headers = {}) {
  // All endpoint calls are POST (the platform 405s GET); apiRequest enforces it.
  return apiRequest(`/api/settings/${userId}`, { headers }, 5000);
}

export async function saveSettings(userId, settings, headers = {}) {
  return apiRequest(
    `/api/settings/${userId}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(settings),
    },
    5000
  );
}

