import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import IntroPage from './pages/IntroPage';
import CountrySelection from './pages/CountrySelection';
import HomePage from './pages/HomePage';
import Upgrades from './pages/Upgrades';
import Statistics from './pages/Statistics';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import Friends from './pages/Friends';
import Leaderboard from './pages/Leaderboard';
import './i18n';
import DailyDiscount from './pages/DailyDiscount';
import DailyDiscountPage from './pages/DailyDiscountPage';

// Mock WebApp for local development
const isTelegramEnv = !!window.Telegram?.WebApp;
const WebApp = isTelegramEnv
  ? window.Telegram.WebApp
  : {
      initDataUnsafe: { user: { id: '5089478718' } },
      initData: '',
      ready: () => {},
      expand: () => {},
    };

// Wrapper component to handle redirect logic
function RootRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromError = location.state?.fromError || false;

  useEffect(() => {
    if (isTelegramEnv) {
      WebApp.ready();
      WebApp.expand();
    }

    const hasVisited = localStorage.getItem('hasVisited');
    const openedApp = localStorage.getItem('openedApp');

    if (fromError) {
      navigate('/intro', { state: { fromError: true }, replace: true });
    } else if (hasVisited && openedApp === '1') {
      navigate('/home', { replace: true });
    } else {
      localStorage.setItem('hasVisited', 'true');
    }
  }, [navigate, fromError]);

  return <IntroPage />;
}

function App() {
  const { i18n } = useTranslation();
  const userId = WebApp.initDataUnsafe?.user?.id || '84895335';
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.telegramfaucet.me';
  const supportedLanguages = ['bn', 'zh', 'de', 'en', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'hy', 'ru', 'tr', 'fa', 'ar'];

  useEffect(() => {
    const loadSettings = async () => {
      i18n.changeLanguage('en'); // Set default language

      try {
        const response = await Promise.race([
          fetch(`${API_BASE_URL}/api/settings/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(isTelegramEnv && { 'Telegram-Init-Data': WebApp.initData || '' }),
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 5000)),
        ]);

        if (!response.ok) {
          throw new Error('API error');
        }

        let settings = await response.json();
        if (typeof settings === 'string') {
          settings = JSON.parse(settings);
        }
        settings = settings.settings || settings; // Handle nested settings

        const language = supportedLanguages.includes(settings.language) ? settings.language : 'en';
        i18n.changeLanguage(language);
      } catch (error) {
        i18n.changeLanguage('en'); // Fallback on error
      }
    };

    loadSettings();
  }, [i18n, userId]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/country-selection" element={<CountrySelection />} />
        <Route path="/frens" element={<Friends />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/upgrades" element={<Upgrades />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        {/*
         * The standalone daily discount route renders a wrapper component
         * rather than the raw modal.  This wrapper takes care of opening
         * the challenge automatically and storing the resulting discount
         * into context.  The old component import remains above for
         * backward‑compatibility but is no longer mounted directly.
         */}
        <Route path="/dailydiscount" element={<DailyDiscountPage />} />
      </Routes>
    </Router>
  );
}

export default App;