import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Loader2, Mail, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailInputProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  // error prop kaldırıldı, toaster kullanılacak
  type: 'login' | 'register';
  onBack?: () => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  onSubmit,
  isLoading,
  // error kaldırıldı
  type,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const { googleLogin } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('E-Mail-Adresse ist erforderlich');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    try {
      await onSubmit(email.trim().toLowerCase());
    } catch (error) {
      // Hata mesajları Toaster ile üst seviyede gösterilecek
    }
  };

  return (
    <div className="space-y-4">
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-full"
        >
          ← Zurück
        </Button>
      )}
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {type === 'login' ? 'Willkommen zurück' : 'Erstellen Sie Ihr Konto'}
        </h2>
        <p className="text-muted-foreground">
          {type === 'login' 
            ? 'Geben Sie Ihre E-Mail-Adresse ein, um sich anzumelden'
            : 'Geben Sie Ihre E-Mail-Adresse ein, um loszulegen'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
          disabled={isLoading}
          required
          autoComplete="email"
          error={emailError ?? undefined}
        />

        {/* API/Server hataları için Toaster kullanılacak, burada inline uyarı yok */}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Einmalpasswort wird gesendet...
            </>
          ) : (
            'Einmalpasswort senden'
          )}
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">oder</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={googleLogin}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Mit Google anmelden
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          {type === 'login' 
            ? 'Sie erhalten einen 6-stelligen Code per E-Mail'
            : 'Sie erhalten einen 6-stelligen Code zur Bestätigung'
          }
        </p>
        <p className="mt-1">Code läuft in 2 Minuten ab</p>
      </div>
    </div>
  );
};
