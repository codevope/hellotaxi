"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreditCard, CalendarCheck, Save, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import type { PaymentModel, EnrichedDriver } from "@/lib/types";

interface PaymentPlanSelectorProps {
  driver: EnrichedDriver;
  onSave: (paymentModel: PaymentModel) => Promise<void>;
  isSaving: boolean;
}

const getMembershipStatus = (
  expiryDate?: string
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} => {
  if (!expiryDate) return { label: "N/A", variant: "secondary" };

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return { label: "Vencida", variant: "destructive" };
  if (diffDays <= 7) return { label: "Por Vencer", variant: "outline" };
  return { label: "Activa", variant: "default" };
};

export function PaymentPlanSelector({
  driver,
  onSave,
  isSaving,
}: PaymentPlanSelectorProps) {
  const [selectedPaymentModel, setSelectedPaymentModel] = useState<
    PaymentModel | undefined
  >(driver.paymentModel);

  useEffect(() => {
    setSelectedPaymentModel(driver.paymentModel);
  }, [driver.paymentModel]);

  const membershipStatus = getMembershipStatus(driver.membershipExpiryDate);
  const hasChanges = selectedPaymentModel !== driver.paymentModel;

  const handleSave = async () => {
    if (selectedPaymentModel && hasChanges) {
      await onSave(selectedPaymentModel);
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader className="bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Mi Plan de Pago
        </CardTitle>
        <CardDescription className="text-white/90">
          Elige cómo quieres ganar dinero con Hello Taxi.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <RadioGroup
          value={selectedPaymentModel}
          onValueChange={(value) =>
            setSelectedPaymentModel(value as PaymentModel)
          }
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Plan de Comisión */}
            <Label
              htmlFor="payment-commission"
              className="flex flex-col p-5 border-2 rounded-xl cursor-pointer hover:bg-accent/50 has-[:checked]:bg-gradient-to-br has-[:checked]:from-blue-50 has-[:checked]:to-indigo-50 has-[:checked]:border-[#0477BF] transition-all shadow-sm hover:shadow-md"
            >
              <RadioGroupItem
                value="commission"
                id="payment-commission"
                className="sr-only"
              />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xl text-gray-900">
                  💰 Comisión
                </span>
                {selectedPaymentModel === "commission" && (
                  <Badge className="bg-[#0477BF]">Seleccionado</Badge>
                )}
              </div>
              <span className="text-sm text-gray-600 leading-relaxed">
                Gana un porcentaje de cada viaje. Ideal para conductores a
                tiempo parcial o que están comenzando.
              </span>
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Comisión por viaje
                </p>
                <p className="text-2xl font-bold text-[#0477BF]">15%</p>
              </div>
            </Label>

            {/* Plan de Membresía */}
            <Label
              htmlFor="payment-membership"
              className="flex flex-col p-5 border-2 rounded-xl cursor-pointer hover:bg-accent/50 has-[:checked]:bg-gradient-to-br has-[:checked]:from-purple-50 has-[:checked]:to-pink-50 has-[:checked]:border-purple-500 transition-all shadow-sm hover:shadow-md"
            >
              <RadioGroupItem
                value="membership"
                id="payment-membership"
                className="sr-only"
              />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xl text-gray-900">
                  🎖️ Membresía
                </span>
                {selectedPaymentModel === "membership" && (
                  <Badge className="bg-purple-600">Seleccionado</Badge>
                )}
              </div>
              <span className="text-sm text-gray-600 leading-relaxed">
                Paga una cuota fija mensual y quédate con casi toda la tarifa.
                Ideal para conductores a tiempo completo.
              </span>
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Cuota mensual
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  S/ 199.00
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* Estado de membresía (solo si está seleccionada) */}
        {selectedPaymentModel === "membership" && (
          <div className="mt-6 p-5 border-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <h4 className="font-semibold flex items-center gap-2 text-gray-900 mb-3">
              <CalendarCheck className="h-5 w-5 text-purple-600" />
              Estado de tu Membresía
            </h4>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <Badge variant={membershipStatus.variant} className="text-sm">
                {membershipStatus.label}
              </Badge>
              {driver.membershipExpiryDate && (
                <span className="text-sm text-gray-700 font-medium">
                  Vence el:{" "}
                  <span className="text-purple-700 font-bold">
                    {format(new Date(driver.membershipExpiryDate), "dd/MM/yyyy")}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="w-full sm:w-auto bg-gradient-to-r from-[#0477BF] to-[#049DD9] hover:from-[#0477BF]/90 hover:to-[#049DD9]/90"
          size="lg"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </CardFooter>
    </Card>
  );
}
