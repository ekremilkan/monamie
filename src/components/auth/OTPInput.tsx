import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Loader2, Clock } from 'lucide-react';

interface OTPInputProps {
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  // error prop kaldırıldı, toaster kullanılacak
  email: string;
  type: 'login' | 'register';
  onBack?: () => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  onSubmit,
  onResend,
  isLoading,
  // error kaldırıldı
  email,
  type,
  onBack,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(120); // 2 dakika
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^[0-9]$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Otomatik focus
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Tüm alanlar doldurulduğunda otomatik submit
    if (newCode.every(digit => digit !== '')) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (submitCode?: string) => {
    const finalCode = submitCode || code.join('');
    
    if (finalCode.length !== 6) {
      return;
    }

    try {
      await onSubmit(finalCode);
    } catch (error) {
      // Hata mesajları Toaster ile üst seviyede gösterilecek
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    try {
      await onResend();
      setCode(['', '', '', '', '', '']);
      setTimeLeft(120);
      setCanResend(false);
      inputsRef.current[0]?.focus();
    } catch (error) {
      // Hata mesajları Toaster ile üst seviyede gösterilecek
    } finally {
      setIsResending(false);
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
          {type === 'login' ? 'Code eingeben' : 'Code bestätigen'}
        </h2>
        <p className="text-muted-foreground">
          Wir haben einen 6-stelligen Code an <strong>{email}</strong> gesendet
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        <div className="space-y-2">
          <Label>Einmalpasswort</Label>
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                floating={false}
                containerClassName="w-12"
                className="h-12 w-full !rounded-lg px-0 text-center text-lg font-bold border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
                autoComplete="one-time-code"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Code läuft ab in: {formatTime(timeLeft)}</span>
        </div>

        {/* API/Server hataları için Toaster kullanılacak, burada inline uyarı yok */}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.some(digit => digit === '')}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird überprüft...
            </>
          ) : (
            'Code bestätigen'
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Code nicht erhalten?
        </p>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={handleResend}
          disabled={!canResend || isResending}
          className="text-primary"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            'Code erneut senden'
          )}
        </Button>
      </div>
    </div>
  );
};
