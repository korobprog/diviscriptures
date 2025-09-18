'use client'

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot } from 'lucide-react';

export default function AdminDebugPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be a super admin to access this page.</p>
            <p className="mt-2">Current role: {session?.user?.role || 'Not authenticated'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-saffron-800 mb-2">
            Admin Debug Panel
          </h1>
          <p className="text-saffron-600">
            Debug version of admin panel
          </p>
        </div>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-saffron-200">
            <TabsTrigger value="requests" className="data-[state=active]:bg-saffron-100 data-[state=active]:text-saffron-800">
              Requests
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-saffron-100 data-[state=active]:text-saffron-800">
              Groups
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-saffron-100 data-[state=active]:text-saffron-800">
              AI Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-purple-500" />
                  AI Settings Debug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Current User:</h4>
                  <p>Email: {session.user.email}</p>
                  <p>Role: {session.user.role}</p>
                  <p>ID: {session.user.id}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">AI Settings Form:</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-saffron-700 mb-2">
                        OpenAI API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-saffron-200 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      />
                    </div>
                    <button className="bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-md">
                      Save Settings
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
