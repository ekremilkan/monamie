import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail } from 'lucide-react';

interface EmailInputProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  title?: string;
  description?: string;
  submitText?: string;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  onSubmit,
  isLoading,
  title = 'E-Mail-Adresse',
  description = 'Geben Sie Ihre E-Mail-Adresse ein, um fortzufahren',
  submitText = 'Weiter',
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('E-Mail-Adresse ist erforderlich');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Ungültige E-Mail-Adresse');
      return;
    }

    try {
      await onSubmit(email.trim());
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
          disabled={isLoading}
          required
          autoComplete="email"
          error={error || undefined}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            submitText
          )}
        </Button>
      </form>
    </div>
  );
};
