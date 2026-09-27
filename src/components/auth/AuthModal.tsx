import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { EmailInput } from './EmailInput';
import { OTPInput } from './OTPInput';
import { RegisterForm } from './RegisterForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

type AuthStep = 'email' | 'otp' | 'register';
type AuthType = 'login' | 'register';

export const AuthModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, isLoading, requestOtp, verifyOtp, registerRequestOtp, registerVerifyOtp } = useAuth();
  const [step, setStep] = useState<AuthStep>('email');
  const [type, setType] = useState<AuthType>('login');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!isLoginModalOpen) {
      // Modal kapandığında state'i sıfırla
      setTimeout(() => {
        setStep('email');
        setType('login');
        setEmail('');
        setFirstName('');
        setLastName('');
      }, 300); // Animasyon süresi için gecikme
    }
  }, [isLoginModalOpen]);

  const handleEmailSubmit = async (submittedEmail: string) => {
    try {
      setEmail(submittedEmail);
      await requestOtp(submittedEmail);
      setStep('otp');
      toast.success('Einmalpasswort wurde gesendet!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      if (message === 'Benutzer nicht gefunden') {
        toast.error('Benutzer nicht gefunden');
        setType('register');
        setStep('email');
      } else {
        toast.error(message);
      }
    }
  };

  const handleOtpSubmit = async (code: string) => {
    try {
      await verifyOtp(email, code);
      closeLoginModal();
      toast.success('Erfolgreich angemeldet!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      toast.error(message);
    }
  };

  const handleRegisterSubmit = async (regEmail: string, regFirstName: string, regLastName: string) => {
    try {
      setEmail(regEmail);
      setFirstName(regFirstName);
      setLastName(regLastName);
      await registerRequestOtp(regEmail, regFirstName, regLastName);
      setStep('otp');
      toast.success('Bestätigungscode wurde gesendet!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      toast.error(message);
    }
  };

  const handleRegisterOtpSubmit = async (code: string) => {
    try {
      await registerVerifyOtp(email, code, firstName, lastName);
      closeLoginModal();
      toast.success('Registrierung erfolgreich!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      toast.error(message);
    }
  };

  const handleResendCode = async () => {
    try {
      if (type === 'login') {
        await requestOtp(email);
      } else {
        await registerRequestOtp(email, firstName, lastName);
      }
      toast.success('Code wurde erneut gesendet!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      toast.error(message);
    }
  };

  const handleBack = () => {
    setStep('email');
  };

  const handleTabChange = (value: string) => {
    setType(value as AuthType);
    setStep('email');
  };

  const renderContent = () => {
    if (step === 'otp') {
      return (
        <OTPInput
          onSubmit={type === 'login' ? handleOtpSubmit : handleRegisterOtpSubmit}
          onResend={handleResendCode}
          isLoading={isLoading}
          email={email}
          type={type}
          onBack={step === 'otp' ? handleBack : undefined}
        />
      );
    }

    if (type === 'register' && step === 'email') {
      return (
        <RegisterForm
          onSubmit={handleRegisterSubmit}
          isLoading={isLoading}
          onBack={handleBack}
          initialEmail={email}
        />
      );
    }

    return (
      <EmailInput
        onSubmit={handleEmailSubmit}
        isLoading={isLoading}
        type={type}
        onBack={undefined}
      />
    );
  };

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={closeLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'otp' ? 'Code bestätigen' : 'Willkommen bei Mon Amie Chicken'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {step === 'email' && (
            <Tabs value={type} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-0">
                {renderContent()}
              </TabsContent>
              <TabsContent value="register" className="mt-0">
                {renderContent()}
              </TabsContent>
            </Tabs>
          )}
          
          {step !== 'email' && renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};