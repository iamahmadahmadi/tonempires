import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature } from 'topojson-client';
import { useTranslation } from 'react-i18next';
import LoadingComponent from '../components/LoadingComponent';

function CountrySelection() {
  const { i18n } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [error, setError] = useState(null);
  const [keyToCountryMap, setKeyToCountryMap] = useState({});
  const navigate = useNavigate();

  const supportedLngs = ["de", "en", "fa", "es", "fr", "ar", "ru", "hy", "zh", "ja", "ko", "hi", "bn", "id", "tr"];
  const userId = WebApp.initDataUnsafe?.user?.id || '84895335';
  const API_BASE_URL = 'https://api.telegramfaucet.me';
  const isTelegramEnv = !!window.Telegram?.WebApp;

  // Retrieve first_name and last_name from WebApp user data
  const firstName = WebApp.initDataUnsafe?.user?.first_name || '';
  const lastName = WebApp.initDataUnsafe?.user?.last_name || '';
  const name = `${firstName} ${lastName}`.trim();

  const getLanguageFromIso = (iso) => {
    const mapping = {
      'US': 'en',
      'GB': 'en',
      'DE': 'de',
      'FR': 'fr',
      'ES': 'es',
      'IR': 'fa',
      'SA': 'ar',
      'RU': 'ru',
      'AM': 'hy',
      'CN': 'zh',
      'JP': 'ja',
      'KR': 'ko',
      'IN': 'hi',
      'BD': 'bn',
      'ID': 'id',
      'TR': 'tr',
      'AE': 'ar'
    };
    const lang = mapping[iso] || iso?.toLowerCase();
    return supportedLngs.includes(lang) ? lang : 'en';
  };

  const saveSettings = async (newSettings) => {
    try {
      localStorage.setItem('settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }

    try {
      await i18n.changeLanguage(newSettings.language);
    } catch (error) {
      console.error('Failed to change language:', error);
      await i18n.changeLanguage('en');
    }

    try {
      console.info('Saving settings to API for user:', { userId, newSettings });
      const response = await Promise.race([
        fetch(`${API_BASE_URL}/api/settings/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isTelegramEnv && { 'Telegram-Init-Data': WebApp.initData || '' }),
          },
          body: JSON.stringify(newSettings),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('API request timed out')), 5000)),
      ]);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.info('API save response:', data);
    } catch (error) {
      console.error('Failed to save settings to API:', error);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      let savedSettings = null;
      try {
        savedSettings = JSON.parse(localStorage.getItem('settings')) || {
          language: 'en',
          music: true,
          soundEffects: true,
          animations: true,
          walletConnected: false,
        };
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error);
      }

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
        settings = settings.settings || settings;

        savedSettings = {
          language: supportedLngs.includes(settings.language) ? settings.language : 'en',
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
      } catch (error) {
        console.error('Failed to initialize settings:', error);
        await i18n.changeLanguage('en');
      }
    };

    loadSettings();
    WebApp.ready();
    WebApp.expand();
  }, [i18n]);

  const removeDiacritics = (str) => {
    return str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesResponse, topoResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/countries`),
          fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        ]);

        if (!countriesResponse.ok) throw new Error('Failed to fetch countries');
        if (!topoResponse.ok) throw new Error('Failed to fetch map data');

        const [countriesData, topoData] = await Promise.all([
          countriesResponse.json(),
          topoResponse.json(),
        ]);

        const geoData = feature(topoData, topoData.objects.countries);

        const tempKeyToCountryMap = {};
        geoData.features.forEach((feature) => {
          const id = feature.id;
          const geoName = feature.properties.name;

          let country = null;
          if (geoName) {
            country = countriesData.find((c) => {
              if (!c.name || !geoName) return false;
              const apiNameNorm = removeDiacritics(c.name.toLowerCase());
              const geoNameNorm = removeDiacritics(geoName.toLowerCase());
              return (
                apiNameNorm === geoNameNorm ||
                apiNameNorm.includes(geoNameNorm) ||
                geoNameNorm.includes(apiNameNorm) ||
                (geoNameNorm.includes('united arab emirates') && apiNameNorm.includes('united arab emirates'))
              );
            });
          }

          if (country) {
            tempKeyToCountryMap[id] = {
              id: country.id,
              name: country.name,
              iso: country.iso
            };
            console.log(`Mapped ${geoName} (ID: ${id}) to ${country.name}`);
          } else {
            console.warn(`No match for ${geoName} (ID: ${id})`);
            tempKeyToCountryMap[id] = { id, name: geoName || 'Unknown', iso: null };
          }
        });

        setCountries(countriesData);
        setMapData(geoData);
        setKeyToCountryMap(tempKeyToCountryMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelect = async (identifier) => {
    let country;
    if (typeof identifier === 'string' || typeof identifier === 'number') {
      country = keyToCountryMap[identifier] || countries.find(c => c.id === identifier);
    }

    if (!country || !country.name || country.name === 'Unknown') {
      console.error(`Invalid country selected: ${identifier}`, { country });
      setError('Country not recognized. Please try another.');
      return;
    }

    setSelectedCountry(country.name);
    setSearchTerm(country.name);

    const languageCode = getLanguageFromIso(country.iso);

    const currentSettings = JSON.parse(localStorage.getItem('settings')) || {
      language: 'en',
      music: true,
      soundEffects: true,
      animations: true,
      walletConnected: false,
    };
    const updatedSettings = { ...currentSettings, language: languageCode };
    await saveSettings(updatedSettings);

    const urlParams = new URLSearchParams(window.location.search);
    const refLink = urlParams.get('startapp') || WebApp.initDataUnsafe.start_param;
    const telegramId = WebApp.initDataUnsafe.user?.id || '1165563901';
    const isPremium = WebApp.initDataUnsafe.user?.is_premium || false;
    const payload = {
      telegramId,
      country: country.name,
      isPremium,
      referrer: refLink,
      name // Include the combined name in the payload
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/select-country`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        localStorage.setItem('openedApp', '1');
        setTimeout(() => navigate('/home'), 1000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to select country');
      }
    } catch (error) {
      console.error('Error selecting country:', error);
      setError(error.message || 'Error selecting country. Please try again.');
    }
  };

  const filteredCountries = countries.filter((country) =>
    (country?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-1/2 h-1/2 flex items-center justify-center">
          <LoadingComponent />
        </div>
        <p className="text-lg mt-4">loading</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {`Error: ${error}`}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Select Your Country</h2>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search for a country"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelect(country.id)}
                >
                  {country.name}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500">No countries found</div>
            )}
          </div>
        )}
      </div>

      {mapData ? (
        <ComposableMap projectionConfig={{ scale: 150 }}>
          <Geographies geography={mapData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoId = geo.id;
                const country = keyToCountryMap[geoId] || { name: geo.properties.name || 'Unknown', id: geoId };
                const countryName = country.name;
                const isSelected = countryName === selectedCountry;

                return (
                  <Geography
                    key={geo.rsmKey || geoId}
                    geography={geo}
                    onClick={() => handleSelect(geoId)}
                    onMouseEnter={() => setSearchTerm(countryName)}
                    onMouseLeave={() => setSearchTerm('')}
                    style={{
                      default: {
                        fill: isSelected ? 'green' : '#D6D6DA',
                        stroke: '#FFF',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: isSelected ? 'green' : '#F53',
                        stroke: '#FFF',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: {
                        fill: isSelected ? 'green' : '#E42',
                        stroke: '#FFF',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      ) : (
        <p>Map data not loaded</p>
      )}
    </div>
  );
}

export default CountrySelection;