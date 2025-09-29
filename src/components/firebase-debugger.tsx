'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function FirebaseDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkFirebaseConfig = () => {
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      };

      const status = {
        configLoaded: Object.values(config).every(val => val && val !== 'undefined'),
        authInitialized: !!auth,
        currentUser: auth.currentUser ? 'Authenticated' : 'Not authenticated',
        domain: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
        localStorage: typeof Storage !== 'undefined',
        recaptchaSupported: typeof window !== 'undefined' && 'grecaptcha' in window,
        config: {
          ...config,
          apiKey: config.apiKey ? config.apiKey.substring(0, 10) + '...' : 'Missing'
        }
      };

      setDebugInfo(status);
    };

    checkFirebaseConfig();
  }, []);

  const testRecaptcha = () => {
    console.log('Testing reCAPTCHA initialization...');
    try {
      const container = document.getElementById('debug-recaptcha');
      if (container) {
        // This would normally initialize reCAPTCHA
        console.log('Container found, reCAPTCHA can be initialized');
      }
    } catch (error) {
      console.error('reCAPTCHA test failed:', error);
    }
  };

  const StatusIcon = ({ condition }: { condition: boolean }) => (
    condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  );

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Firebase Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <StatusIcon condition={debugInfo.configLoaded} />
            <span>Config Loaded</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon condition={debugInfo.authInitialized} />
            <span>Auth Initialized</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon condition={debugInfo.localStorage} />
            <span>LocalStorage Available</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon condition={debugInfo.userAgent === 'Chrome'} />
            <span>Chrome Browser</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Domain:</span>
            <Badge variant="outline">{debugInfo.domain}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Protocol:</span>
            <Badge variant="outline">{debugInfo.protocol}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Auth Status:</span>
            <Badge variant="outline">{debugInfo.currentUser}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Project ID:</span>
            <Badge variant="outline">{debugInfo.config?.projectId || 'Missing'}</Badge>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button onClick={testRecaptcha} variant="outline" size="sm">
            Test reCAPTCHA Setup
          </Button>
          <div id="debug-recaptcha" className="mt-2 p-2 border rounded min-h-[50px] bg-white"></div>
        </div>

        <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
          <strong>Nota:</strong> Este componente es solo para debugging. 
          Si ves errores, verifica la configuración de Firebase Console.
        </div>
      </CardContent>
    </Card>
  );
}