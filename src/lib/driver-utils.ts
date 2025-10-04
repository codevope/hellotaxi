import type { EnrichedDriver } from '@/lib/types';

export function getMembershipStatus(expiryDate?: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; } {
  if (!expiryDate) return { label: 'N/A', variant: 'secondary' };
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return { label: 'Vencida', variant: 'destructive' };
  if (diffDays <= 7) return { label: 'Por Vencer', variant: 'outline' };
  return { label: 'Activa', variant: 'default' };
}
