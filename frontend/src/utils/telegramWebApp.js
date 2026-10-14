export const isTelegramEnv = typeof window !== 'undefined' && !!window.Telegram?.WebApp;

const noop = () => {};
const mockButton = {
  show: noop,
  hide: noop,
  onClick: noop,
  offClick: noop,
};

export const WebApp = isTelegramEnv
  ? window.Telegram.WebApp
  : {
      themeParams: {
        bg_color: '#101820',
        text_color: '#ffffff',
        button_color: '#16a34a',
        button_text_color: '#ffffff',
        secondary_bg_color: '#182434',
      },
      initDataUnsafe: { user: { id: '84895335', language_code: 'en' } },
      initData: '',
      ready: noop,
      expand: noop,
      showAlert: (message) => window.alert(message),
      openInvoice: (invoiceLink, callback) => {
        window.open(invoiceLink, '_blank', 'noopener,noreferrer');
        callback?.('cancelled');
      },
      HapticFeedback: {
        impactOccurred: noop,
        notificationOccurred: noop,
      },
      BackButton: mockButton,
      SettingsButton: mockButton,
      MainButton: mockButton,
    };

export function getTelegramUserId(fallback = null) {
  // Production identity is supplied by Telegram. The API never trusts this
  // client-side value, and no production account ID is used as a fallback.
  return WebApp.initDataUnsafe?.user?.id || fallback;
}

export function getTelegramLanguage(fallback = 'en') {
  return WebApp.initDataUnsafe?.user?.language_code?.toLowerCase() || fallback;
}

export function getTelegramHeaders() {
  return isTelegramEnv && WebApp.initData ? { 'Telegram-Init-Data': WebApp.initData } : {};
}

export function triggerHaptic(type = 'light') {
  try {
    WebApp.HapticFeedback?.impactOccurred?.(type);
  } catch (error) {
    console.warn('Haptic feedback failed', error);
  }
}
