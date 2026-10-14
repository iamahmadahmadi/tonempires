import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { feature } from 'topojson-client';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingComponent from '../components/LoadingComponent';
import { getApiUrl, fetchApi } from '../services/api';

// Helper function to remove diacritics
const removeDiacritics = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const nameMappings = {
  "united states of america": "united states",
  "dominican rep.": "dominican",
  "dem. rep. congo": "congo",
  "central african rep.": "central african republic",
  "w. sahara": "",
  "s. sudan": "south sudan",
  "czechia": "czech republic",
  "eq. guinea": "equatorial guinea",
  "Côte d'Ivoire": "",
  "greenland": "denmark"
};

function Statistics() {
  const { t, i18n } = useTranslation();
  const [statistics, setStatistics] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [countryRanks, setCountryRanks] = useState({});
  const navigate = useNavigate();
  const isRtl = i18n.language === 'fa';

  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';
  const secondaryBgColor = theme.secondary_bg_color || '#262626';

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([0, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, topoResponse] = await Promise.all([
          fetchApi('/api/statistics'),
          fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        ]);

        if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
        if (!topoResponse.ok) throw new Error('Failed to fetch map data');

        const statsData = await statsResponse.json();
        const topoData = await topoResponse.json();
        const geoData = feature(topoData, topoData.objects.countries);

        const sortedCountries = [...statsData.countries].sort(
          (a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)
        );
        const ranks = {};
        let rank = 1;
        let prevPoints = null;
        sortedCountries.forEach((country, index) => {
          const points = Number(country.points) || 0;
          if (index === 0 || points < prevPoints) {
            rank = index + 1;
          }
          const normalizedName = removeDiacritics(country.name.toLowerCase());
          ranks[normalizedName] = rank;
          prevPoints = points;
        });

        setStatistics(statsData);
        setMapData(geoData);
        setCountryRanks(ranks);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => navigate('/home'));
      WebApp.SettingsButton.show();
      WebApp.SettingsButton.onClick(() => navigate('/settings'));
      return () => {
        WebApp.BackButton.hide();
      };
    }
  }, [navigate]);

  const handleMouseEnter = (geo) => {
    const geoName = geo.properties.name;
    const normalizedGeoName = removeDiacritics(geoName.toLowerCase());
    const dbName = nameMappings[normalizedGeoName] || normalizedGeoName;
    const countryInfo =
      countryNameMap[dbName] || {
        name: geoName,
        population: 'Unknown',
        budget: 'Unknown',
        points: 0,
      };
    setHoveredCountry(countryInfo);
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
  };

  const countryNameMap = statistics
    ? statistics.countries.reduce((map, country) => {
        const normalizedName = removeDiacritics(country.name.toLowerCase());
        map[normalizedName] = country;
        return map;
      }, {})
    : {};

  const countryPoints = statistics ? statistics.countries.map((country) => Number(country.points) || 0) : [];
  const maxPoints = Math.max(...countryPoints, 100);

  // Zoom functions
  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom * 1.2, 10)); // Limit max zoom
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom / 1.2, 0.5)); // Limit min zoom
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

  if (error || !statistics) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen p-4"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <p className="text-red-500 text-lg mb-4">{t('error')}: {error || t('statistics_not_available')}</p>
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
        {/* Header content remains unchanged */}
      </header>

      <div className="mx-4 mt-4 mb-16">
        <div
          className="bg-gray-800 rounded-xl p-4 shadow-neumorphic mb-6"
          style={{ backgroundColor: secondaryBgColor }}
        >
          <div className="flex justify-between">
            <div>
              <span className="font-medium">{t('total_budget')}:</span>
              <span className="text-sm"> {statistics.total_budget}</span>
            </div>
            <div>
              <span className="font-medium">{t('total_population')}:</span>
              <span className="text-sm"> {statistics.total_population}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-gray-800 rounded-xl p-4 shadow-neumorphic"
          style={{ backgroundColor: secondaryBgColor }}
        >
          {mapData ? (
            <div className="relative w-full h-full">
              <ComposableMap projectionConfig={{ scale: 180 }}>
                <defs>
                  {statistics.countries.map((country) => {
                    const normalizedName = removeDiacritics(country.name.toLowerCase());
                    const pts = Number(country.points) || 0;
                    const fillPercentage = (pts / maxPoints) * 100;
                    const gradientId = `gradient-${normalizedName.replace(/\s+/g, '-')}`;
                    return (
                      <linearGradient
                        key={gradientId}
                        id={gradientId}
                        x1="0%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#D6D6DA" />
                        <stop offset={`${fillPercentage}%`} stopColor="#0088cc" />
                        <stop offset={`${fillPercentage}%`} stopColor="#D6D6DA" />
                        <stop offset="100%" stopColor="#D6D6DA" />
                      </linearGradient>
                    );
                  })}
                </defs>
                <ZoomableGroup zoom={zoom} center={center} maxZoom={10} minZoom={0.5}>
                  <Geographies geography={mapData}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const geoName = geo.properties.name;
                        const normalizedGeoName = removeDiacritics(geoName.toLowerCase());
                        const dbName = nameMappings[normalizedGeoName] || normalizedGeoName;
                        const countryInfo = countryNameMap[dbName];
                        const pts = countryInfo ? Number(countryInfo.points) : 0;
                        const gradientId = countryInfo
                          ? `gradient-${removeDiacritics(countryInfo.name.toLowerCase()).replace(/\s+/g, '-')}`
                          : null;

                        return (
                          <Geography
                            key={geo.rsmKey || geo.id}
                            geography={geo}
                            onMouseEnter={() => handleMouseEnter(geo)}
                            onMouseLeave={handleMouseLeave}
                            style={{
                              default: {
                                fill: gradientId && pts > 0 ? `url(#${gradientId})` : '#D6D6DA',
                                stroke: '#FFF',
                                strokeWidth: 0.5,
                                outline: 'none',
                                transition: 'fill 0.2s ease, stroke 0.2s ease',
                              },
                              hover: {
                                fill: '#F53',
                                stroke: '#FFF',
                                strokeWidth: 1,
                                outline: 'none',
                                cursor: 'pointer',
                              },
                              pressed: {
                                fill: '#E42',
                                stroke: '#FFF',
                                strokeWidth: 1,
                                outline: 'none',
                              },
                            }}
                            aria-label={geoName}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
              <div className="absolute top-2 right-2 flex flex-col space-y-2 z-10">
                <button
                  onClick={handleZoomIn}
                  className="bg-gray-700 text-white px-3 py-1 rounded-lg shadow-md hover:bg-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label={t('zoom_in')}
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  className="bg-gray-700 text-white px-3 py-1 rounded-lg shadow-md hover:bg-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label={t('zoom_out')}
                >
                  -
                </button>
              </div>
            </div>
          ) : (
            <p className="text-red-500">{t('map_data_not_loaded')}</p>
          )}
        </div>
      </div>

      {hoveredCountry && (
        <div
          className={`absolute top-16 ${isRtl ? 'left-4' : 'right-4'} p-4 rounded-xl shadow-lg z-20 max-w-xs`}
          style={{
            background: `linear-gradient(to bottom, ${secondaryBgColor}, ${bgColor})`,
            color: textColor,
          }}
        >
          <h3 className="font-bold text-lg mb-2">{hoveredCountry.name}</h3>
          <p className="text-sm">
            <span className="font-semibold">{t('rank')}:</span> #
            {countryRanks[removeDiacritics(hoveredCountry.name.toLowerCase())] || 'N/A'}
          </p>
          <p className="text-sm">
            <span className="font-semibold">{t('population')}:</span> {hoveredCountry.population}
          </p>
          <p className="text-sm">
            <span className="font-semibold">{t('budget')}:</span> {hoveredCountry.budget}
          </p>
          <p className="text-sm">
            <span className="font-semibold">{t('points')}:</span> {hoveredCountry.points}
          </p>
        </div>
      )}

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
          className="flex flex-col items-center text-green-500 hover:text-green-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
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

export default Statistics;
