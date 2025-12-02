import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import LoadingComponent from '../components/LoadingComponent';

function TasksPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa' || i18n.language === 'ar';
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const [collapsedSections, setCollapsedSections] = useState({
    rules: true,
    learn: true,
  });
  const [processingTask, setProcessingTask] = useState(null);
  const [timer, setTimer] = useState(null);
  const [sonarLoaded, setSonarLoaded] = useState(false);
  // Track the number of times the user has completed the Watch Ads task.  This
  // state is hydrated from localStorage on mount and updated whenever the
  // user successfully watches an ad.  Storing this value locally allows us
  // to display the upcoming reward amount without making an additional
  // roundtrip to the backend.
  const [watchAdsCount, setWatchAdsCount] = useState(0);

  // Dynamically load the Telega and Adsgram SDKs when needed.  These
  // helpers return a promise that resolves once the respective script
  // has loaded or immediately if the SDK is already present.  They
  // reject only if the script fails to load; consumers can decide
  // whether to continue on failure.
  const loadTelega = () => {
    return new Promise((resolve, reject) => {
      if (window.TelegaIn && window.TelegaIn.AdsController) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://inapp.telega.io/sdk/v1/sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const loadAdsgram = () => {
    return new Promise((resolve, reject) => {
      if (window.Adsgram) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sad.adsgram.ai/js/sad.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const buttonTextColor = theme.button_text_color || '#ffffff';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';

  const basePoints = { invite_friends: 1, watch_ads: 1, check_telegram_faucet: 1 };

  const rewardUser = (task) => {
    // Update the completion_count for this task locally
    setTasks(prev => prev.map(t => {
      if (t.task_name === task.task_name) {
        const newCount = (t.completion_count || 0) + 1;
        return { ...t, completion_count: newCount };
      }
      return t;
    }));
    // Special handling for Watch Ads: increment the ad watch counter and
    // persist it to localStorage so that the reward display persists
    // across sessions.  We use the Telegram user ID to namespace the
    // key so multiple users do not collide in the same browser.
    if (task.task_name === 'Watch Ads') {
      const userId = WebApp.initDataUnsafe.user?.id || '1344528950';
      const newCount = watchAdsCount + 1;
      setWatchAdsCount(newCount);
      localStorage.setItem(`watchAdsCount_${userId}`, newCount.toString());
    }
    // Increment the user’s points count.  For Watch Ads we still add
    // the base point of 1, as the “points” field here is separate
    // from the coin balance managed by the backend.
    setPoints(prev => prev + (basePoints[task.task_name] || 0));
  };

  useEffect(() => {
    const loadSonar = () => {
      return new Promise((resolve, reject) => {
        if (window.Sonar) {
          setSonarLoaded(true);
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://static.sonartech.io/lib/1.0.0/sonar.js?appId=app_76ebf6eb';
        script.async = true;
        script.onload = () => {
          setSonarLoaded(true);
          resolve();
        };
        script.onerror = () => {
          reject(new Error('failed_to_load_sonar'));
        };
        document.body.appendChild(script);
      });
    };

    loadSonar().catch((err) => {
      console.error(err);
      setSonarLoaded(false);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const telegramId = WebApp.initDataUnsafe.user?.id || '1344528950';
        // Load the persistent watch ads count from localStorage.  Use
        // telegramId in the key so counts are per-user.  Default to 0.
        const storedCount = parseInt(localStorage.getItem(`watchAdsCount_${telegramId}`) || '0', 10);
        setWatchAdsCount(isNaN(storedCount) ? 0 : storedCount);
        const tasksRes = await fetch(`https://api.telegramfaucet.me/api/tasks?userId=${telegramId}`);
        if (!tasksRes.ok) throw new Error('failed_to_fetch_tasks');
        const tasksData = await tasksRes.json();
        console.log('Tasks Data:', tasksData);
        const normalizedTasks = tasksData.map(task => ({
          ...task,
          task_name: task.task_name,
          description: task.description ? task.description.toLowerCase().replace(/\s+/g, '_') : '',
          // For the Watch Ads task, attach the locally stored completion
          // count so we can compute the next reward.  This property is
          // otherwise ignored for server-driven tasks.
          completion_count: task.task_name === 'Watch Ads' ? storedCount : task.completion_count || 0,
        }));
        console.log('Normalized Tasks:', normalizedTasks);
        setTasks(normalizedTasks);

        const pointsRes = await fetch(`https://api.telegramfaucet.me/api/user/points?userId=${telegramId}`);
        if (!pointsRes.ok) throw new Error('failed_to_fetch_points');
        const pointsData = await pointsRes.json();
        setPoints(pointsData.points);

        WebApp.ready();
        WebApp.expand();
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => navigate('/home'));
        WebApp.MainButton.onClick(() => navigate('/home'));
        WebApp.SettingsButton.show();
        WebApp.SettingsButton.onClick(() => navigate('/settings'));

        setIsLoading(false);
      } catch (err) {
        setNotification({ type: 'error', message: t(err.message) });
        setTimeout(() => setNotification(null), 5000);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate, t]);

  const recordAdAction = async () => {
    try {
      const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';
      await fetch('https://api.telegramfaucet.me/api/task/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: telegramId, taskName: 'Watch Ads' }),
      });
    } catch (err) {
      console.error('Failed to record ad action:', err);
    }
  };

  const startTask = async (task) => {
    setProcessingTask(task);
    const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';

    // Handle the special daily secret word challenge.  When a task name
    // contains "daily secret" (case‑insensitive) we simply navigate to
    // the dedicated daily discount page.  The backend will take care of
    // marking the task as completed once the user enters the correct
    // secret word.  No other API calls are made here.
    if (task.task_name && task.task_name.toLowerCase().includes('daily secret')) {
      navigate('/dailydiscount');
      return;
    }

    try {
      if (task.task_name === 'Watch Ads') {
        // Try to show an ad using multiple providers in order of
        // preference: AdSonar -> Telega -> Adsgram.  This helper
        // function encapsulates the sequential logic and returns a
        // boolean indicating whether an ad was successfully shown.
        const showAdSequence = async () => {
          // Attempt AdSonar first if loaded.  We wrap the Sonar API
          // call into a promise that resolves true on success and false
          // on error.  AdSonar invokes the provided callbacks for
          // success (onClose) and error (onError).
          if (sonarLoaded && window.Sonar) {
            const sonarResult = await new Promise((resolve) => {
              try {
                window.Sonar.show({
                  adUnit: 'main',
                  loader: true,
                  onStart: () => {},
                  onShow: () => {},
                  onError: () => {
                    // Resolve false to indicate failure and allow
                    // fallback to the next provider.  We do not show
                    // error notifications for the user.
                    console.error('AdSonar failed to show ad');
                    resolve(false);
                  },
                  onClose: () => {
                    // Ad completed or closed; resolve true to signal
                    // success and stop trying further providers.
                    resolve(true);
                  },
                }).then((result) => {
                  // Sonar returns a result object; check if it
                  // indicates an error.  When result.status is
                  // 'error' we treat as failure.
                  if (result && result.status === 'error') {
                    console.error('AdSonar result error');
                    resolve(false);
                  }
                });
              } catch (err) {
                console.error('AdSonar threw exception', err);
                resolve(false);
              }
            });
            if (sonarResult) {
              return true;
            }
          }

          // Attempt Telega.  Load the SDK if necessary and try
          // displaying the ad.  We catch any errors and return false
          // to allow fallback to the next provider.
          try {
            await loadTelega();
            if (window.TelegaIn && window.TelegaIn.AdsController) {
              const telegaAds = window.TelegaIn.AdsController.create_miniapp({
                token: '5a948923-4c85-4340-9d4d-5c6cb65ffb15',
              });
              try {
                // Some Telega SDKs return a promise for ad_show; we
                // await it if available.  If it throws we treat as
                // failure.  If no promise, we call and assume success.
                const maybePromise = telegaAds.ad_show({
                  adBlockUuid: '92fb394c-217a-4dfb-9893-2a44e30bd68a',
                });
                if (maybePromise && typeof maybePromise.then === 'function') {
                  await maybePromise;
                }
                return true;
              } catch (err) {
                console.error('Telega ad error', err);
                // continue to next provider
              }
            }
          } catch (err) {
            console.error('Failed to load Telega SDK', err);
          }

          // Attempt Adsgram.  Load the SDK if necessary and try
          // displaying the ad.  Adsgram returns a promise from show().
          try {
            await loadAdsgram();
            if (window.Adsgram) {
              const AdController = window.Adsgram.init({ blockId: 'int-16704' });
              try {
                await AdController.show();
                return true;
              } catch (err) {
                console.error('Adsgram ad error', err);
              }
            }
          } catch (err) {
            console.error('Failed to load Adsgram SDK', err);
          }
          // None of the providers succeeded
          return false;
        };

        const adSuccess = await showAdSequence();
        if (adSuccess) {
          // Record ad action and reward the user on success
          recordAdAction();
          rewardUser(task);
          setNotification({
            type: 'success',
            message: t('ad_watched_success', { points: basePoints['watch_ads'] }),
          });
          setTimeout(() => setNotification(null), 3000);
        } else {
          // All providers failed; silently log but do not show any
          // notification to the user
          console.log('No ad providers available or ads failed');
        }
        setProcessingTask(null);
      } else if (task.link || task.task_name === 'check_telegram_faucet') {
        setTimer(5);
        const link = task.task_name === 'check_telegram_faucet' ? 'https://t.me/FaucetTelegramChannel/239' : task.link;
        
        if (task.task_name === 'Follow X' || task.task_name === 'Subscribe YouTube') {
          WebApp.openLink(link);
        } else {
          WebApp.openTelegramLink(link);
        }

        const response = await fetch('https://api.telegramfaucet.me/api/task/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: telegramId, taskName: task.task_name }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'failed_to_complete_task');
        }

        const data = await response.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.task_name === task.task_name ? { ...t, status: data.status, points: data.pointsEarned } : t
          )
        );
        setPoints((prev) => prev + data.pointsEarned);
        setNotification({
          type: 'success',
          message: t('task_completed', { taskName: t(task.task_name), points: data.pointsEarned }),
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      setNotification({ type: 'error', message: t('failed_to_complete_task_message', { error: err.message }) });
      setTimeout(() => setNotification(null), 5000);
      setProcessingTask(null);
    }

    if (task.task_name !== 'Watch Ads') {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const verifyTask = async (taskName) => {
    try {
      const telegramId = WebApp.initDataUnsafe.user?.id || '84895335';
      const res = await fetch('https://api.telegramfaucet.me/api/task/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: telegramId, taskName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'failed_to_verify_task');
      }
      const data = await res.json();

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.task_name === taskName ? { ...task, status: 'completed', points: data.pointsEarned } : task
        )
      );
      setPoints((prevPoints) => prevPoints + data.pointsEarned);
      setNotification({
        type: 'success',
        message: t('task_verified_success', {
          taskName: t(taskName),
          points: data.pointsEarned,
        }),
      });
      setProcessingTask(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: t('failed_to_verify_task_message', { error: err.message }) });
      setTimeout(() => setNotification(null), 5000);
      if (taskName === 'Daily Upgrade') {
        navigate('/upgrades');
      } else if (taskName === 'Invite Friends') {
        navigate('/frens');
      }
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const completedTasks = tasks.filter((task) => task.status === 'completed' || task.status === 'done').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getPointsDisplay = (task) => {
    // Provide a special display for the Watch Ads task: show the reward
    // amount the user will receive for watching the next ad.  We use the
    // local watchAdsCount state to determine how many ads have been
    // watched so far and calculate the next reward using the same
    // 1‑2‑5 pattern as the backend.  If the maximum reward has been
    // reached, display the cap amount.  For other tasks, fallback to
    // the provided points or basePoints.
    if (task.task_name === 'Watch Ads') {
      // Determine the current count for this task.  If completion_count
      // exists on the task object, prefer it; otherwise fall back to
      // watchAdsCount state.  Compute the next reward based on count+1.
      const count = task.completion_count ?? watchAdsCount;
      const nextCount = (count || 0) + 1;
      const group = Math.floor((nextCount - 1) / 3);
      const base = 100 * Math.pow(10, group);
      const step = (nextCount - 1) % 3;
      const multipliers = [1, 2, 5];
      let reward = base * multipliers[step];
      if (reward > 1000000000) reward = 1000000000;
      return reward.toLocaleString();
    }
    // For invite_friends and other base point tasks show base multiplier × completion
    if (task.task_name in basePoints) {
      const base = basePoints[task.task_name];
      const count = task.completion_count || 0;
      return `${base} x ${count}`;
    }
    return task.points;
  };

  const getSlideshowSteps = (taskName) => {
    switch (taskName) {
      case 'what_is_ton_empires':
        return [
          { intro: t('ton_empires_description') },
          { intro: t('upgrade_sectors_description') },
          { intro: t('complete_tasks_description') },
        ];
      case 'what_can_i_do_for_my_country':
        return [
          { intro: t('contribute_by_tasks_description') },
          { intro: t('invite_friends_description') },
          { intro: t('daily_activities_description') },
        ];
      case 'what_is_budget':
        return [
          { intro: t('budget_description') },
          { intro: t('earn_budget_description') },
          { intro: t('use_budget_description') },
        ];
      case 'how_to_become_president':
        return [
          { intro: t('president_points_description') },
          { intro: t('gain_points_description') },
          { intro: t('leaderboard_description') },
        ];
      case 'how_to_donate':
        return [
          { intro: t('donate_description') },
          { intro: t('donation_section_description') },
          { intro: t('donation_rewards_description') },
        ];
      default:
        return [];
    }
  };

  const startSlideshow = (taskName) => {
    const steps = getSlideshowSteps(taskName);
    introJs().setOptions({
      steps,
      showProgress: true,
      nextLabel: t('next_label'),
      prevLabel: t('prev_label'),
      doneLabel: t('done_label'),
      exitOnOverlayClick: false,
      exitOnEsc: true,
      isRtl: isRtl,
    }).start();
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

  return (
    <div
      className="min-h-screen font-roboto"
      style={{ backgroundColor: bgColor, color: textColor }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {notification && (
        <div
          className={`fixed top-4 ${isRtl ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-down ${
            notification.type === 'success' ? 'bg-green-600' : notification.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div
        className="relative h-52 bg-gradient-to-b rounded-xl mx-4 mt-4 mb-4 overflow-hidden shadow-lg"
        style={{
          background: `linear-gradient(to bottom, ${buttonColor}80, ${buttonColor}40, ${bgColor})`,
        }}
      >
        <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-lg animate-pulse`}>
          100 {t('days_left')}
        </div>
        <img
          src="https://telegramfaucet.me/notcoinPHP/assets/coin.png"
          alt="Large coin"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 shadow-lg rounded-full animate-glow"
        />
        <img
          src="https://telegramfaucet.me/notcoinPHP/assets/ton.png"
          alt="Small coin"
          className={`absolute top-1/5 w-8 h-8 animate-bounce ${isRtl ? 'mr-88' : 'ml-88'} m-40`}
          style={{ marginLeft: 'inherit' }}
        />
      </div>

      <div className={`flex items-center mx-4 mb-1`}>
        <img
          src="https://telegramfaucet.me/notcoinPHP/assets/points.webp"
          alt="Trophy icon"
          className={`w-8 h-8 ${isRtl ? 'ml-3' : 'mr-3'}`}
        />
        <span className="text-lg font-medium">{t('points_score')}</span>
        <div
          className={`relative bg-gray-600 text-white px-3 py-1 rounded-lg ${isRtl ? 'mr-3' : 'ml-3'} shadow-md animate-pulse-points`}
          style={{ backgroundColor: secondaryBgColor }}
        >
          {points}
          <div className={`absolute inset-0 rounded-lg bg-gradient-to-${isRtl ? 'l' : 'r'} from-transparent to-indigo-500 opacity-20`}></div>
        </div>
        <button
          className={`${isRtl ? 'mr-2' : 'ml-2'} text-indigo-400 hover:text-indigo-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800`}
          aria-label="View Details"
          style={{ color: buttonColor }}
        >
        </button>

        <div className={`absolute ${isRtl ? 'left-3' : 'right-3'} bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-lg hover:text-blue-400`} onClick={() => navigate('/frens')}>
          <img src="Invite Friends.svg" alt="Rules icon" className={`w-10 h-10`} onClick={() => navigate('/frens')} />
          <div>
            <p
              className={`text-sm cursor-pointer hover:text-blue-400 `}
            >
              {t('invite_friends')}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-1">
        <div className={`text-sm text-gray-400 mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
          {t('tasks_completed', { completed: completedTasks, total: totalTasks })}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-${isRtl ? 'l' : 'r'} from-indigo-500 to-indigo-700`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="mx-4 mb-1">
        <div
          className="bg-gray-800 rounded-xl p-4 shadow-neumorphic cursor-pointer"
          onClick={() => toggleSection('rules')}
          style={{ backgroundColor: secondaryBgColor }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{t('rules')}</h2>
            <span
              className={`transform transition-transform duration-300 ${
                collapsedSections.rules ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </div>
        </div>
        <div
          className={`bg-gray-800 rounded-b-xl p-4 mt-1 transition-all duration-300 overflow-hidden ${
            collapsedSections.rules ? 'max-h-0 p-0' : 'max-h-screen'
          }`}
          style={{ backgroundColor: secondaryBgColor }}
        >
          <div className="flex items-center mb-3">
            <img src="info.svg" alt="Rules icon" className={`w-10 h-10 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            <div>
              <p
                className={`text-sm cursor-pointer hover:text-blue-400 ${isRtl ? 'text-right' : 'text-left'}`}
                onClick={() => startSlideshow('what_is_ton_empires')}
              >
                {t('what_is_ton_empires')}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <img src="info.svg" alt="Rules icon" className={`w-10 h-10 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            <div>
              <p
                className={`text-sm cursor-pointer hover:text-blue-400 ${isRtl ? 'text-right' : 'text-left'}`}
                onClick={() => startSlideshow('what_can_i_do_for_my_country')}
              >
                {t('what_can_i_do_for_my_country')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-1">
        <div
          className="bg-gray-800 rounded-xl p-4 shadow-neumorphic cursor-pointer"
          onClick={() => toggleSection('learn')}
          style={{ backgroundColor: secondaryBgColor }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{t('learn_more_about_game')}</h2>
            <span
              className={`transform transition-transform duration-300 ${
                collapsedSections.learn ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </div>
        </div>
        <div
          className={`bg-gray-800 rounded-b-xl p-4 mt-1 transition-all duration-300 overflow-hidden ${
            collapsedSections.learn ? 'max-h-0 p-0' : 'max-h-screen'
          }`}
          style={{ backgroundColor: secondaryBgColor }}
        >
          <div className="flex items-center mb-3">
            <img src="book.svg" alt="Learn icon" className={`w-10 h-10 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            <div>
              <p
                className={`text-sm cursor-pointer hover:text-blue-400 ${isRtl ? 'text-right' : 'text-left'}`}
                onClick={() => startSlideshow('what_is_budget')}
              >
                {t('what_is_budget')}
              </p>
            </div>
          </div>
          <div className="flex items-center mb-3">
            <img src="book.svg" alt="Learn icon" className={`w-10 h-10 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            <div>
              <p
                className={`text-sm cursor-pointer hover:text-blue-400 ${isRtl ? 'text-right' : 'text-left'}`}
                onClick={() => startSlideshow('how_to_become_president')}
              >
                {t('how_to_become_president')}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <img src="book.svg" alt="Learn icon" className={`w-10 h-10 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            <div>
              <p
                className={`text-sm cursor-pointer hover:text-blue-400 ${isRtl ? 'text-right' : 'text-left'}`}
                onClick={() => startSlideshow('how_to_donate')}
              >
                {t('how_to_donate')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-14">
        <div
          className="bg-gray-800 rounded-t-xl p-4 shadow-neumorphic"
          style={{ backgroundColor: secondaryBgColor }}
        >
          <h2 className="text-lg font-bold mb-3">{t('tasks')}</h2>
          <p className={`text-xs text-gray-400 mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t('task_completion_delay')}
          </p>
        </div>
        <div
          className="bg-gray-800 rounded-b-xl shadow-neumorphic"
          style={{ backgroundColor: secondaryBgColor }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center mb-2 p-4 rounded-lg transition duration-200 shadow-neumorphic-inner ${
                task.status === 'completed' ? '' : 'hover:bg-gray-700 animate-pulse-task'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-10 ${isRtl ? 'ml-3' : 'mr-3'}`}>
                {task.status === 'completed' || task.status === 'done' ? (
                  <span className="text-green-500 text-2xl font-bold">✓</span>
                ) : (
                  <img
                    src={`${task.icon}`}
                    alt={`${task.task_name} icon`}
                    className="w-10 h-10"
                    onError={(e) => (e.target.src = 'default-task-icon.svg')}
                  />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isRtl ? 'text-right' : 'text-left'}`}>{t(task.task_name)}</p>
                <p className={`text-xs text-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}>{t(task.description)}</p>
                {task.task_name === 'invite_friends' && (
                  <p className={`text-xs text-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('invited_friends', { count: task.completion_count || 0 }) || `Invited ${task.completion_count || 0} friends`}
                  </p>
                )}
            {/* Display ad watch progress and next reward for the Watch Ads task */}
            {task.task_name === 'Watch Ads' && (
              <p className={`text-xs ${isRtl ? 'text-right' : 'text-left'}`} style={{ color: '#FBBF24' }}>
                {`Watched: ${(task.completion_count ?? watchAdsCount) || 0}/1000`}
                {` • Next reward: ${getPointsDisplay(task)} coins`}
              </p>
            )}
              </div>
              {task.status === 'pending' && (
                processingTask?.id === task.id ? (
                  timer ? (
                    <button
                      className="px-3 py-1 rounded-lg transition duration-300"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                      disabled
                    >
                      {`${timer}s`}
                    </button>
                  ) : task.task_name === 'Watch Ads' ? (
                    <button
                      className="px-3 py-1 rounded-lg transition duration-300"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                      disabled
                    >
                      Watching...
                    </button>
                  ) : (
                    <button
                      onClick={() => verifyTask(task.task_name)}
                      className="px-3 py-1 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                      {t('verify')}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => startTask(task)}
                    className="px-3 py-1 rounded-lg hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    disabled={task.task_name === 'Watch Ads' && !sonarLoaded}
                  >
                    {task.task_name === 'Watch Ads' ? t('complete') || 'Watch Ad' : t('complete')}
                  </button>
                )
              )}
              <div
                className={`text-xs font-semibold w-8 h-8 flex items-center justify-center rounded-full ${isRtl ? 'mr-2' : 'ml-2'} ${
                  task.status === 'completed' || task.status === 'done' ? 'text-green-500' : 'text-white'
                }`}
                style={{ backgroundColor: secondaryBgColor }}
              >
                {getPointsDisplay(task)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="bottom-nav"
        className={`fixed bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full bg-white shadow-md flex justify-around p-2`}
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
          <span className="text-xs">{t('home')}</span>
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="flex flex-col items-center text-green-500 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
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

export default TasksPage;