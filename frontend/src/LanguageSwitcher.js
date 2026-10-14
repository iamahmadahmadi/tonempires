import { useTranslation } from 'react-i18next';
import { readJsonStorage, writeJsonStorage } from './services/api';

const languages = [
  ['en', 'English'],
  ['fa', 'فارسی'],
  ['ar', 'العربية'],
  ['es', 'Español'],
  ['fr', 'Français'],
  ['de', 'Deutsch'],
  ['ru', 'Русский'],
  ['tr', 'Türkçe'],
  ['id', 'Bahasa Indonesia'],
  ['hi', 'हिन्दी'],
  ['bn', 'বাংলা'],
  ['zh', '中文'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['hy', 'Հայերեն'],
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    const settings = readJsonStorage('settings', {});
    writeJsonStorage('settings', { ...settings, language: lng });
  };

  return (
    <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language?.split('-')[0] || 'en'}>
      {languages.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default LanguageSwitcher;
