
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { User as AppUser } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, Lock, CheckCircle } from 'lucide-react';
import { GoogleIcon } from './google-icon';
import { Input } from './ui/input';

interface IncompleteProfileProps {
  user: FirebaseUser;
  appUser: AppUser;
  setAppUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

export default function IncompleteProfile({ user, appUser, setAppUser }: IncompleteProfileProps) {
  const {
    linkGoogleAccount,
    setPasswordForUser,
    updatePhoneNumber,
    checkAndCompleteProfile,
    loading: authLoading,
  } = useAuth();

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<'google' | 'phone' | 'password' | null>(null);
  
  // Initialize phone number without +51 prefix for display
  const initPhone = appUser.phone 
    ? appUser.phone.startsWith('+51') 
      ? appUser.phone.substring(3) 
      : appUser.phone
    : '';
  
  const [phone, setPhone] = useState(initPhone);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const providerIds = user.providerData.map((p) => p.providerId);
  const hasGoogle = providerIds.includes('google.com');
  const hasPassword = providerIds.includes('password');
  const hasPhoneInProfile = appUser.phone && appUser.phone.trim().length > 0;

  const isComplete = hasGoogle && hasPassword && hasPhoneInProfile;

  const handleGoogleLink = async () => {
    setIsLoading('google');
    try {
      await linkGoogleAccount();
      await checkAndCompleteProfile(user.uid);
      toast({
        title: 'Google vinculado exitosamente',
        description: 'Tu cuenta de Google ha sido vinculada.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo vincular la cuenta de Google.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handlePasswordSetup = async () => {
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading('password');
    try {
      await setPasswordForUser(password);
      await checkAndCompleteProfile(user.uid);
      toast({
        title: 'Contraseña configurada',
        description: 'Tu contraseña ha sido configurada exitosamente.',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo configurar la contraseña.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!phone.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un número de teléfono.',
        variant: 'destructive',
      });
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Peruvian phone validation - should be 9 digits (mobile numbers)
    const peruPhoneRegex = /^9\d{8}$/;
    if (!peruPhoneRegex.test(cleanPhone)) {
      toast({
        title: 'Error',
        description: 'Ingresa un número de celular peruano válido (9 dígitos, iniciando con 9).',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading('phone');
    try {
      // Store with +51 prefix in the database
      const fullPhoneNumber = `+51${cleanPhone}`;
      await updatePhoneNumber(fullPhoneNumber);
      toast({
        title: 'Teléfono actualizado',
        description: `Tu número ${fullPhoneNumber} ha sido registrado.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el teléfono.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            ¡Perfil Completo!
          </h3>
          <p className="text-sm text-gray-600">
            Tu perfil está configurado correctamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">Completa tu Perfil</CardTitle>
        <CardDescription className="text-center">
          Para usar HelloTaxi necesitas: vincular Google + configurar contraseña + registrar teléfono.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google Authentication */}
        {!hasGoogle && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Vincular Google
            </h4>
            <Button
              onClick={handleGoogleLink}
              disabled={isLoading === 'google' || authLoading}
              className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white"
            >
              {isLoading === 'google' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Vincular con Google
                </>
              )}
            </Button>
          </div>
        )}

        {/* Password Setup */}
        {!hasPassword && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Configurar Contraseña
            </h4>
            <Input
              type="password"
              placeholder="Crear contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              onClick={handlePasswordSetup}
              disabled={isLoading === 'password' || authLoading}
              className="w-full"
            >
              {isLoading === 'password' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Configurar Contraseña
                </>
              )}
            </Button>
          </div>
        )}

        {/* Phone Number */}
        {!hasPhoneInProfile && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número de Teléfono
            </h4>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                +51
              </div>
              <Input
                type="tel"
                placeholder="987 654 321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-12"
                maxLength={11}
              />
            </div>
            <p className="text-xs text-gray-600">
              Ingresa tu número de celular peruano (9 dígitos)
            </p>
            <Button
              onClick={handlePhoneUpdate}
              disabled={isLoading === 'phone' || authLoading}
              className="w-full"
            >
              {isLoading === 'phone' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Registrar Teléfono
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status indicators */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {hasGoogle ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasGoogle ? 'text-green-700' : 'text-gray-500'}>
              Google vinculado
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {hasPassword ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasPassword ? 'text-green-700' : 'text-gray-500'}>
              Contraseña configurada
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {hasPhoneInProfile ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={hasPhoneInProfile ? 'text-green-700' : 'text-gray-500'}>
              Teléfono registrado
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    
