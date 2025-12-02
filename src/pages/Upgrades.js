import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WebApp from '@twa-dev/sdk';
import { DiscountContext } from '../DiscountContext';
import Lottie from 'react-lottie-player';
import fireworksAnimation from '../assets/animations/fireworks.json';
import LoadingComponent from '../components/LoadingComponent';
//'./../assets/animations/fireworks.json';

function PresidentBanner({ country, onClose }) {
  const { t } = useTranslation();
  const normalizedCountry = country.toLowerCase().replace(/\s+/g, '_');
  const imageSrc = `/assets/images/presidents/${normalizedCountry}.jpg`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-800 p-6 rounded-xl shadow-neumorphic max-w-sm w-full"
        style={{ backgroundColor: WebApp.themeParams.bg_color || '#1a1a1a' }}
      >
        {/* Fireworks Animation */}
        <Lottie
          loop
          animationData={fireworksAnimation}
          play
          style={{ width: '100%', height: '200px', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
        {/* President Image */}
        <img
          src={imageSrc}
          alt={`${country} President`}
          className="relative z-10 w-32 h-32 mx-auto rounded-full object-cover"
          onError={(e) => {e.target.style.display = 'none'}//{ e.target.src = '/assets/images/presidents/default_president.jpg'; }
        }
        />
        {/* Congratulations Text */}
        <p
          className="relative z-10 text-center mt-4 text-lg font-semibold"
          style={{ color: WebApp.themeParams.text_color || '#ffffff' }}
        >
          {t('congratulations_president')}
        </p>
      </div>
    </div>
  );
}

function Upgrades() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';
  const { discount } = useContext(DiscountContext);
  const [groupedUpgrades, setGroupedUpgrades] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coinBalance, setCoinBalance] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showPresidentBanner, setShowPresidentBanner] = useState(false);
  const [presidentCountry, setPresidentCountry] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const buttonTextColor = theme.button_text_color || '#ffffff';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';
  const thirdBgColor = '#0088cc';
  const fourthBgColor = '#42424259';

  useEffect(() => {
    async function fetchData() {
      try {
        const telegramId = WebApp.initDataUnsafe.user?.id || 84895335;

        const [upgradesRes, userRes, roleRes] = await Promise.all([
          fetch(`https://api.telegramfaucet.me/api/upgrades?telegramId=${telegramId}`),
          fetch(`https://api.telegramfaucet.me/api/user?telegramId=${telegramId}`),
          fetch(`https://api.telegramfaucet.me/api/user/role?telegramId=${telegramId}`),
        ]);

        if (!upgradesRes.ok || !userRes.ok || !roleRes.ok) {
          throw new Error(t('upgrade_failed'));
        }

        const upgradesData = await upgradesRes.json();
        const userData = await userRes.json();
        const roleData = await roleRes.json();

        const groups = upgradesData.reduce((acc, upgrade) => {
          const group = upgrade.group_name || 'Other';
          const normalizedGroup = group.toLowerCase().replace(/\s+/g, '_');
          if (!acc[normalizedGroup]) {
            acc[normalizedGroup] = [];
          }
          acc[normalizedGroup].push({ ...upgrade, original_group_name: group });
          return acc;
        }, {});
        setGroupedUpgrades(groups);

        setCoinBalance(userData.earnings || 0);
        setUserRole(roleData.role);
        setPresidentCountry(userData.country.name); // Store country name for banner

        const selectedGroupFromState = location.state?.group;
        if (selectedGroupFromState && groups[selectedGroupFromState]) {
          setSelectedGroup(selectedGroupFromState);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [t, location.state]);

  useEffect(() => {
    if (WebApp) {
      WebApp.SettingsButton.show();
      WebApp.SettingsButton.onClick(() => navigate('/settings'));
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => {
        window.history.back();
      });
      return () => {
        WebApp.BackButton.hide();
      };
    }
  }, []);

  useEffect(() => {
    if (showPresidentBanner) {
      const timer = setTimeout(() => {
        setShowPresidentBanner(false);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showPresidentBanner]);

  const handleUpgradeWithCoins = async (upgrade) => {
    const telegramId = WebApp.initDataUnsafe.user?.id || 84895335;

    try {
      const res = await fetch('https://api.telegramfaucet.me/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, upgradeId: upgrade.id, useStars: false }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t('upgrade_failed'));
      }

      const data = await res.json();

      WebApp.showAlert(t('upgrade_success', { name: t(upgrade.name), level: data.newLevel }));

      // Check role after upgrade
      const roleRes = await fetch(`https://api.telegramfaucet.me/api/user/role?telegramId=${telegramId}`);
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        if (roleData.role === 'President' && userRole !== 'President') {
          setShowPresidentBanner(true); // Show banner if newly President
        }
        setUserRole(roleData.role);
      }

      setGroupedUpgrades((prev) => {
        const newGroups = { ...prev };
        const normalizedGroup = upgrade.original_group_name.toLowerCase().replace(/\s+/g, '_');
        newGroups[normalizedGroup] = newGroups[normalizedGroup].map((u) =>
          u.id === upgrade.id
            ? { ...u, level: data.newLevel, cost: u.cost * 2, starCost: u.starCost * 2 }
            : u
        );
        return newGroups;
      });

      // Deduct the discounted cost from local balance.  The server still
      // charges the full cost, but this adjustment reflects the discount
      // in the UI.  A production implementation would send the discount to
      // the server and rely on it to calculate the final cost.
      const discountFactor = discount > 1 ? discount / 100 : discount;
      const discountedCoins = Math.round(upgrade.cost * (1 - discountFactor));
      setCoinBalance((prev) => prev - discountedCoins);
    } catch (error) {
      console.error('Error upgrading with coins:', error);
    }
  };

  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
  };
  
  const handleUpgradeWithStars = async (upgrade) => {
    const telegramId = WebApp.initDataUnsafe.user?.id || 84895335;

    try {
      // Apply discount to star cost if available
      const discountFactor = discount > 1 ? discount / 100 : discount;
      const discountedStarCost = Math.round(upgrade.starCost * (1 - discountFactor));

      const invoiceRes = await fetch('https://api.telegramfaucet.me/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          upgradeId: upgrade.id,
          // Send the discounted star cost to the server.  The server
          // should honour the discount and create an invoice for this amount.
          starCost: discountedStarCost,
          title: t('upgrade_title', { name: upgrade.name }),
          description: t('upgrade_description', { name: upgrade.name, level: upgrade.level + 1 }),
        }),
      });

      if (!invoiceRes.ok) {
        throw new Error(t('payment_failed'));
      }

      const { invoiceLink } = await invoiceRes.json();

      WebApp.openInvoice(invoiceLink, async (status) => {
        if (status === 'paid') {
          const res = await fetch('https://api.telegramfaucet.me/api/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId, upgradeId: upgrade.id, useStars: true }),
          });

          if (!res.ok) {
            throw new Error(t('upgrade_failed'));
          }

          const data = await res.json();
          WebApp.showAlert(t('upgrade_success', { name: upgrade.name, level: data.newLevel }));

          // Check role after upgrade
          const roleRes = await fetch(`https://api.telegramfaucet.me/api/user/role?telegramId=${telegramId}`);
          if (roleRes.ok) {
            const roleData = await roleRes.json();
            if (roleData.role === 'President' && userRole !== 'President') {
              setShowPresidentBanner(true); // Show banner if newly President
            }
            setUserRole(roleData.role);
          }

          setGroupedUpgrades((prev) => {
            const newGroups = { ...prev };
            const normalizedGroup = upgrade.original_group_name.toLowerCase().replace(/\s+/g, '_');
            newGroups[normalizedGroup] = newGroups[normalizedGroup].map((u) =>
              u.id === upgrade.id
                ? { ...u, level: data.newLevel, cost: u.cost * 2, starCost: u.starCost * 2 }
                : u
            );
            return newGroups;
          });
        } else if (status === 'cancelled' || status === 'failed') {
        }
      });
    } catch (error) {
      console.error('Error initiating stars payment:', error);
    }
  };

  const getImageFilename = (group) => {
    return group.toLowerCase().replace(/\s+/g, '-') + '.svg';
  };

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
      <div
        className="flex flex-col justify-center items-center h-screen p-4"
        style={{ backgroundColor: bgColor, color: textColor }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <p className="text-red-500 text-lg mb-4">{t('error')}: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-roboto pb-16"
      style={{ backgroundColor: bgColor, color: textColor }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {showPresidentBanner && (
        <PresidentBanner
          country={presidentCountry}
          onClose={() => setShowPresidentBanner(false)}
        />
      )}
      <div className="mx-4 mt-4">
        <div className="mb-4">
          <div className="flex items-center">
              <span className="text-sm font-medium">{t('balance')}:</span>
              <div className="ml-2 flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg px-3 py-1">
                <img
                  src="/assets/images/tfc-coin.svg"
                  alt="TFC Coin"
                  className="w-5 h-5 mr-2"
                />
                <span
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}
                >
                  {formatNumber(coinBalance)}
                </span>
              </div>
            </div>
        </div>

        {selectedGroup ? (
          <div>
             <img
             onClick={() => setSelectedGroup(null)}
                  src="/back.svg"
                  alt="TFC Coin"
                  className="w-5 h-5 mr-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            
            {/* <button
            
              onClick={() => setSelectedGroup(null)}
              className="mb-4 text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('back_to_groups')}
            >
              {t('back_to_groups')}
            </button> */}
            <button
            
         onClick={() => setSelectedGroup(null)}
              className="mb-4 text-white-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('back_to_groups')}
            >
              {t('back_to_groups')}
         
        </button>
            
            {/* <h2 className="text-2xl font-semibold mb-4">
              {t(selectedGroup)}
            </h2> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedUpgrades[selectedGroup].map((upgrade) => (
                <div
                  key={upgrade.id}
                  className="bg-gray-800 rounded-xl shadow-neumorphic hover:shadow-xl transition-shadow duration-300"
                  style={{ backgroundColor: fourthBgColor }}
                >
                  <h3 className="text-xl font-medium mb-2">{t(upgrade.name)}</h3>
                  <p className="text-sm">
                    {t('current_level')}: {upgrade.level}
                  </p>
                  {/* Display the cost with any active discount applied.  If a discount
                      is active the original price is shown struck through and the
                      discounted price is shown next to it. */}
                  <p className="text-sm">
                    {t('cost')}: {discount > 0 && (
                      <span className="line-through text-gray-400 mr-1">
                        {formatNumber(upgrade.cost)}
                      </span>
                    )}
                    {(() => {
                      // Normalize discount values greater than 1 to decimals. E.g. 40 → 0.40
                      const discountFactor = discount > 1 ? discount / 100 : discount;
                      const discountedCoins = Math.round(upgrade.cost * (1 - discountFactor));
                      return `${formatNumber(discountedCoins)} ${t('coins')}`;
                    })()} {t('or')} {(() => {
                      const discountFactor = discount > 1 ? discount / 100 : discount;
                      // Only display strikethrough for stars if a discount is active
                      if (discount > 0) {
                        return (
                          <>
                            <span className="line-through text-gray-400 mr-1">
                              {formatNumber(upgrade.starCost)}
                            </span>
                            {formatNumber(Math.round(upgrade.starCost * (1 - discountFactor)))}
                          </>
                        );
                      }
                      return formatNumber(upgrade.starCost);
                    })()} {t('stars')}
                  </p>
                  <div className="mt-4 space-y-2">
                    {(() => {
                      const discountFactor = discount > 1 ? discount / 100 : discount;
                      const discountedCoins = Math.round(upgrade.cost * (1 - discountFactor));
                      return coinBalance >= discountedCoins;
                    })() ? (
                      <button
                        onClick={() => handleUpgradeWithCoins(upgrade)}
                        className="w-full px-4 py-2 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                        aria-label={t('upgrade', { name: upgrade.name })}
                      >
                        {t('upgrade')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgradeWithStars(upgrade)}
                        className="w-full px-4 py-2 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        style={{ backgroundColor: '#facc15', color: buttonTextColor }}
                        aria-label={t('upgrade_with_stars', { name: upgrade.name })}
                      >
                        {t('upgrade_with_stars')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.keys(groupedUpgrades).map((group) => (
              <div
                key={group}
                className="bg-gray-800 rounded-xl shadow-neumorphic hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedGroup(group)}
                style={{ backgroundColor: thirdBgColor }}
              >
                <img
                  src={`/assets/images/${getImageFilename(group)}`}
                  alt={group}
                  className="w-full h-16 mb-2 rounded-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/default-group.svg';
                  }}
                />
                <h2 className="text-lg font-semibold text-center">{t(group)}</h2>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`fixed bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full shadow-md flex justify-around p-2`}
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
          className="flex flex-col items-center text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
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

export default Upgrades;