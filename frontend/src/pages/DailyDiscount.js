import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useTranslation } from 'react-i18next';
import Modal from 'react-modal';
import { getApiUrl, fetchApi } from '../services/api';

// Helper to obtain the Telegram WebApp instance.  In a Telegram
// environment `WebApp` from @twa-dev/sdk will be defined; otherwise
// undefined and we can fall back to opening links in a new tab.

const DailyDiscount = ({ isOpen, onClose, onVerify, telegramId }) => {
  const { t } = useTranslation();
  const isRtl = ['fa', 'ar'].includes(t('language'));
  const [videoUrl, setVideoUrl] = useState('');
  const [discount, setDiscount] = useState(0);
  const [name, setName] = useState('');
  const [claimed, setClaimed] = useState(false);
  const [secretWord, setSecretWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !claimed) {
      fetchDailyTask();
    }
  }, [isOpen, claimed]);

  const fetchDailyTask = async () => {
    try {
      const response = await fetchApi(`/api/daily-task?telegramId=${telegramId}`);
      const data = await response.json();
      setVideoUrl(data.url || '');
      setDiscount(data.discount || 0);
      setName(data.name || '');
      setClaimed(data.claimed || false);
      if (data.claimed || data.discount === 0) {
        onClose(); // Auto-close if already claimed or no task
      }
    } catch (err) {
      setError(t('failed_to_load_daily_challenge'));
      console.error(err);
    }
  };

  const handlePlay = () => {
    if (videoUrl) {
      // Attempt to open the video using the Telegram WebApp API.  If not
      // available (e.g. in a browser during development) fall back to
      // opening the link in a new tab or window.
      try {
        if (WebApp && typeof WebApp.openLink === 'function') {
          WebApp.openLink(videoUrl);
        } else {
          window.open(videoUrl, '_blank');
        }
      } catch (e) {
        // As a last resort, open in new tab.
        window.open(videoUrl, '_blank');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretWord.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetchApi('/api/daily-task/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, secretWord: secretWord.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        onVerify(data.discount);
        onClose();
      } else {
        setError(t(data.error || 'verification_failed'));
      }
    } catch (err) {
      setError(t('network_error'));
      console.error(err);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={`max-w-md mx-auto bg-white p-6 rounded-lg shadow-xl max-h-[80vh] overflow-y-auto ${isRtl ? 'text-right' : 'text-left'}`}
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      ariaHideApp={false}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center text-gray-800">{t(name)}</h2>
        <button
          onClick={handlePlay}
          className={`w-full py-3 px-4 rounded-md font-semibold text-white ${videoUrl ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'} transition-colors`}
          disabled={!videoUrl}
        >
          ▶️ {t('play_video')}
        </button>
        <p className="text-sm text-gray-600 text-center">{t('watch_youtube_short_for_secret')}</p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder={t('enter_secret_word')}
            value={secretWord}
            onChange={(e) => setSecretWord(e.target.value)}
            disabled={loading}
            className={`w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
          />
          <button
            type="submit"
            disabled={loading || !secretWord.trim()}
            className={`w-full py-3 px-4 rounded-md font-semibold text-white ${loading || !secretWord.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} transition-colors`}
          >
            {loading ? t('verifying') : t('submit')}
          </button>
        </form>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
        >
          {t('close')}
        </button>
      </div>
    </Modal>
  );
};

export default DailyDiscount;
