import { useCallback } from 'react';
import { readJsonStorage } from '../services/api';
import { triggerHaptic } from '../utils/telegramWebApp';

function playTone(frequency, duration = 0.08, volume = 0.05) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
  oscillator.onended = () => context.close();
}

export default function useGameFeedback() {
  return useCallback((type = 'tap') => {
    const settings = readJsonStorage('settings', {});
    if (settings.soundEffects !== false) {
      const tones = {
        tap: [520, 0.05],
        upgrade: [740, 0.11],
        reward: [880, 0.14],
        error: [180, 0.12],
      };
      const [frequency, duration] = tones[type] || tones.tap;
      playTone(frequency, duration);
    }

    if (settings.animations !== false) {
      triggerHaptic(type === 'error' ? 'light' : 'medium');
    }
  }, []);
}
