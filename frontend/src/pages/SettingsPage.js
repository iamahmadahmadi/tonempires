import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { readJsonStorage, saveSettings as saveSettingsApi } from '../services/api';
import { WebApp, isTelegramEnv, getTelegramHeaders, getTelegramUserId } from '../utils/telegramWebApp';

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    language: 'en',
    music: true,
    soundEffects: true,
    animations: true,
    walletConnected: false,
  });
  const [notification, setNotification] = useState(null);

  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const buttonTextColor = theme.button_text_color || '#ffffff';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';

  const userId = getTelegramUserId();

  const saveSettings = async (newSettings) => {
    // Save to localStorage first
    localStorage.setItem('settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    try {
      await i18n.changeLanguage(newSettings.language);
    } catch (error) {
      console.error('Failed to change language:', error);
      await i18n.changeLanguage('en');
    }

    // Send to API
    try {
      console.info('Saving settings to API for user:', { userId, newSettings });
      const data = await saveSettingsApi(userId, newSettings, getTelegramHeaders());
      console.info('API save response:', data);
      setNotification({ type: 'success', message: t('settings_saved') });
    } catch (error) {
      console.error('Failed to save settings to API:', error);
      setNotification({ type: 'error', message: t('settings_save_failed') });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = readJsonStorage('settings', null) || {
        language: 'en',
        music: true,
        soundEffects: true,
        animations: true,
        walletConnected: false,
      };
      setSettings(savedSettings);
      i18n.changeLanguage(savedSettings.language);
    };
    loadSettings();

    if (isTelegramEnv) {
      WebApp.ready();
      WebApp.expand();
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => navigate('/home'));
    }

    return () => {
      if (isTelegramEnv) {
        WebApp.BackButton.hide();
      }
    };
  }, [navigate, i18n]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    saveSettings({ ...settings, language: newLanguage });
  };

  const handleToggleChange = (key) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const connectTONWallet = () => {
    // Placeholder for TON wallet connection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  const handleWalletConnection = () => {
    connectTONWallet()
      .then(() => {
        saveSettings({ ...settings, walletConnected: true });
        setNotification({ type: 'success', message: t('wallet_connected') });
      })
      .catch((error) => {
        console.error('Wallet connection failed:', error);
        setNotification({ type: 'error', message: t('wallet_connection_failed') });
      });
  };

  return (
    <div
      className="min-h-screen font-roboto"
      style={{ backgroundColor: bgColor, color: textColor }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {notification && (
        <div
          className={`fixed top-4 ${isRtl ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-down ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {notification.message}
        </div>
      )}

      <header
        className="flex justify-between items-center p-4 shadow-md"
        style={{ background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${secondaryBgColor}, ${bgColor})` }}
      >
        <button
          className={`text-2xl hover:opacity-80 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${isRtl ? 'ml-4' : 'mr-4'}`}
          aria-label="Back"
          onClick={() => navigate('/home')}
          style={{ color: buttonColor }}
        >
          {isRtl ? '→' : '←'}
        </button>
        <h1 className={`text-xl font-bold ${isRtl ? 'ml-auto' : 'mr-auto'}`}>{t('settings')}</h1>
      </header>

      <div className="mx-4 mt-4 mb-6">
        <div
          className="bg-gray-800 rounded-xl p-4 shadow-neumorphic"
          style={{ backgroundColor: secondaryBgColor }}
        >
          <h2 className="text-lg font-bold mb-4">{t('preferences')}</h2>

          <div className="mb-6">
            <label htmlFor="language" className="block text-sm font-medium mb-2">
              {t('language')}
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={handleLanguageChange}
              className="w-full p-2 rounded-lg bg-gray-700 text-white border-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bn">বাংলা</option>
              <option value="zh">Chinese</option>
              <option value="de">Dutch</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="hi">हिन्दी</option>
              <option value="id">Bahasa Indonesia</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="hy">Հայեր</option>
              <option value="ru">русский</option>
              <option value="tr">Türkçe</option>
              <option value="fa">فارسی</option>
              <option value="ar">عربی</option>
            </select>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">{t('music')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.music}
                onChange={() => handleToggleChange('music')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">{t('sound_effects')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={() => handleToggleChange('soundEffects')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">{t('animations')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.animations}
                onChange={() => handleToggleChange('animations')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">{t('ton_wallet')}</h3>
            <button
              onClick={handleWalletConnection}
              className="w-full py-2 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              disabled={settings.walletConnected}
            >
              {settings.walletConnected ? t('connected') : t('connect_ton_wallet')}
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full bg-white shadow-md flex justify-around p-2`}>
        <button
          onClick={() => navigate('/home')}
          className="text-gray-600 hover:text-green-500"
        >
          {t('home')}
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="text-gray-600 hover:text-green-500"
        >
          {t('tasks')}
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="text-green-500"
        >
          {t('settings')}
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
