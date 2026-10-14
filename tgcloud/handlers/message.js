// handlers/message.js — /start opens the Mini App.
import { api } from 'sdk';

const APP_URL = 'https://app8161138471.tgcloud.ai/';

export default async function (message, ctx) {
  const text = (message.text || '').trim();
  const isStart = /^\/start(?:@\w+)?(?:\s|$)/i.test(text);

  if (message.chat?.type !== 'private') return;

  if (isStart) {
    // Preserve /start <referrer-id> when opening the Mini App. The frontend
    // reads `startapp` and forwards it to selectCountry for first-time signup.
    const startPayload = text.replace(/^\/start(?:@\w+)?\s*/i, '').trim();
    const appUrl = startPayload
      ? `${APP_URL}?startapp=${encodeURIComponent(startPayload)}`
      : APP_URL;
    await api.sendMessage({
      chat_id: message.chat.id,
      text: 'Welcome to TON Empires! Open the app to start building your empire.',
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Open TON Empires', web_app: { url: appUrl } }]],
      },
    });
    return;
  }

  if (text) {
    await api.sendMessage({
      chat_id: message.chat.id,
      text: 'Use /start to open the TON Empires Mini App.',
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Open TON Empires', web_app: { url: APP_URL } }]],
      },
    });
  }
}
