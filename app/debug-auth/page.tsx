'use client'

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 p-4">
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
          <CardHeader>
            <CardTitle>Debug Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Session Status:</h3>
              <Badge variant={status === 'authenticated' ? 'default' : 'destructive'}>
                {status}
              </Badge>
            </div>

            {session && (
              <div>
                <h3 className="font-semibold mb-2">Session Data:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">User Role:</h3>
              <Badge variant={session?.user?.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                {session?.user?.role || 'Not authenticated'}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Access to Admin Panel:</h3>
              <Badge variant={session?.user?.role === 'SUPER_ADMIN' ? 'default' : 'destructive'}>
                {session?.user?.role === 'SUPER_ADMIN' ? 'Allowed' : 'Denied'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
