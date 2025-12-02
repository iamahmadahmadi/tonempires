import React, { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import lottie from 'lottie-web';
import LoadingComponent from '../components/LoadingComponent';

function Friends() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'fa'; // Determine RTL
  const [referrals, setReferrals] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [noMoreFriends, setNoMoreFriends] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [notification, setNotification] = useState(null);
  const lottieContainer = useRef(null);
  const noFriendsLottieContainer = useRef(null);

  // Use Telegram Web App theme parameters for consistent styling across pages
  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';

  // Telegram Web App setup
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => navigate('/home'));
    WebApp.SettingsButton.show();
    WebApp.SettingsButton.onClick(() => navigate('/settings'));
    return () => WebApp.BackButton.hide();
  }, [navigate]);

  // Fetch referral data
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';
        const response = await fetch(`https://api.telegramfaucet.me/api/user/referrals?telegramId=${telegramId}`);
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        setReferrals(data.referrals || 0);
        setEarnings(data.earnings || 0);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  // Lottie animation setup for no friends state
  useEffect(() => {
    if (friends.length === 0 && noFriendsLottieContainer.current) {
      const animation = lottie.loadAnimation({
        container: noFriendsLottieContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/assets/lottie/no-friends.json',
      });
      return () => animation.destroy();
    }
  }, [friends.length]);

  // Fetch friends list with pagination
  const loadFriends = async () => {
    if (noMoreFriends || fetching) return;
    setFetching(true);
    try {
      const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';
      const response = await fetch(`https://api.telegramfaucet.me/api/user/friends?telegramId=${telegramId}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      if (data.friends.length === 0) {
        setNoMoreFriends(true);
      } else {
        setFriends((prev) => [...prev, ...data.friends]);
        setOffset((prev) => prev + data.friends.length);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!isLoading) loadFriends();
  }, [isLoading]);

  // Invite friend via Telegram share
  const inviteFriend = () => {
    const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';
    const refLink = `https://t.me/TonEmpiresBot/app?startapp=${telegramId}`;
    const inviteUrl = `https://t.me/share/url?text=${encodeURIComponent(
      'Welcome to TON Empires! Build, Upgrade and Rule your country.'
    )}&url=${refLink}`;
    window.open(inviteUrl, '_blank');
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';
    const refLink = `https://t.me/TonEmpiresBot/app?startapp=${telegramId}`;
    navigator.clipboard.writeText(refLink)
      .then(() => {
        setNotification(t('link_copied'));
        setTimeout(() => setNotification(null), 3000);
      })
      .catch(() => setNotification(t('copy_failed')));
  };

  // Handle infinite scrolling
  const handleScroll = (e) => {
    const container = e.target;
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 20;
    if (isNearBottom) loadFriends();
  };

  // Lottie animation setup for loading state
  useEffect(() => {
    if (isLoading && lottieContainer.current) {
      const animation = lottie.loadAnimation({
        container: lottieContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/assets/lottie/loading.json',
      });
      return () => animation.destroy();
    }
  }, [isLoading]);

  // Loading state with Lottie animation
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

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen p-4"
        style={{ backgroundColor: bgColor }}
      >
        <p className="text-red-500 text-lg mb-4">{t('error')}: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{ backgroundColor: buttonColor, color: textColor }}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-roboto"
      style={{ backgroundColor: bgColor, color: textColor }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <header
        className="flex justify-between items-center p-4 shadow-md"
        style={{ background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${secondaryBgColor}, ${bgColor})` }}
      >
        <h1 className={`text-xl font-bold ${isRtl ? 'ml-auto' : 'mr-auto'}`}>{t('friends')}</h1>
        <button
          onClick={() => window.location.reload()}
          className="text-2xl hover:opacity-80 transition duration-200 focus:outline-none"
          style={{ color: buttonColor }}
        >
          ⟳
        </button>
      </header>

      <div className="mx-4 mt-4 mb-16">
        <div
          className="rounded-xl p-4 shadow-neumorphic mb-6"
          style={{ backgroundColor: secondaryBgColor }}
        >
          <h2 className="text-lg font-semibold mb-4">{t('referral_stats')}</h2>
          <div className="flex justify-between">
            <div>
              <span className="font-medium">{t('total_referrals')}: {referrals}</span>
            </div>
            <div>
              <span className="font-medium">{t('total_earnings')}:
                <div className="text-sm flex items-center">
                  <img src="https://telegramfaucet.me/notcoinPHP/assets/tfc.webp" alt="Coin" className="w-5 h-5 mx-1" />
                  {Intl.NumberFormat().format(earnings)}
                </div>
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 shadow-neumorphic mb-6"
          style={{ backgroundColor: secondaryBgColor }}
        >
          <h2 className="text-lg font-semibold mb-4">{t('invite_friends')}</h2>
          <p>Telegram User: 5000 coins</p>
          <p>Premium User: 15,000 coins</p>
          <div className="flex justify-between mt-3">
            <button
              onClick={inviteFriend}
              className="px-4 py-2 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{ backgroundColor: buttonColor, color: textColor }}
            >
              {t('invite_button')}
            </button>
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{ backgroundColor: '#555', color: textColor }}
            >
              {t('copy_link')}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="p-2 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{ backgroundColor: '#555' }}
            >
              <img src="/assets/images/info.svg" alt="Info" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div
          className="rounded-xl p-4 shadow-neumorphic"
          style={{ backgroundColor: secondaryBgColor }}
        >
          <h2 className="text-lg font-semibold mb-4">{t('friends_list')}</h2>
          {friends.length === 0 ? (
            <div className="flex flex-col items-center">
              <div ref={noFriendsLottieContainer} className="w-24 h-24 mb-3"></div>
              <p className="text-sm">{t('no_friends_yet')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto" onScroll={handleScroll}>
              {friends.map((friend, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{friend.username || friend.telegram_id}</span>
                  <span className="flex items-center" style={{ color: buttonColor }}>
                    <img src="https://telegramfaucet.me/notcoinPHP/assets/tfc.webp" alt="Coin" className="w-5 h-5 mx-1" />
                    {Intl.NumberFormat().format(friend.balance)}
                  </span>
                </div>
              ))}
              {fetching && <p className="text-center text-sm">{t('loading_more')}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Invite Information */}
{modalOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
    onClick={() => setModalOpen(false)}
  >
    <div
      className="rounded-xl p-5 w-11/12 max-w-md relative shadow-lg"
      style={{ backgroundColor: secondaryBgColor, color: textColor }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className="absolute top-2 right-3 text-2xl cursor-pointer hover:opacity-80 transition"
        onClick={() => setModalOpen(false)}
      >
        ×
      </span>
      <h2 className="text-2xl mb-3 text-center font-semibold">{t('invite_friends')}</h2>
      <div className="space-y-3 text-sm">
        <p>{t('inviting_friend')}</p>
        <ul className="list-decimal list-inside space-y-2">
          <li>{t('helps_country_grow')}</li>
          <li>{t('helps_friend_join')}</li>
          <li>{t('stars_bonus')}</li>
          <li>{t('unlock_gifts')}</li>
          <li>{t('president_chance')}</li>
        </ul>
        <p className="mt-4 font-semibold text-center">{t('call_to_action')}</p>
      </div>
    </div>
  </div>
)}

      {/* Notification */}
      {notification && (
        <div
          className="fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg"
          style={{ backgroundColor: secondaryBgColor, color: textColor }}
        >
          {notification}
        </div>
      )}

      <div
        id="bottom-nav"
        className={`fixed bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full shadow-md flex justify-around p-2`}
        style={{ backgroundColor: secondaryBgColor }}
      >
        <button
          onClick={() => navigate('/home')}
          className="flex flex-col items-center text-gray-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('home')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-xs" style={{ color: textColor }}>{t('home')}</span>
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('tasks')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 5h16v2H4V5zm0 4h16v2H4V9zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
          </svg>
          <span className="text-xs" style={{ color: textColor }}>{t('tasks')}</span>
        </button>
        <button
          onClick={() => navigate('/statistics')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('statistics')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4z" />
          </svg>
          <span className="text-xs" style={{ color: textColor }}>{t('statistics')}</span>
        </button>
        <button
          onClick={() => navigate('/upgrades')}
          className="flex flex-col items-center text-gray-400 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={t('upgrade')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs" style={{ color: textColor }}>{t('upgrade')}</span>
        </button>
      </div>
    </div>
  );
}

export default Friends;