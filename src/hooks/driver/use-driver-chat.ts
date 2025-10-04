import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UseDriverChatParams {
  rideId?: string;
  userId?: string;
}

export function useDriverChat({ rideId, userId }: UseDriverChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!rideId) return;
    const q = query(collection(db, 'rides', rideId, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [rideId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!rideId || !userId || !text.trim()) return;
    try {
      await addDoc(collection(db, 'rides', rideId, 'chatMessages'), {
        userId,
        text,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error sending message', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
    }
  }, [rideId, userId, toast]);

  return { messages, sendMessage };
}
