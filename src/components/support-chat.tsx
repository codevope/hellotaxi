'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supportChat } from '@/ai/flows/support-chat';
import { useToast } from '@/hooks/use-toast';
import { SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';

type Message = {
  text: string;
  isUser: boolean;
};

export default function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div > div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      const userMessage: Message = { text: inputText, isUser: true };
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      try {
        const history = messages.map((msg) => ({
          query: msg.isUser ? msg.text : '',
          response: !msg.isUser ? msg.text : '',
        }));

        const result = await supportChat({ query: inputText, history });
        const aiMessage: Message = { text: result.response, isUser: false };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error en el chat de soporte:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo obtener una respuesta. Inténtalo de nuevo.',
        });
        // Remove the user's message if the API call fails
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <SheetHeader className="text-center px-6">
        <SheetTitle>Asistente de Soporte</SheetTitle>
        <SheetDescription>
            Haz una pregunta sobre la aplicación y la IA te ayudará.
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-4 py-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                msg.isUser ? 'justify-end' : 'justify-start'
              )}
            >
              {!msg.isUser && (
                <div className="bg-primary rounded-full p-2">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 max-w-xs md:max-w-md',
                  msg.isUser
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
              {msg.isUser && (
                <div className="bg-secondary rounded-full p-2">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <div className="bg-primary rounded-full p-2">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center p-2 border-t">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Haz una pregunta..."
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isLoading}
        />
        <Button onClick={handleSend} size="icon" className="ml-2" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
