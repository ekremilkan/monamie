import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface OTPInputProps {
  onSubmit: (code: string) => Promise<void>;
  isLoading: boolean;
  email: string;
  onResend: () => Promise<void>;
  timeLeft: number;
  error?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  onSubmit,
  isLoading,
  email,
  onResend,
  timeLeft,
  error: externalError,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setError(externalError || '');
  }, [externalError]);

  const handleInputChange = (index: number, value: string) => {
    setError('');
    
    // Sadece rakam kabul et
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Otomatik focus - sonraki inputa geç
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Tüm kod girildiyse otomatik submit
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Geri tuşu ve boş input - öncekine focus
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (codeStr?: string) => {
    const finalCode = codeStr || code.join('');
    
    if (finalCode.length !== 6) {
      setError('Bitte geben Sie den vollständigen Code ein');
      return;
    }

    try {
      await onSubmit(finalCode);
    } catch (err: any) {
      setError(err.message || 'Ungültiger Code');
      // Hatalı girişte kodu temizle
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Bestätigungscode</h2>
        <p className="text-sm text-gray-600">
          Wir haben einen 6-stelligen Code an <strong>{email}</strong> gesendet
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        <div className="space-y-2">
          <Label>Bestätigungscode</Label>
          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                floating={false}
                containerClassName="w-12"
                className="h-12 w-full !rounded-lg px-0 text-center text-lg font-mono border border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>

        <div className="text-center space-y-2">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-600">
              Code läuft ab in: <span className="font-mono">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResend}
              disabled={isLoading}
            >
              Code erneut senden
            </Button>
          )}
        </div>

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
            'Bestätigen'
          )}
        </Button>
      </form>
    </div>
  );
};
