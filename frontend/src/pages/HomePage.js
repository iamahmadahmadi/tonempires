import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import CountryImage from '../components/CountryImage';
import LoadingComponent from '../components/LoadingComponent';
import { apiRequest, createFallbackUserData, getCachedUserData, setCachedUserData, readJsonStorage, saveSettings } from '../services/api';
import { WebApp, getTelegramHeaders, getTelegramLanguage, getTelegramUserId } from '../utils/telegramWebApp';


// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-4">
          <p>Error in {this.props.componentName}: {this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Define upgrade groups with original names
const upgradeGroups = {
  culture: { original_group_name: 'Culture', upgrades: ['Food', 'Clothes', 'Cinema'] },
  education: { original_group_name: 'Education', upgrades: ['Schools', 'Universities', 'AI'] },
  energy: { original_group_name: 'Energy', upgrades: ['Power Plants', 'Renewable Energy', 'Energy Efficiency'] },
  environment: { original_group_name: 'Environment', upgrades: ['Municipality', 'Waste Management', 'Agriculture'] },
  financial: { original_group_name: 'Financial', upgrades: ['Banks', 'Exchanges', 'Governments', 'Stocks', 'Minerals', 'Jobs'] },
  healthcare: { original_group_name: 'Healthcare', upgrades: ['Pharmaceutical Industry', 'Hospitals', 'Clinics'] },
  technology: { original_group_name: 'Technology', upgrades: ['Space Program', 'Research Labs', 'Internet Infrastructure'] },
  transportation: { original_group_name: 'Transportation', upgrades: ['Roads', 'Public Transit', 'Airports'] },
};

// Define group colors and icons
const groupStyles = {
  culture: { color: '#ec4899', icon: '/assets/images/culturewhite.svg', gradient: 'from-pink-500 to-purple-500' },
  education: { color: '#3b82f6', icon: '/assets/images/educationwhite.svg', gradient: 'from-blue-500 to-cyan-500' },
  energy: { color: '#f59e0b', icon: '/assets/images/energywhite.svg', gradient: 'from-yellow-500 to-orange-500' },
  environment: { color: '#10b981', icon: '/assets/images/environmentwhite.svg', gradient: 'from-green-500 to-teal-500' },
  financial: { color: '#84cc16', icon: '/assets/images/financialwhite.svg', gradient: 'from-lime-500 to-emerald-500' },
  healthcare: { color: '#ef4444', icon: '/assets/images/healthcarewhite.svg', gradient: 'from-red-500 to-pink-500' },
  technology: { color: '#6366f1', icon: '/assets/images/technologywhite.svg', gradient: 'from-indigo-500 to-blue-500' },
  transportation: { color: '#f97316', icon: '/assets/images/transportationwhite.svg', gradient: 'from-orange-500 to-red-500' },
};

// Define upgrade costs with exponential formula (baseCost * 2^level)
const upgradeCosts = {
  Food: { baseCost: 1000 },
  Clothes: { baseCost: 2000 },
  Cinema: { baseCost: 4000 },
  Schools: { baseCost: 2000 },
  Universities: { baseCost: 2500 },
  AI: { baseCost: 3000 },
  'Power Plants': { baseCost: 1800 },
  'Renewable Energy': { baseCost: 2200 },
  'Energy Efficiency': { baseCost: 2400 },
  Municipality: { baseCost: 1700 },
  'Waste Management': { baseCost: 1900 },
  Agriculture: { baseCost: 1600 },
  Banks: { baseCost: 3000 },
  Exchanges: { baseCost: 3200 },
  Governments: { baseCost: 3500 },
  Stocks: { baseCost: 2800 },
  Minerals: { baseCost: 2700 },
  Jobs: { baseCost: 2600 },
  'Pharmaceutical Industry': { baseCost: 4000 },
  Hospitals: { baseCost: 3800 },
  Clinics: { baseCost: 3600 },
  'Space Program': { baseCost: 5000 },
  'Research Labs': { baseCost: 4800 },
  'Internet Infrastructure': { baseCost: 4600 },
  Roads: { baseCost: 2000 },
  'Public Transit': { baseCost: 2200 },
  Airports: { baseCost: 2400 },
};

// Simplified upgradeGroups for CountryImage
const countryImageUpgradeGroups = Object.fromEntries(
  Object.entries(upgradeGroups).map(([group, data]) => [group, data.upgrades])
);

function NavBar({ userData }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';
  const theme = WebApp.themeParams;
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';

  return (
    <div className={`absolute top-36 z-20 flex flex-col space-y-2 ${isRtl ? 'left-4' : 'right-4'}`}>
      <button
        onClick={() => navigate('/frens', { state: { userData } })}
        className="bg-white text-gray-900 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label={t('invite_friends')}
      >
        <img src="/invitefriends.svg" alt={t('invite_friends')} className="w-10 h-10 mx-auto" />
        <p className="text-sm text-center hover:text-blue-400 hidden sm:block">{t('invite_friends')}</p>
      </button>
      <button
        onClick={() => navigate('/leaderboard', { state: { userData } })}
        className="bg-white text-gray-900 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label={t('leaderboard')}
      >
        <img src="/leaderboard.svg" alt={t('leaderboard')} className="w-10 h-10 mx-auto" />
        <p className="text-sm text-center hover:text-blue-400 hidden sm:block">{t('leaderboard')}</p>
      </button>
    </div>
  );
}

function Leaderboard({ data, isLoading, error, userUpgrades, telegramId }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';
  const theme = WebApp.themeParams;
  const textColor = theme.text_color || '#ffffff';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';

  if (isLoading) return <div className="text-sm" style={{ color: textColor }}>{t('loading_leaderboard')}</div>;
  if (error) return <div className="text-sm text-red-500" style={{ color: textColor }}>{t('leaderboard_error')}: {error}</div>;
  if (!data || data.length === 0) return null;

  const topUpgrades = data[0]?.totalUpgrades || 0;
  const isUserPresident = data.some((user) => user.telegramId === telegramId && user.isPresident);
  const progress = topUpgrades > 0 ? Math.min((userUpgrades / topUpgrades) * 100, 100) : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-3 shadow-neumorphic w-full max-w-xs mx-auto" style={{ backgroundColor: secondaryBgColor }}>
      {userUpgrades !== null && (
        <div className="mt-1">
          {!isUserPresident && <p className="text-sm font-medium" style={{ color: textColor }}>{t('progress_to_president')}</p>}
          {isUserPresident && <p className="text-xs font-semibold" style={{ color: textColor }}>{t('you_are_president')}</p>}
          <div className="bg-gray-700 h-2 rounded mt-2 relative overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded transition-all duration-300 ${isUserPresident ? 'ring-2 ring-yellow-500' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: textColor }}>{t('your_upgrades')}: {userUpgrades} / {topUpgrades}</p>
        </div>
      )}
    </div>
  );
}

