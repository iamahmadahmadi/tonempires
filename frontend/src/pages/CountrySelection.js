import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature } from 'topojson-client';
import { useTranslation } from 'react-i18next';
import LoadingComponent from '../components/LoadingComponent';
import { apiRequest } from '../services/api';

function CountrySelection() {
  const { i18n } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [error, setError] = useState(null);
  const [selectionNotice, setSelectionNotice] = useState('');
  const [keyToCountryMap, setKeyToCountryMap] = useState({});
  const navigate = useNavigate();

  const supportedLngs = ["de", "en", "fa", "es", "fr", "ar", "ru", "hy", "zh", "ja", "ko", "hi", "bn", "id", "tr"];
  // The backend uses ctx.initData.user.id as the identity; this ID is only a legacy route suffix.
  const userId = WebApp.initDataUnsafe?.user?.id;

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
      await apiRequest(`/api/settings/${userId}`, {
        method: 'POST',
        body: JSON.stringify(newSettings),
      }, 5000);
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
        let settings = await apiRequest(`/api/settings/${userId}`, {}, 5000);
        if (typeof settings === 'string') settings = JSON.parse(settings);
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
        const [countriesData, topoResponse] = await Promise.all([
          apiRequest('/api/countries'),
          fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        ]);

        if (!topoResponse.ok) throw new Error('Failed to fetch map data');
        const topoData = await topoResponse.json();

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
              iso: country.iso,
              supported: true,
            };
            console.log(`Mapped ${geoName} (ID: ${id}) to ${country.name}`);
          } else {
            console.warn(`No match for ${geoName} (ID: ${id})`);
            tempKeyToCountryMap[id] = { id, name: geoName || 'Unknown', iso: null, supported: false };
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
    if (identifier && typeof identifier === 'object') {
      // Search-list selections pass an exact API country object. Do not treat
      // its numeric ID as a TopoJSON geography ID (those namespaces differ).
      country = identifier;
    } else if (typeof identifier === 'string' || typeof identifier === 'number') {
      country = keyToCountryMap[String(identifier)] || countries.find(c => String(c.id) === String(identifier));
    }

    const supportedCountry = country && countries.some(
      (item) => String(item.id) === String(country.id) && item.name === country.name
    );
    if (!country || !country.name || country.name === 'Unknown' || (country.supported === false) || (!country.supported && !supportedCountry)) {
      setSelectionNotice('This country is not supported yet. Please select one of the countries available in the list.');
      console.error(`Invalid country selected: ${identifier}`, { country });
      return;
    }

    setSelectionNotice('');
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
    const refLink = urlParams.get('startapp') || WebApp.initDataUnsafe?.start_param;
    const telegramId = WebApp.initDataUnsafe?.user?.id;
    const isPremium = WebApp.initDataUnsafe?.user?.is_premium || false;
    const payload = {
      telegramId,
      country: country.name,
      isPremium,
      referrer: refLink,
      name // Include the combined name in the payload
    };

    try {
      const data = await apiRequest('/api/user/select-country', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data?.error) throw new Error(data.error);
      localStorage.setItem('openedApp', '1');
      setTimeout(() => navigate('/home'), 1000);
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
                  onClick={() => handleSelect(country)}
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

      {selectionNotice && (
        <p role="status" className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {selectionNotice}
        </p>
      )}

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
                    onClick={() => {
                      if (country.supported) handleSelect(geoId);
                      else setSelectionNotice('This country is not supported yet. Please select one of the countries available in the list.');
                    }}
                    onMouseEnter={() => setSearchTerm(countryName)}
                    onMouseLeave={() => setSearchTerm('')}
                    style={{
                      default: {
                        fill: isSelected ? 'green' : (country.supported ? '#D6D6DA' : '#ECECEF'),
                        stroke: '#FFF',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: isSelected ? 'green' : (country.supported ? '#F53' : '#ECECEF'),
                        stroke: '#FFF',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: {
                        fill: isSelected ? 'green' : (country.supported ? '#E42' : '#ECECEF'),
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
