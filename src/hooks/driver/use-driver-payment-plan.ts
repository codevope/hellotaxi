import { useState, useEffect, useCallback } from 'react';
import type { EnrichedDriver, PaymentModel } from '@/lib/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { getMembershipStatus } from '@/lib/driver-utils';

export function useDriverPaymentPlan(driver?: EnrichedDriver | null, setDriver?: (d: EnrichedDriver) => void) {
  const [selectedPaymentModel, setSelectedPaymentModel] = useState<PaymentModel | undefined>(driver?.paymentModel);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const { toast } = useToast();

  useEffect(() => { if (driver) setSelectedPaymentModel(driver.paymentModel); }, [driver]);

  const save = useCallback(async () => {
    if (!driver || !selectedPaymentModel || selectedPaymentModel === driver.paymentModel) return;
    setIsSavingPlan(true);
    const driverRef = doc(db, 'drivers', driver.id);
    const updates: { paymentModel: PaymentModel; membershipExpiryDate?: string; } = { paymentModel: selectedPaymentModel };
    if (selectedPaymentModel === 'membership' && driver.paymentModel !== 'membership') {
      updates.membershipExpiryDate = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
    }
    try {
      await updateDoc(driverRef, updates);
      setDriver && setDriver({ ...driver, ...updates });
      toast({ title: 'Plan de Pago Actualizado', description: `Tu modelo de pago ahora es: ${selectedPaymentModel === 'membership' ? 'Membresía' : 'Comisión'}.` });
    } catch (e) {
      console.error('Error updating payment model:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu plan de pago.' });
    } finally {
      setIsSavingPlan(false);
    }
  }, [driver, selectedPaymentModel, toast, setDriver]);

  const membershipStatus = getMembershipStatus(driver?.membershipExpiryDate);

  return { selectedPaymentModel, setSelectedPaymentModel, save, isSavingPlan, membershipStatus };
}
