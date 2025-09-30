"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  Shield,
  ShieldQuestion,
} from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";
import { cn } from "@/lib/utils";
import type { User } from '@/lib/types';


interface ProfileValidationStatusProps {
  user: (FirebaseUser & { providerData: { providerId: string }[] }) | null;
  userProfile?: User | null;
  className?: string;
  showActions?: boolean;
  onActionClick?: (action: "google" | "password" | "phone") => void;
}

export default function ProfileValidationStatus({
  user,
  userProfile,
  className,
  showActions = false,
  onActionClick,
}: ProfileValidationStatusProps) {

  const hasGoogle = user?.providerData?.some(p => p.providerId === 'google.com') ?? false;
  const hasPassword = user?.providerData?.some(p => p.providerId === 'password') ?? false;
  const hasPhoneInProfile = !!userProfile?.phone && userProfile.phone.trim().length > 0;

  // User needs Google AND password AND phone in profile
  const isComplete = hasGoogle && hasPassword && hasPhoneInProfile;
  
  const completedSteps = [hasGoogle, hasPassword, hasPhoneInProfile].filter(Boolean).length;
  const totalSteps = 3;
  const completionPercentage = (completedSteps / totalSteps) * 100;

  const validationItems = [
    {
      id: "google",
      icon: Mail,
      title: "Google",
      description: hasGoogle ? "Vinculada" : "No vinculada",
      isComplete: hasGoogle,
      action: hasGoogle ? "Listo" : "Vincular",
    },
    {
      id: "password",
      icon: Lock,
      title: "Email/Contraseña",
      description: hasPassword ? "Activa" : "No configurada",
      isComplete: hasPassword,
      action: hasPassword ? "Listo" : "Configurar",
    },
    {
      id: "phone",
      icon: Phone,
      title: "Teléfono",
      description: hasPhoneInProfile 
        ? `Registrado: ${userProfile?.phone}` 
        : "No registrado",
      isComplete: hasPhoneInProfile,
      action: hasPhoneInProfile ? "Actualizar" : "Registrar",
    },
  ];

  if (!user) {
    return (
       <Card className={cn("bg-muted border-dashed", className)}>
         <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <ShieldQuestion className="h-6 w-6 text-muted-foreground"/>
              <div>
                <CardTitle className="text-lg">Estado de Validación Desconocido</CardTitle>
                <p className="text-sm text-muted-foreground">No se pudo cargar la información de autenticación del usuario.</p>
              </div>
            </div>
         </CardHeader>
       </Card>
    )
  }

  return (
    <Card className={cn("bg-[#F2F2F2] border-none shadow-md", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield
              className={cn(
                "h-6 w-6",
                isComplete ? "text-[#2E4CA6]" : "text-[#049DD9]"
              )}
            />
            <div>
              <CardTitle className="text-lg text-[#2E4CA6]">
                Seguridad del Perfil
              </CardTitle>
              <p className="text-sm text-[#0477BF]">
                {completedSteps} / {totalSteps} completado
              </p>
            </div>
          </div>
          <Badge
            variant={isComplete ? "default" : "secondary"}
            className={cn(
              "px-3 py-1 text-sm font-semibold",
              isComplete ? "bg-[#05C7F2] text-white" : "bg-[#049DD9] text-white"
            )}
          >
            {isComplete ? "Completo" : `${Math.round(completionPercentage)}%`}
          </Badge>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-300 rounded-full h-2 mt-4">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              isComplete ? "bg-[#2E4CA6]" : "bg-[#05C7F2]"
            )}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {validationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    item.isComplete
                      ? "bg-[#2E4CA6] text-white"
                      : "bg-gray-100 text-[#0477BF]"
                  )}
                >
                  {item.isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-[#2E4CA6]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#0477BF]">{item.description}</p>
                </div>
              </div>

              {!item.isComplete && showActions && onActionClick && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onActionClick(item.id as "google" | "password" | "phone")
                  }
                  className="text-xs border-[#049DD9] text-[#049DD9] hover:bg-[#05C7F2] hover:text-white"
                >
                  {item.action}
                </Button>
              )}

              {item.isComplete && (
                <CheckCircle2 className="h-5 w-5 text-[#05C7F2]" />
              )}
            </div>
          );
        })}

        {/* Mensaje final */}
        {!isComplete && (
          <div className="mt-3 p-3 rounded-lg bg-[#F2F2F2] border border-[#049DD9] text-[#0477BF] text-sm text-center">
            El perfil de seguridad del usuario está incompleto.
          </div>
        )}

        {isComplete && (
          <div className="mt-3 p-3 rounded-lg bg-[#2E4CA6] text-white text-sm text-center">
            Perfil de seguridad completo.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
