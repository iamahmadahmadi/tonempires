import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WebApp from '@twa-dev/sdk';
import { Document, Page, pdfjs } from 'react-pdf';

// Mock WebApp for local development
if (typeof WebApp === 'undefined') {
  window.WebApp = {
    themeParams: {
      bg_color: '#1a1a1a',
      text_color: '#ffffff',
      button_color: '#3b82f6',
    },
    initDataUnsafe: {
      user: {
        id: 1165563901,
      },
    },
    ready: () => console.log('WebApp ready'),
    expand: () => console.log('WebApp expanded'),
  };
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-red-500">
          <p>Error: {this.state.errorMessage}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Set the workerSrc for react-pdf
const primaryWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
const fallbackWorkerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
let workerSrc = primaryWorkerSrc;

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

function IntroPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa'; // Determine RTL
  const navigate = useNavigate();
  const location = useLocation();
  const fromError = location.state?.fromError || false;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showIntro, setShowIntro] = useState(null); // null: checking, true: show intro, false: skip to home
  const [numPages, setNumPages] = useState(null); // Total number of pages in the PDF
  const [currentPage, setCurrentPage] = useState(1); // Current page being displayed
  const [scale, setScale] = useState(1); // Scale for PDF rendering

  // Telegram Web App theme parameters for consistent styling
  const theme = WebApp.themeParams;
  const bgColor = theme.bg_color || '#1a1a1a';
  const textColor = theme.text_color || '#ffffff';
  const buttonColor = theme.button_color || '#3b82f6';

  // Check localStorage for openedApp flag
  useEffect(() => {
    console.log('Checking localStorage for openedApp');
    try {
      const value = localStorage.getItem('openedApp');
      console.log('openedApp value:', value);
      if (value === '1' && !fromError) {
        navigate('/home', { replace: true });
      } else {
        setShowIntro(true);
      }
    } catch (err) {
      console.error('Error retrieving openedApp from localStorage:', err);
      setShowIntro(true); // Default to showing intro on error
    }
  }, [navigate, fromError]);

  // Pre-check PDF file and worker accessibility
  useEffect(() => {
    if (!showIntro) return; // Skip if intro is not shown

    console.log('Attempting to load PDF: /pdfs/intro-slides.pdf');
    fetch('/pdfs/intro-slides.pdf', { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.error('PDF file not found or inaccessible');
          setError(t('error_loading_intro_source'));
        } else {
          console.log('PDF file is accessible');
        }
      })
      .catch((err) => {
        console.error('Error checking PDF file:', err);
        setError(t('error_loading_intro_source'));
      });

    console.log('Attempting to load worker:', workerSrc);
    fetch(workerSrc, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.warn('Primary worker inaccessible, switching to fallback');
          workerSrc = fallbackWorkerSrc;
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          console.log('Switched to fallback worker:', workerSrc);
        } else {
          console.log('Primary worker is accessible');
        }
      })
      .catch((err) => {
        console.warn('Error checking primary worker:', err, 'Switching to fallback');
        workerSrc = fallbackWorkerSrc;
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        console.log('Switched to fallback worker:', workerSrc);
      });
  }, [t, showIntro]);

  // Handle successful PDF load
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully, numPages:', numPages);
    setNumPages(numPages);
    setError(null);
  };

  // Handle PDF load error
  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error.message, error);
    setError(t('error_loading_intro'));
    setNumPages(null);
  };

  // Timeout for PDF loading
  useEffect(() => {
    if (!showIntro) return; // Skip if intro is not shown

    console.log('Setting up PDF load timeout');
    const timeout = setTimeout(() => {
      if (numPages === null && !error) {
        console.error('PDF loading timed out after 20 seconds');
        setError(t('error_loading_intro_timeout'));
      }
    }, 20000); // Increased to 20 seconds

    return () => clearTimeout(timeout);
  }, [numPages, error, t, showIntro]);

  // Navigation for slideshow
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  // Handle the "Start Now" button
  const handleStart = () => {
    setIsLoading(true);
    setError(null);

    const telegramId = WebApp.initDataUnsafe.user?.id || 1165563901;

    if (fromError) {
      // Handle error case: navigate directly to /country-selection
      navigate('/country-selection');
      setIsLoading(false);
    } else {
      // Normal flow: set openedApp and check user status
      try {
        localStorage.setItem('openedApp', '1');
        console.log('Set openedApp to 1');
      } catch (err) {
        console.error('Error setting openedApp in localStorage:', err);
      }

      fetch(`https://api.telegramfaucet.me/api/user/check?telegramId=${telegramId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to check user');
          }
          return res.json();
        })
        .then((data) => {
          if (data.isNew) {
            navigate('/country-selection');
          } else {
            navigate('/home');
          }
        })
        .catch((error) => {
          console.error('Error checking user:', error);
          setError(t('error_checking_user'));
        })
        .finally(() => setIsLoading(false));
    }
  };

  // Calculate PDF scale to maintain aspect ratio
  const calculatePdfScale = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pdfWidth = 1200.24; // Example PDF width in points
    const pdfHeight = 1499.76; // Example PDF height in points
    const pdfAspectRatio = pdfWidth / pdfHeight;
    const viewportAspectRatio = viewportWidth / viewportHeight;

    return viewportAspectRatio > pdfAspectRatio
      ? viewportHeight / pdfHeight
      : viewportWidth / pdfWidth;
  };

  // Update scale on window resize
  useEffect(() => {
    if (!showIntro) return;

    const handleResize = () => {
      setScale(calculatePdfScale());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showIntro]);

  // Show loading state while checking storage
  if (showIntro === null) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen"
        style={{ backgroundColor: bgColor, color: textColor }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <p className="text-lg">{t('loading')}</p>
      </div>
    );
  }

  if (!showIntro) return null;

  return (
    <ErrorBoundary>
      <style>
        {`
          .react-pdf__Page {
            width: 100% !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .react-pdf__Page__canvas {
            width: 100% !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        `}
      </style>
      <div
        className="flex flex-col items-center justify-center h-screen w-screen m-0 p-0 overflow-hidden"
        style={{ backgroundColor: bgColor }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Document
            file="/pdfs/intro-slides.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="w-full h-full flex items-center justify-center"
            loading={
              <div className="flex items-center justify-center h-full">
                <p style={{ color: textColor }} className="text-lg">{t('loading')}</p>
              </div>
            }
            onSourceError={(error) => {
              console.error('Error accessing PDF source:', error);
              setError(t('error_loading_intro_source'));
            }}
          >
            <Page
              pageNumber={currentPage}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              scale={scale}
              className="shadow-md"
            />
          </Document>

          <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-4 z-10">
            {numPages ? (
              <>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === 1 ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  style={{ backgroundColor: currentPage === 1 ? '#d1d5db' : buttonColor }}
                  aria-label={t('prev_label')}
                >
                  {isRtl ? (
                    <>
                      {t('prev_label')}
                      <span className="ml-2">▶</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">◀</span>
                      {t('prev_label')}
                    </>
                  )}
                </button>

                {currentPage === numPages ? (
                  <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg ${
                      isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white transition duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    style={{ backgroundColor: isLoading ? '#9ca3af' : buttonColor }}
                    aria-label={t('start_now')}
                  >
                    {isLoading ? t('loading') : t('start_now')}
                  </button>
                ) : (
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === numPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === numPages ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white transition duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    style={{ backgroundColor: currentPage === numPages ? '#d1d5db' : buttonColor }}
                    aria-label={t('next_label')}
                  >
                    {isRtl ? (
                      <>
                        <span className="mr-2">◀</span>
                        {t('next_label')}
                      </>
                    ) : (
                      <>
                        {t('next_label')}
                        <span className="ml-2">▶</span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleStart}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg ${
                  isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                style={{ backgroundColor: isLoading ? '#9ca3af' : buttonColor }}
                aria-label={t('start_now')}
              >
                {isLoading ? t('loading') : t('start_now')}
              </button>
            )}
          </div>

          {error && (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10">
              <p className="text-red-500 bg-white px-3 py-1 rounded-lg shadow-md">{error}</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default IntroPage;