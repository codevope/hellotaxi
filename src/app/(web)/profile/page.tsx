"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  User,
  Calendar,
  Mail,
  BarChart,
  Save,
  Phone,
  Home,
  LogOut,
  Star,
  LogIn,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { User as AppUser } from "@/lib/types";
import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import IncompleteProfile from "@/components/incomplete-profile";
import ProfileValidationStatus from "@/components/profile-validation-status";

const profileSchema = z.object({
  displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilePageContent() {
  const {
    user,
    appUser,
    loading: authLoading,
    updateUserRole,
    setAppUser,
  } = useAuth();
  const { isDriver } = useDriverAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncompleteProfile, setShowIncompleteProfile] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (appUser) {
      form.reset({
        displayName: appUser.name,
        phone: appUser.phone || "",
        address: appUser.address || "",
      });
    }
  }, [appUser, form]);

  if (authLoading || !appUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (appUser.status === "incomplete") {
    return (
      <div className="p-4 sm:p-8">
        <IncompleteProfile
          user={user!}
          appUser={appUser}
          setAppUser={setAppUser}
        />
      </div>
    );
  }

  const registrationDate = user?.metadata.creationTime
    ? format(new Date(user.metadata.creationTime), "MMMM 'de' yyyy", {
        locale: es,
      })
    : "No disponible";

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    const userRef = doc(db, "users", user.uid);
    try {
      await setDoc(
        userRef,
        {
          name: data.displayName,
          phone: data.phone,
          address: data.address,
        },
        { merge: true }
      );

      toast({
        title: "¡Perfil Actualizado!",
        description: "Tu información ha sido guardada correctamente.",
      });
      // Optimistically update local state
      setAppUser((prev) =>
        prev
          ? {
              ...prev,
              name: data.displayName,
              phone: data.phone,
              address: data.address,
            }
          : null
      );
      form.reset(data, { keepValues: true });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu perfil. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertToPassenger = async () => {
    setIsSubmitting(true);
    try {
      await updateUserRole("passenger");
      toast({
        title: "¡Rol actualizado!",
        description:
          "Has vuelto a ser un pasajero. Tus funciones de conductor están desactivadas.",
      });
      router.refresh();
    } catch (error) {
      console.error("Error reverting to passenger:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu rol. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidationAction = (action: "google" | "password" | "phone") => {
    setShowIncompleteProfile(true);
  };

  return (
    <div className="p-4 sm:p-8 bg-secondary/30">
      <div className="max-w-4xl mx-auto space-y-8">
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="overflow-hidden shadow-lg">
                <CardHeader className="bg-card p-6 border-b">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-primary">
                      <AvatarImage
                        src={user?.photoURL || ""}
                        alt={user?.displayName || ""}
                      />
                      <AvatarFallback className="text-3xl">
                        {form.watch("displayName")?.charAt(0) ||
                          user?.email?.charAt(0) ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-3xl font-bold font-headline">
                        Mi Perfil
                      </CardTitle>
                      <CardDescription className="text-lg text-muted-foreground">
                        Administra tu información personal y tus preferencias.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="text-primary" />
                      <span>Información Personal</span>
                    </h3>

                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                placeholder="Ej: +51 987654321"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                placeholder="Ej: Av. Principal 123"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2 pt-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>{user?.email} (no se puede cambiar)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span>Miembro desde {registrationDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <BarChart className="text-primary" />
                      <span>Estadísticas</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-4xl font-bold">
                          {appUser.totalRides || 0}
                        </p>
                        <p className="text-muted-foreground">Viajes Totales</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-4xl font-bold flex items-center justify-center gap-1">
                          <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                          {(appUser.rating || 0).toFixed(1)}
                        </p>
                        <p className="text-muted-foreground">Tu Calificación</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-card border-t p-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isDirty}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2" />
                    Guardar Cambios
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>

          {/* Estado de Validación del Perfil */}
          <ProfileValidationStatus
            user={user}
            userProfile={appUser}
            showActions={true}
            onActionClick={handleValidationAction}
          />
          {isDriver && (
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Rol de Conductor</CardTitle>
                <CardDescription>
                  Si ya no deseas conducir, puedes desactivar temporalmente tu
                  rol de conductor. Tu información y verificaciones se
                  mantendrán para cuando decidas volver.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleRevertToPassenger}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Volver a ser solo Pasajero
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Modal de Perfil Incompleto */}
          {showIncompleteProfile && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Completar Perfil</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowIncompleteProfile(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="p-4">
                  <IncompleteProfile
                    user={user!}
                    appUser={appUser}
                    setAppUser={setAppUser}
                  />
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4 py-16 md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>
              Para ver tu perfil, por favor, inicia sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/login">
                <LogIn className="mr-2" />
                Ir a Iniciar Sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ProfilePageContent />;
}
