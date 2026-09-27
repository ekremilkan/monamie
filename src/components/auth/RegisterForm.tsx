import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Loader2, User, Mail } from 'lucide-react';

interface RegisterFormProps {
  onSubmit: (email: string, firstName: string, lastName: string) => Promise<void>;
  isLoading: boolean;
  // error prop kaldırıldı, toaster kullanılacak
  onBack?: () => void;
  initialEmail?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isLoading,
  // error kaldırıldı
  onBack,
  initialEmail,
}) => {
  const [formData, setFormData] = useState({
    email: initialEmail ?? '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialEmail && initialEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail-Adresse ist erforderlich';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(
        formData.email.trim().toLowerCase(),
        formData.firstName.trim(),
        formData.lastName.trim()
      );
    } catch (error) {
      // Hata mesajları Toaster ile üst seviyede gösterilecek
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-4">
      
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Erstellen Sie Ihr Konto</h2>
        <p className="text-muted-foreground">
          Registrieren Sie sich, um Bestellungen aufzugeben und Ihre Lieblingsgerichte zu speichern
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            type="text"
            label="Vorname"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            leadingIcon={<User className="h-4 w-4" />}
            disabled={isLoading}
            required
            autoComplete="given-name"
            error={errors.firstName}
          />

          <Input
            id="lastName"
            type="text"
            label="Nachname"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            leadingIcon={<User className="h-4 w-4" />}
            disabled={isLoading}
            required
            autoComplete="family-name"
            error={errors.lastName}
          />
        </div>

        <Input
          id="email"
          type="email"
          label="E-Mail-Adresse"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
          disabled={isLoading}
          required
          autoComplete="email"
          error={errors.email}
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
              Wird gesendet...
            </>
          ) : (
            'Einmalpasswort senden'
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Sie erhalten einen 6-stelligen Code zur Bestätigung
        </p>
        <p className="mt-1">Code läuft in 2 Minuten ab</p>
      </div>
    </div>
  );
};
