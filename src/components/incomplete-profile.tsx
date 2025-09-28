
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { GoogleIcon } from './google-icon';
import { CheckCircle, Loader2, Mail, Phone, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './ui/input-otp';

export default function IncompleteProfile() {
  const { user, linkGoogleAccount, setupRecaptcha, signInWithPhone, linkPhoneNumber, setPasswordForUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<'google' | 'phone' | 'password' | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      setupRecaptcha('recaptcha-container');
    }
  }, [setupRecaptcha]);

  const hasGoogle = user?.providerData.some(p => p.providerId === 'google.com');
  const hasPhone = user?.providerData.some(p => p.providerId === 'phone');
  const hasPassword = user?.providerData.some(p => p.providerId === 'password');

  const handleLinkGoogle = async () => {
    setLoading('google');
    try {
      await linkGoogleAccount();
      toast({ title: '¡Cuenta de Google Vinculada!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al vincular Google', description: error.message });
    } finally {
      setLoading(null);
    }
  };

  const handleSendOtp = async () => {
    setLoading('phone');
    try {
      if (!window.recaptchaVerifier) {
        setupRecaptcha('recaptcha-container');
      }
      const fullPhoneNumber = `+51${phone}`;
      const result = await signInWithPhone(fullPhoneNumber);
      setConfirmationResult(result);
      toast({ title: 'Código de verificación enviado', description: 'Revisa tus mensajes SMS.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error con el número', description: error.message });
    } finally {
      setLoading(null);
    }
  };
  
  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setLoading('phone');
    try {
      const fullPhoneNumber = `+51${phone}`;
      await linkPhoneNumber(confirmationResult, otp, fullPhoneNumber);
      toast({ title: '¡Teléfono Verificado y Vinculado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error en la verificación', description: 'El código OTP no es válido.' });
    } finally {
      setLoading(null);
    }
  }

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Las contraseñas no coinciden' });
      return;
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    setLoading('password');
    try {
      await setPasswordForUser(password);
      toast({ title: '¡Contraseña establecida!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al establecer contraseña', description: error.message });
    } finally {
      setLoading(null);
    }
  }

  const renderStep = ({ completed, title, description, button, content }: { completed: boolean, title: string, description: string, button?: React.ReactNode, content?: React.ReactNode }) => (
    <div className="flex gap-4">
      <div>
        {completed ? (
          <CheckCircle className="h-8 w-8 text-green-500" />
        ) : (
          <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground" />
        )}
      </div>
      <div className="flex-1 pb-6 border-l-2 border-dashed ml-4 pl-8">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {!completed && (button || content)}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completa tu Perfil de Autenticación</CardTitle>
        <CardDescription>Para activar todas las funciones de tu cuenta, por favor completa los siguientes pasos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div id="recaptcha-container" />
        {!hasPassword && renderStep({
          completed: false,
          title: 'Establecer Contraseña',
          description: 'Crea una contraseña para poder iniciar sesión con tu correo electrónico.',
          content: (
            <div className="space-y-2 mt-4">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <Button onClick={handleSetPassword} disabled={loading === 'password'} className="mt-2">
                {loading === 'password' ? <Loader2 className="animate-spin mr-2" /> : <Lock className="mr-2" />}
                Establecer Contraseña
              </Button>
            </div>
          )
        })}
        {!hasGoogle && renderStep({
          completed: false,
          title: 'Vincular Cuenta de Google',
          description: 'Conecta tu cuenta de Google para un inicio de sesión rápido y seguro.',
          button: (
            <Button onClick={handleLinkGoogle} disabled={loading === 'google'} className="mt-4">
              {loading === 'google' ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon className="mr-2" />}
              Vincular con Google
            </Button>
          )
        })}
         {!hasPhone && renderStep({
          completed: false,
          title: 'Verificar Número de Teléfono',
          description: 'Añade tu teléfono para una capa extra de seguridad y para que los conductores puedan contactarte.',
          content: (
            <div className="space-y-4 mt-4">
              {!confirmationResult ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="p-2 border rounded-l-md bg-muted text-muted-foreground text-sm">+51</span>
                    <Input type="tel" placeholder="987654321" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-l-none" />
                  </div>
                  <Button onClick={handleSendOtp} disabled={loading === 'phone' || phone.length < 9}>
                    {loading === 'phone' ? <Loader2 className="animate-spin mr-2" /> : <Phone className="mr-2" />}
                    Enviar Código
                  </Button>
                </>
              ) : (
                <>
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
                  <Button onClick={handleVerifyOtp} disabled={loading === 'phone' || otp.length < 6}>
                     {loading === 'phone' ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                    Verificar
                  </Button>
                </>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  );
}
