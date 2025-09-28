
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { User as AppUser, User as FirebaseUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleIcon } from './google-icon';
import { Input } from './ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './ui/input-otp';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

interface IncompleteProfileProps {
  user: FirebaseUser;
  appUser: AppUser;
  setAppUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

export default function IncompleteProfile({ user, appUser, setAppUser }: IncompleteProfileProps) {
  const {
    linkGoogleAccount,
    setupRecaptcha,
    signInWithPhone,
    linkPhoneNumber,
    setPasswordForUser,
    checkAndCompleteProfile,
    loading: authLoading,
  } = useAuth();

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<'google' | 'phone' | 'password' | 'otp' | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const providerIds = user.providerData.map((p) => p.providerId);
  const hasGoogle = providerIds.includes('google.com');
  const hasPassword = providerIds.includes('password');
  const hasPhone = providerIds.includes('phone');

  useEffect(() => {
    // This ensures the container exists before initializing reCAPTCHA
    setTimeout(() => {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container');
      }
    }, 100);
  }, [setupRecaptcha]);


  const handleLinkGoogle = async () => {
    setIsLoading('google');
    try {
      await linkGoogleAccount();
      await checkAndCompleteProfile(user.id);
      toast({ title: '¡Cuenta de Google vinculada con éxito!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al vincular Google', description: error.message });
    } finally {
      setIsLoading(null);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un número de teléfono.' });
        return;
    }
    if (!recaptchaVerifierRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'reCAPTCHA no está listo. Por favor, espera un momento.' });
        return;
    }
    setIsLoading('phone');
    try {
        const fullPhoneNumber = `+51${phone}`; // Asumiendo código de Perú
        const result = await signInWithPhone(fullPhoneNumber, recaptchaVerifierRef.current);
        setConfirmationResult(result);
        toast({ title: 'Código de verificación enviado', description: `Revisa tus mensajes SMS en ${fullPhoneNumber}.` });
    } catch (error: any) {
        let description = 'Ocurrió un error al enviar el código. Inténtalo de nuevo más tarde.';
        if (error.code === 'auth/too-many-requests') {
          description = 'Has enviado demasiadas solicitudes. Por favor, intenta de nuevo más tarde.';
        } else if (error.message) {
          description = error.message;
        }
        toast({ variant: 'destructive', title: 'Error al enviar código', description: description });
    } finally {
        setIsLoading(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    setIsLoading('otp');
    try {
        const fullPhoneNumber = `+51${phone}`;
        await linkPhoneNumber(fullPhoneNumber, confirmationResult, otp);
        await checkAndCompleteProfile(user.id);
        toast({ title: '¡Teléfono verificado y vinculado con éxito!' });
        setConfirmationResult(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error en la verificación', description: 'El código OTP no es válido.' });
    } finally {
        setIsLoading(null);
    }
  };
  
  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden.' });
        return;
    }
    if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
    }
    setIsLoading('password');
    try {
        await setPasswordForUser(password);
        await checkAndCompleteProfile(user.id);
        toast({ title: '¡Contraseña establecida con éxito!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al establecer la contraseña', description: error.message });
    } finally {
        setIsLoading(null);
    }
  };


  const renderStep = (
    isComplete: boolean,
    icon: React.ReactNode,
    title: string,
    description: string,
    actionContent: React.ReactNode
  ) => (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <div className="flex-shrink-0 mt-1">
        {isComplete ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-yellow-500" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {!isComplete && <div className="mt-4">{actionContent}</div>}
      </div>
    </div>
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Completa tu Perfil</CardTitle>
        <CardDescription>
          Para usar todas las funciones de Hello Taxi, necesitamos que vincules tus cuentas.
          Esto aumenta la seguridad y te da más opciones para iniciar sesión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div id="recaptcha-container"></div>
        {renderStep(
            hasGoogle,
            <GoogleIcon className="h-6 w-6"/>,
            'Vincular Cuenta de Google',
            hasGoogle ? 'Tu cuenta de Google está vinculada.' : 'Inicia sesión con Google para vincular tu cuenta.',
             <Button onClick={handleLinkGoogle} disabled={isLoading === 'google'}>
                {isLoading === 'google' && <Loader2 className="mr-2 animate-spin" />}
                <GoogleIcon className="mr-2"/> Vincular con Google
            </Button>
        )}

        {renderStep(
            hasPassword,
            <Lock className="h-6 w-6" />,
            'Establecer Contraseña',
            hasPassword ? 'Ya tienes una contraseña establecida.' : 'Crea una contraseña para poder iniciar sesión con tu correo electrónico.',
            <div className="space-y-4">
                <Input type="password" placeholder="Nueva Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Input type="password" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                 <Button onClick={handleSetPassword} disabled={isLoading === 'password' || !password || !confirmPassword}>
                    {isLoading === 'password' && <Loader2 className="mr-2 animate-spin" />}
                    Guardar Contraseña
                </Button>
            </div>
        )}
        
        {renderStep(
            hasPhone,
            <Phone className="h-6 w-6" />,
            'Verificar Número de Teléfono',
            hasPhone ? `Tu teléfono (${user.phoneNumber}) está verificado.` : 'Añade y verifica tu teléfono para recibir notificaciones importantes.',
            !confirmationResult ? (
                <div className="space-y-4">
                    <div className="flex items-center">
                        <span className="p-2 border rounded-l-md bg-muted text-muted-foreground text-sm">+51</span>
                        <Input id="phone" type="tel" placeholder="987654321" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-l-none" disabled={isLoading === 'phone'} />
                    </div>
                    <Button onClick={handleSendOtp} disabled={isLoading === 'phone' || !phone}>
                        {isLoading === 'phone' && <Loader2 className="mr-2 animate-spin" />}
                        Enviar Código OTP
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Introduce el código de 6 dígitos enviado a +51{phone}.</p>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                    <Button onClick={handleVerifyOtp} disabled={isLoading === 'otp' || otp.length < 6}>
                        {isLoading === 'otp' && <Loader2 className="mr-2 animate-spin" />}
                        Verificar Teléfono
                    </Button>
                </div>
            )
        )}
      </CardContent>
    </Card>
  );
}

    
