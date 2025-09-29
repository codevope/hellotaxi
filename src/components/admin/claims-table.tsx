'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Claim, User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, DocumentReference } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const statusConfig = {
  open: { label: 'Abierto', variant: 'destructive' as const },
  'in-progress': { label: 'En Proceso', variant: 'default' as const },
  resolved: { label: 'Resuelto', variant: 'secondary' as const },
};

type EnrichedClaim = Omit<Claim, 'claimant'> & { claimant: User };

async function getClaims(): Promise<EnrichedClaim[]> {
  const claimsCol = collection(db, 'claims');
  const claimSnapshot = await getDocs(claimsCol);
  const claimsList = claimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));

  const enrichedClaims: EnrichedClaim[] = [];

  for (const claim of claimsList) {
    if (claim.claimant && claim.claimant instanceof DocumentReference) {
      const claimantSnap = await getDoc(claim.claimant);
      if(claimantSnap.exists()) {
        enrichedClaims.push({
          ...claim,
          claimant: { id: claimantSnap.id, ...claimantSnap.data() } as User,
        });
      }
    }
  }
  
  return enrichedClaims.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


export default function ClaimsTable() {
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClaims() {
      try {
        const fetchedClaims = await getClaims();
        setClaims(fetchedClaims);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    }
    loadClaims();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Reclamos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={claim.claimant.avatarUrl}
                        alt={claim.claimant.name}
                      />
                      <AvatarFallback>
                        {claim.claimant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{claim.claimant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID Viaje: {claim.rideId}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{claim.reason}</div>
                </TableCell>
                <TableCell>
                  {new Date(claim.date).toLocaleDateString('es-PE')}
                </TableCell>
                 <TableCell>
                    <Badge variant={statusConfig[claim.status].variant}>
                        {statusConfig[claim.status].label}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/claims/${claim.id}`}>
                        Gestionar
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
