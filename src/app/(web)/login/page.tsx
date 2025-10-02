
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleIcon } from '@/components/google-icon';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { RecaptchaVerifier } from 'firebase/auth';

export default function LoginPage() {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    loading 
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [emailRegister, setEmailRegister] = useState('');
  const [passwordRegister, setPasswordRegister] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmail(emailLogin, passwordLogin);
      toast({ title: '¡Bienvenido de vuelta!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al iniciar sesión', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signUpWithEmail(emailRegister, passwordRegister);
      toast({ title: '¡Registro exitoso!', description: 'Bienvenido a Hello Taxi.' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error en el registro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleOtpConfirm = async () => {
    if (!confirmationResult) return;
    setIsSubmitting(true);
    try {
      await confirmationResult.confirm(otp);
      toast({ title: '¡Inicio de sesión exitoso!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error en la verificación', description: 'El código OTP no es válido.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
      setIsSubmitting(true);
      try {
          await signInWithGoogle();
          toast({ title: '¡Bienvenido!' });
          router.push('/');
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error con Google', description: error.message });
      } finally {
          setIsSubmitting(false);
      }
  }


  return (
    <div className="flex items-center justify-center p-4 min-h-[80vh]">
      <Card className="max-w-md w-full shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Inicia Sesión o Regístrate</CardTitle>
            <CardDescription>Elige tu método preferido para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email-login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email-login">Ingresar</TabsTrigger>
                <TabsTrigger value="email-register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="email-login" className="space-y-4 pt-4">
                 <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-login">Correo Electrónico</Label>
                      <Input id="email-login" type="email" placeholder="tu@correo.com" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} required />
                    </div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="password-login">Contraseña</Label>
                        <Input id="password-login" type={showPassword ? "text" : "password"} placeholder="••••••••" value={passwordLogin} onChange={(e) => setPasswordLogin(e.target.value)} required />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                      <Mail className="mr-2" /> Ingresar con Correo
                    </Button>
                 </form>
              </TabsContent>
               <TabsContent value="email-register" className="space-y-4 pt-4">
                 <form onSubmit={handleEmailRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-register">Correo Electrónico</Label>
                      <Input id="email-register" type="email" placeholder="tu@correo.com" value={emailRegister} onChange={(e) => setEmailRegister(e.target.value)} required />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="password-register">Contraseña</Label>
                      <Input id="password-register" type={showPassword ? "text" : "password"} placeholder="Crea una contraseña segura" value={passwordRegister} onChange={(e) => setPasswordRegister(e.target.value)} required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                      <Mail className="mr-2" /> Registrarme
                    </Button>
                 </form>
              </TabsContent>
            </Tabs>
             <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                <GoogleIcon className="mr-2"/>
                Google
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
