import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingComponent from '../components/LoadingComponent';
import { apiRequest } from '../services/api';
import { WebApp, getTelegramUserId } from '../utils/telegramWebApp';


const DEFAULT_COUNTRY = 'Iran';

function Leaderboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = WebApp.themeParams;
  const textColor = theme.text_color || '#ffffff';
  const bgColor = theme.bg_color || '#1a1a1a';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';
  const buttonColor = theme.button_color || '#3b82f6';

  const userData = location.state?.userData;
  const telegramId = userData?.telegramId || getTelegramUserId();
  const countryId = userData?.countryId;
  const country = userData?.country;
  const rank = userData?.rank;

  const [view, setView] = useState('global');
  const [leaderboard, setLeaderboard] = useState({ top10: [], userRank: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('userData:', userData);
    console.log('telegramId:', telegramId);
    console.log('countryId:', countryId);
    console.log('country:', country);

    const fetchLeaderboard = async () => {
      if (!telegramId) {
        setError(t('user_data_missing'));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let url = `/api/leaderboard/global?userId=${telegramId}`;
        if (view === 'country') {
          if (!countryId) {
            setLeaderboard({ top10: [], userRank: null });
            return;
          }
          url = `/api/leaderboard/country?countryId=${countryId}&userId=${telegramId}`;
        }
        const data = await apiRequest(url);
        console.log('API response:', data);
        const sortedTop10 = [...(data.top10 || [])].sort((a, b) => a.rank - b.rank);
        setLeaderboard({ ...data, top10: sortedTop10 });
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [view, telegramId, countryId, t]);

  useEffect(() => {
    if (WebApp) {
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => navigate(-1));
    }
    return () => {
      if (WebApp) {
        WebApp.BackButton.hide();
      }
    };
  }, [navigate]);

 if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="w-1/2 h-1/2 flex items-center justify-center">
          <LoadingComponent />
        </div>
        <p className="text-lg mt-4">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen" style={{ color: textColor }}>
        <img
          src="error.svg"
          alt="Error Icon"
          className="w-12 h-12 mb-4"
        />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-16 font-roboto" style={{ backgroundColor: bgColor }}>
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setView('global')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 shadow-md ${
            view === 'global' ? 'bg-blue-600 scale-105' : 'bg-gray-700'
          } hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          style={{ backgroundColor: view === 'global' ? buttonColor : secondaryBgColor }}
        >
          <img src="globe.svg" alt="Global Icon" className="w-5 h-5" />
          <span>{t('global')}</span>
        </button>
        <button
          onClick={() => setView('country')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 shadow-md ${
            view === 'country' ? 'bg-blue-600 scale-105' : 'bg-gray-700'
          } hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          style={{ backgroundColor: view === 'country' ? buttonColor : secondaryBgColor }}
          disabled={!countryId}
        >
          <img src="flag.svg" alt="Country Icon" className="w-5 h-5" />
          <span>{country || DEFAULT_COUNTRY}</span>
        </button>
      </div>
      <div className="bg-gray-800 rounded-xl p-6 shadow-neumorphic" style={{ backgroundColor: secondaryBgColor }}>
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2" style={{ color: textColor }}>
          <img src="leaderboard.svg" alt="Leaderboard Icon" className="w-6 h-6" />
          <span>
            {view === 'global' ? t('global_leaderboard') : t('country_leaderboard', { country: country || DEFAULT_COUNTRY })}
          </span>
        </h2>
        <ul className="space-y-3">
          {leaderboard.top10.length > 0 ? (
            leaderboard.top10.map((user, index) => (
              <li
                key={user.telegramId}
                className={`flex justify-between items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  index === 0 ? 'bg-gradient-to-r [background-image:linear-gradient(to_right,#44a3dd,theme(colors.gray.700))]' : 
                  user.telegramId === telegramId ? 'bg-gray-900' : 'bg-gray-700'
                } hover:shadow-md`}
                style={{ color: textColor }}
              >
                <div className="flex items-center space-x-3">
                  {index === 0 && (
                    <img src="king.svg" alt="Top Rank Trophy" className="w-6 h-6" />
                  )}
                  <span className="font-semibold">
                    {user.rank}. {user.telegramId === telegramId ? t('you') : user.username || `User_${user.telegramId}`}
                  </span>
                </div>
                <span className="font-medium">
                  {user.totalUpgrades} {t('points')}
                </span>
              </li>
            ))
          ) : (
            <li className="text-center py-3" style={{ color: textColor }}>
              {t('no_leaderboard_data')}
            </li>
          )}
          {leaderboard.userRank && leaderboard.userRank.rank > 10 && (
            <>
              <li className="text-center py-3 text-gray-400">...</li>
              <li
                className="flex justify-between items-center py-3 px-4 bg-gray-900 rounded-lg hover:shadow-md transition-all duration-200"
                style={{ color: textColor }}
              >
                <span className="font-semibold">
                  {leaderboard.userRank.rank}. {t('you')}
                </span>
                <span className="font-medium">
                  {leaderboard.userRank.totalUpgrades} {t('points')}
                </span>
              </li>
            </>
          )}
        </ul>
      </div>

      <div
        id="bottom-nav"
        className="fixed bottom-0 left-0 w-full bg-white shadow-md flex justify-around p-2"
        style={{ backgroundColor: secondaryBgColor }}
      >
        <button
          onClick={() => navigate('/home')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('home')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-xs">{t('home')}</span>
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('tasks')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 24 24">
            <path d="M4 5h16v2H4V5zm0 4h16v2H4V9zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
          </svg>
          <span className="text-xs">{t('tasks')}</span>
        </button>
        <button
          onClick={() => navigate('/statistics')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('statistics')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4z" />
          </svg>
          <span className="text-xs">{t('statistics')}</span>
        </button>
        <button
          onClick={() => navigate('/upgrades')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('upgrade')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs">{t('upgrade')}</span>
        </button>
      </div>
    </div>
  );
}

export default Leaderboard;
