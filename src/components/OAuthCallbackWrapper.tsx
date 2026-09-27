import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const OAuthCallbackWrapper: React.FC = () => {
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      setError(error);
      setStatus('error');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return;
    }

    if (token) {
      login(token);
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      setError('Token konnte nicht abgerufen werden');
      setStatus('error');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  }, [login]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Google-Anmeldung wird durchgeführt...</h2>
          <p className="text-muted">Bitte warten, Sie werden angemeldet.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Anmeldung erfolgreich!</h2>
          <p className="text-muted">Sie werden zur Startseite weitergeleitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Fehler bei der Anmeldung</h2>
        <p className="text-muted">{error || 'Unbekannter Fehler aufgetreten.'}</p>
      </div>
    </div>
  );
};

export default OAuthCallbackWrapper;