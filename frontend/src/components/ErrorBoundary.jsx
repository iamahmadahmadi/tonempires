import React from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundaryBase extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return this.props.fallback({
      error: this.state.error,
      reset: this.handleReset,
    });
  }
}

function ErrorFallback({ error, reset }) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 text-center">
      <h1 className="text-2xl font-bold mb-3">{t('something_went_wrong', 'Something went wrong')}</h1>
      <p className="text-sm text-slate-300 max-w-sm mb-5">
        {t('reload_recovery_hint', 'The game recovered from an unexpected error. Try again or reload the app.')}
      </p>
      {error?.message && <p className="text-xs text-red-300 mb-5">{error.message}</p>}
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold"
      >
        {t('retry', 'Retry')}
      </button>
    </main>
  );
}

export default function ErrorBoundary({ children, onReset }) {
  return (
    <ErrorBoundaryBase fallback={(props) => <ErrorFallback {...props} />} onReset={onReset}>
      {children}
    </ErrorBoundaryBase>
  );
}