function UpgradeRadialChart({ userData, onGroupClick, startTour }) {
  const { t, i18n } = useTranslation();
  const theme = WebApp.themeParams;
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';
  const [selectedGroup, setSelectedGroup] = useState(null);

  const calculateAverageLevel = (groupUpgrades) => {
    if (!userData || !userData.upgrades) return 0;
    const upgradesInGroup = groupUpgrades.upgrades.filter((upgrade) => upgrade in userData.upgrades);
    if (upgradesInGroup.length === 0) return 0;
    const totalLevel = upgradesInGroup.reduce((sum, upgrade) => sum + (userData.upgrades[upgrade] || 0), 0);
    return Number((totalLevel / upgradesInGroup.length).toFixed(1));
  };

  const calculateSummaryScore = () => {
    const groupNames = Object.keys(upgradeGroups);
    const groupLevels = groupNames.map((group) => calculateAverageLevel(upgradeGroups[group]));
    const totalScore = groupLevels.reduce((sum, level) => sum + level, 0);
    const maxPossibleScore = groupNames.length * 100;
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  const calculateAffordableUpgrades = (groupUpgrades) => {
    if (!userData || !userData.upgrades || !userData.earnings) return 0;
    let affordableCount = 0;
    const MAX_LEVEL = 100;
    groupUpgrades.upgrades.forEach((upgrade) => {
      const currentLevel = userData.upgrades[upgrade] || 0;
      if (currentLevel >= MAX_LEVEL) return;
      const costData = upgradeCosts[upgrade];
      if (!costData) return;
      const nextLevelCost = costData.baseCost * Math.pow(2, currentLevel);
      if (userData.earnings >= nextLevelCost) {
        affordableCount++;
      }
    });
    return affordableCount;
  };

  const getColorForLevel = (level) => {
    const red = Math.round(255 * (1 - level / 100));
    const green = Math.round(255 * (level / 100));
    return `rgb(${red}, ${green}, 0)`;
  };

  const groupNames = Object.keys(upgradeGroups);
  const averages = groupNames.map((group) => calculateAverageLevel(upgradeGroups[group]));
  const affordableCounts = groupNames.map((group) => calculateAffordableUpgrades(upgradeGroups[group]));

  return (
    <div id="upgrade-chart" className="bg-gray-800 rounded-xl p-4 shadow-neumorphic" style={{ backgroundColor: secondaryBgColor }}>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          .pulse {
            animation: pulse 2s infinite;
          }
          .notification-badge {
            position: absolute;
            top: -8px;
            ${isRtl ? 'left: -8px;' : 'right: -8px;'}
            background-color: #ef4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
        `}
      </style>
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold mr-2">{t('upgrade_groups')}</h2>
        <button
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium hover:bg-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: buttonColor, color: textColor }}
          title={t('take_a_quick_tour')}
          aria-label={t('take_a_quick_tour')}
          onClick={startTour}
        >
          ?
        </button>
      </div>
      <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        <div className="relative w-48 h-48 pulse">
          <CircularProgressbar
            value={calculateSummaryScore()}
            text={`${calculateSummaryScore()}%`}
            styles={buildStyles({
              pathColor: `url(#gradient)`,
              textColor,
              trailColor: '#4b5563',
              textSize: '16px',
            })}
          />
          <svg style={{ height: 0 }}>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 top-16 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium">{t('summary_score')}</p>
              <p className="text-xs text-gray-400">{t('overall_progress')}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="grid grid-cols-2 gap-2">
            {groupNames.map((group, idx) => (
              <button
                key={group}
                onClick={() => onGroupClick(group)}
                className="relative flex items-center p-1 rounded-lg transition-all duration-300"
                style={{ backgroundColor: '#374151', color: textColor }}
                data-tooltip-id="group-tooltip"
                data-tooltip-content={`${t(upgradeGroups[group].original_group_name)}: ${averages[idx]}${affordableCounts[idx] > 0 ? `, ${t('affordable_upgrades', { count: affordableCounts[idx] })}` : ''}`}
              >
                <div className="w-5 h-5 mr-1">
                  <CircularProgressbar
                    value={averages[idx]}
                    maxValue={100}
                    styles={buildStyles({
                      pathColor: getColorForLevel(averages[idx]),
                      trailColor: '#4b5563',
                      pathTransitionDuration: 0.5,
                    })}
                  />
                </div>
                <img src={groupStyles[group].icon} alt={`${t(upgradeGroups[group].original_group_name)} icon`} className="w-4 h-4 mr-1" />
                {/* <span className="text-xs capitalize truncate">{t(upgradeGroups[group].original_group_name)}</span> */}
                {affordableCounts[idx] > 0 && (
                  <span className="notification-badge">{affordableCounts[idx]}</span>
                )}
              </button>
            ))}
          </div>
          <Tooltip id="group-tooltip" place="top" style={{ backgroundColor: secondaryBgColor, color: textColor }} />
        </div>
      </div>
      {selectedGroup && (
        <div className="mt-4 bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={groupStyles[selectedGroup].icon} alt={`${t(upgradeGroups[selectedGroup].original_group_name)} icon`} className="w-6 h-6 mr-3" />
              <span className="text-sm font-medium capitalize">{t(upgradeGroups[selectedGroup].original_group_name)}</span>
            </div>
            <button onClick={() => onGroupClick(selectedGroup)} className="text-xs text-blue-400 hover:underline">
              {t('view_details')}
            </button>
          </div>
          <p className="text-xs mt-2">{t('average_level')}: {calculateAverageLevel(upgradeGroups[selectedGroup])}</p>
          <button onClick={() => setSelectedGroup(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-300">
            {t('close')}
          </button>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const { t, i18n } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [userUpgrades, setUserUpgrades] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const navigate = useNavigate();
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';

  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';
  const telegramId = getTelegramUserId();
  const supportedLngs = ['de', 'en', 'fa', 'es', 'fr', 'ar', 'ru', 'hy', 'zh', 'ja', 'ko', 'hi', 'bn', 'id', 'tr'];

  useEffect(() => {
    const linkId = 'inter-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const formatNumber = (num) => num?.toLocaleString(i18n.language, { maximumFractionDigits: 0 }) || '0';
  const formatBalance = (num) => num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';

  useEffect(() => {
    const loadSettings = async () => {
      let savedSettings = null;
      const defaultSettings = { language: 'en', music: true, soundEffects: true, animations: true, walletConnected: false };

      try {
        savedSettings = readJsonStorage('settings', null);
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error);
      }

      const telegramLanguage = getTelegramLanguage();
      const shouldUseTelegramLanguage =
        supportedLngs.includes(telegramLanguage) &&
        (!savedSettings || savedSettings.language !== telegramLanguage || i18n.language !== telegramLanguage);

      if (shouldUseTelegramLanguage) savedSettings = { ...defaultSettings, language: telegramLanguage };
      else if (!savedSettings) savedSettings = defaultSettings;

      try {
        let settings = await apiRequest(`/api/settings/${telegramId}`, { method: 'GET', headers: getTelegramHeaders() }, 5000);
        if (typeof settings === 'string') settings = JSON.parse(settings);
        settings = settings.settings || settings;

        if (shouldUseTelegramLanguage) settings.language = telegramLanguage;

        savedSettings = {
          language: supportedLngs.includes(settings.language) ? settings.language : telegramLanguage,
          music: settings.music ?? true,
          soundEffects: settings.soundEffects ?? true,
          animations: settings.animations ?? true,
          walletConnected: settings.walletConnected ?? false,
        };
      } catch (error) {
        console.error('Failed to fetch settings from API:', error);
      }

      try {
        localStorage.setItem('settings', JSON.stringify(savedSettings));
        await i18n.changeLanguage(savedSettings.language);

        if (shouldUseTelegramLanguage) {
          await saveSettings(telegramId, savedSettings, getTelegramHeaders());
        }
      } catch (error) {
        console.error('Failed to save or apply settings:', error);
        await i18n.changeLanguage('en');
      }
    };

    loadSettings();
  }, [i18n, telegramId]);

  const handleFetchError = useCallback(async () => {
    try {
      localStorage.setItem('openedApp', '1');
    } catch (storageError) {
      console.error('Error setting localStorage:', storageError);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await apiRequest(`/api/user?telegramId=${telegramId}`);
        console.log('API response:', data);

        if (data.error) throw new Error(data.error);

        if (data && data.user && data.country && data.upgrades) {
          const nextUserData = {
            country: data.country.name || 'Unknown',
            population: data.country.population || 0,
            points: data.user.points || 0,
            earnings: data.earnings || 0,
            upgrades: data.upgrades || {},
            countryId: data.country.id,
            telegramId: data.user.telegramId,
          };
          setUserData(nextUserData);
          setCachedUserData(telegramId, nextUserData);
          setIsLoading(false);

          try {
            const nextLeaderboardData = await apiRequest(`/api/leaderboard?countryId=${data.country.id}`);
            setLeaderboardData(Array.isArray(nextLeaderboardData) ? nextLeaderboardData : []);
          } catch (leaderboardErr) {
            console.error('Error fetching leaderboard:', leaderboardErr);
            setLeaderboardError(leaderboardErr.message);
          } finally {
            setIsLeaderboardLoading(false);
          }

          try {
            const upgradesData = await apiRequest(`/api/user/upgrades?telegramId=${telegramId}`);
            setUserUpgrades(upgradesData.totalUpgrades || 0);
          } catch (upgradesErr) {
            console.error('Error fetching user upgrades:', upgradesErr);
            setUserUpgrades(0);
          }

          try {
            const rankData = await apiRequest(`/api/user/rank?telegramId=${telegramId}`);
            setUserRank(Number(rankData.rank) > 0 ? Number(rankData.rank) : null);
          } catch (rankErr) {
            console.error('Error fetching user rank:', rankErr);
            setUserRank(null);
          }
        } else {
          console.warn('Incomplete user data received.');
          await handleFetchError();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
        setUserData(getCachedUserData(telegramId) || createFallbackUserData(telegramId));
        setLeaderboardData([]);
        setUserUpgrades(0);
        setUserRank(null);
        await handleFetchError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [telegramId, handleFetchError]);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
    }
  }, []);

  const startTour = useCallback(() => {
    introJs().setOptions({
      steps: [
        { element: '#country-info', intro: t('tour_country_info') },
        { element: '#leaderboard', intro: t('tour_leaderboard'), skipIfMissing: true },
        { element: '#earnings-section', intro: t('tour_earnings_section') },
        { element: '#upgrade-chart', intro: t('tour_upgrade_chart') },
        { element: '#bottom-nav', intro: t('tour_bottom_nav') },
      ],
      showProgress: true,
      nextLabel: t('Next ▶'),
      prevLabel: t('◀ Back'),
      doneLabel: t('Finish'),
      isRtl: isRtl,
    }).start();
  }, [t, isRtl]);

  const handleGroupClick = useCallback((group) => navigate('/upgrades', { state: { group } }), [navigate]);

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

  return (
    <div className="min-h-screen pb-16 relative" style={{ backgroundColor: bgColor, color: textColor }} dir={isRtl ? 'rtl' : 'ltr'}>
      <NavBar userData={userData} />
      <div className="mx-4">
        {error && (
          <div className="bg-red-900 bg-opacity-50 p-4 rounded-xl mb-4" style={{ color: textColor }}>
            <p className="text-sm">{t('error')}: {error}.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 rounded-lg shadow-md hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: buttonColor, color: textColor }}
            >
              {t('retry')}
            </button>
          </div>
        )}

        <div id="country-info" className="relative bg-gray-800 rounded-xl shadow-neumorphic mb-2 min-h-24" style={{ backgroundColor: secondaryBgColor }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-1">
            <div className="flex items-center">
              <ErrorBoundary componentName="CountryImage">
                <CountryImage
                  userData={userData}
                  upgrades={userData?.upgrades || {}}
                  upgradeGroups={countryImageUpgradeGroups}
                  onMouseEnter={(geo) => console.log(`Entered: ${geo.id}`)}
                  onMouseLeave={() => console.log('Left')}
                />
              </ErrorBoundary>
              <h1 className="text-xl font-bold ml-4">
                {typeof userData?.country === 'string' ? userData.country : t('unknown')}
              </h1>
            </div>
            <div id="leaderboard" className="w-full sm:w-auto">
              <Leaderboard
                data={leaderboardData}
                isLoading={isLeaderboardLoading}
                error={leaderboardError}
                userUpgrades={userUpgrades}
                telegramId={telegramId}
              />
            </div>
          </div>
        </div>

        <div id="earnings-section" className="bg-gray-800 rounded-xl p-4 shadow-neumorphic mb-2" style={{ backgroundColor: secondaryBgColor }}>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-medium">{t('balance')}:</span>
              <div className="ml-2 flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg px-3 py-1">
                <img src="/assets/images/tfc-coin.svg" alt="TFC Coin" className="w-5 h-5 mr-2" />
                <span className="text-lg font-semibold" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                  {formatBalance(userData?.earnings)}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{t('ranking')}:</span>
              <div className="ml-2 flex items-center bg-gradient-to-r from-green-500 to-teal-500 rounded-lg px-3 py-1">
                <img src="/assets/images/rank.svg" alt="Ranking Icon" className="w-5 h-5 mr-2" />
                <span className="text-lg font-semibold" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                  {userRank !== null ? t('you_are_ranking', { rank: userRank, total: userData?.population }) : t('loading')}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{t('points')}:</span>
              <div className="ml-2 flex items-center bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg px-3 py-1">
                <img src="/assets/images/points.svg" alt="Points Icon" className="w-5 h-5 mr-2" />
                <span className="text-lg font-semibold" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                  {formatNumber(userData?.points)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <UpgradeRadialChart userData={userData} onGroupClick={handleGroupClick} startTour={startTour} />
      </div>

      <div
        id="bottom-nav"
        className={`fixed bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full bg-white shadow-md flex justify-around p-2`}
        style={{ backgroundColor: secondaryBgColor }}
      >
        <button
          onClick={() => navigate('/home')}
          className="flex flex-col items-center text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
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

export default HomePage;
