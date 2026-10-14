import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import DailyDiscountPage from './pages/DailyDiscountPage';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import { getSettings, readJsonStorage } from './services/api';
import { WebApp, isTelegramEnv, getTelegramHeaders, getTelegramUserId } from './utils/telegramWebApp';

const supportedLanguages = ['bn', 'zh', 'de', 'en', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'hy', 'ru', 'tr', 'fa', 'ar'];

function normalizeLanguage(language) {
  const normalizedLanguage = language?.split('-')[0];
  return supportedLanguages.includes(normalizedLanguage) ? normalizedLanguage : 'en';
}

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
  const userId = getTelegramUserId();

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = readJsonStorage('settings', null);
      const savedLanguage = savedSettings?.language || localStorage.getItem('i18nextLng');

      if (savedLanguage) {
        i18n.changeLanguage(normalizeLanguage(savedLanguage));
      }

      try {
        let settings = await getSettings(userId, getTelegramHeaders());
        if (typeof settings === 'string') {
          settings = JSON.parse(settings);
        }
        settings = settings.settings || settings;
        i18n.changeLanguage(normalizeLanguage(settings.language));
      } catch (error) {
        if (!supportedLanguages.includes(i18n.language?.split('-')[0])) {
          i18n.changeLanguage('en');
        }
      }
    };

    loadSettings();
  }, [i18n, userId]);

  return (
    <Router>
      <ErrorBoundary onReset={() => window.location.assign('/')}>
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
          <Route path="/dailydiscount" element={<DailyDiscountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
