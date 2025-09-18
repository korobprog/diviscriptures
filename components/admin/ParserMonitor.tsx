'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Separator } from '@/src/components/ui/separator';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Activity,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface ParseStatus {
  id: string;
  textType: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'stopped';
  progress: number;
  currentChapter: number;
  totalChapters: number;
  currentVerse: number;
  totalVerses: number;
  processedVerses: number;
  errors: number;
  startTime?: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number;
  speed: number; // verses per minute
}

interface LogEntry {
  id: string;
  timestamp: Date | string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

interface ParserStats {
  totalParsed: number;
  totalErrors: number;
  averageSpeed: number;
  lastParseTime: Date | null;
  successRate: number;
}

export default function ParserMonitor() {
  const { data: session, status } = useSession();
  const [parseStatus, setParseStatus] = useState<ParseStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ParserStats>({
    totalParsed: 0,
    totalErrors: 0,
    averageSpeed: 0,
    lastParseTime: null,
    successRate: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [useAIProcessing, setUseAIProcessing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Socket connection for real-time updates
  useEffect(() => {
    // Don't start socket if user is not authenticated or not an admin
    if (status === 'loading' || !session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return;
    }

    // Add test log to verify UI is working
    addLog('info', 'ParserMonitor initialized - UI is working');

    const initializeSocket = () => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      console.log('ParserMonitor: Connecting to socket server at:', socketUrl);
      const socket = io(socketUrl, {
        transports: ['polling', 'websocket'], // Попробуем polling первым
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Parser Monitor connected to socket server');
        setIsConnected(true);
        console.log('Subscribing to parser-monitor room...');
        socket.emit('subscribe-parser-monitor');
        addLog('success', 'Connected to socket server');
        addLog('info', 'Subscribed to parser-monitor room');
      });

      socket.on('disconnect', (reason) => {
        console.log('Parser Monitor disconnected from socket server:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Parser Monitor socket connection error:', error);
        console.error('Socket URL:', socketUrl);
        setIsConnected(false);
        addLog('error', 'Failed to connect to parser monitoring server', error);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Parser Monitor reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        socket.emit('subscribe-parser-monitor');
        addLog('success', 'Reconnected to parser monitoring server');
      });

      socket.on('reconnect_error', (error) => {
        console.error('Parser Monitor reconnection error:', error);
        addLog('error', 'Failed to reconnect to parser monitoring server', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('Parser Monitor reconnection failed');
        setIsConnected(false);
        addLog('error', 'Failed to reconnect to parser monitoring server after multiple attempts');
      });

      // Parser monitoring events
      socket.on('parser-status-update', (data) => {
        console.log('Received parser-status-update:', data);
        addLog('info', `Status update received: ${data.status?.status || 'unknown'}`, data);
        if (data.status) {
          setParseStatus(data.status);
        }
      });

      socket.on('parser-log', (data) => {
        console.log('Received parser-log:', data);
        addLog(data.level, data.message, data.details);
      });

      // Add general event listener to catch all events
      // Note: onAny might not be available in all socket.io versions
      try {
        if (typeof socket.onAny === 'function') {
          socket.onAny((eventName, ...args) => {
            console.log('Received socket event:', eventName, args);
            if (eventName.startsWith('parser-')) {
              addLog('info', `Socket event received: ${eventName}`, args);
            }
          });
        }
      } catch (error) {
        console.log('onAny not available, skipping general event listener');
      }

      socket.on('parser-progress-update', (data) => {
        console.log('Received parser-progress-update:', data);
        addLog('info', `Progress update received`, data);
        if (data.progress) {
          setParseStatus(prev => prev ? { ...prev, ...data.progress } : null);
        }
      });

      socket.on('parser-stats-update', (data) => {
        console.log('Received parser-stats-update:', data);
        addLog('info', `Stats update received`, data);
        if (data.stats) {
          setStats(data.stats);
        }
      });

      // Test message handler
      socket.on('test-response', (data) => {
        console.log('Received test response from socket server:', data);
        addLog('success', `Test response: ${data.message}`);
      });

      // Parser monitor subscription confirmation
      socket.on('parser-monitor-subscribed', (data) => {
        console.log('Parser monitor subscription confirmed:', data);
        addLog('success', `Subscribed to parser monitoring (${data.roomSize} clients)`);
      });
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe-parser-monitor');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session?.user?.role, status]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);


  const addLog = (level: LogEntry['level'], message: string, details?: any) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      details,
    };
    setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
  };

  const startParse = async (textType: string) => {
    try {
      addLog('info', `Starting parse for ${textType.toUpperCase()}...`);
      addLog('info', `Socket connected: ${isConnected}`);
      addLog('info', `AI Processing: ${useAIProcessing}`);
      addLog('info', `User session: ${session?.user ? 'Authenticated' : 'Not authenticated'}`);
      addLog('info', `User role: ${session?.user?.role || 'No role'}`);
      
      // Set initial parse status to enable buttons
      setParseStatus({
        id: `parse_${Date.now()}`,
        status: 'running',
        textType,
        progress: 0,
        currentChapter: 0,
        totalChapters: textType === 'sb' ? 18 : 1,
        currentVerse: 0,
        totalVerses: 0,
        processedVerses: 0,
        errors: 0,
        startTime: new Date(),
        speed: 0,
      });
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('/api/verses/parse/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({ 
            textType,
            processWithAI: useAIProcessing, // Используем состояние переключателя
            maxChapters: textType === 'sb' ? 18 : undefined
          }),
        });

        clearTimeout(timeoutId);
        addLog('info', `API Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json();
          addLog('error', `API Error: ${errorData.error}`, errorData);
          throw new Error(errorData.error || 'Failed to start parsing');
        }

        const result = await response.json();
        addLog('success', `Started parsing ${textType} - Parse ID: ${result.parseId}`);
        toast.success(`Parsing started for ${textType}`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          addLog('error', 'API request timed out after 30 seconds');
          throw new Error('Request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      addLog('error', 'Failed to start parsing', error);
      toast.error('Failed to start parsing');
      // Reset parse status on error
      setParseStatus(prev => prev ? { ...prev, status: 'idle' } : null);
    }
  };

  const pauseParse = async () => {
    try {
      // For now, we'll just show a message since the real parser doesn't support pause/resume
      addLog('info', 'Pause functionality not yet implemented for real parser');
      toast.info('Pause functionality not yet implemented');
    } catch (error) {
      addLog('error', 'Failed to pause parsing', error);
    }
  };

  const resumeParse = async () => {
    try {
      // For now, we'll just show a message since the real parser doesn't support pause/resume
      addLog('info', 'Resume functionality not yet implemented for real parser');
      toast.info('Resume functionality not yet implemented');
    } catch (error) {
      addLog('error', 'Failed to resume parsing', error);
    }
  };

  const stopParse = async () => {
    try {
      const response = await fetch('/api/parser/stop/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop parsing');
      }

      await response.json();
      addLog('warning', 'Parsing stopped by user');
      toast.success('Parsing stopped successfully');
      
      // Update parse status to stopped
      setParseStatus(prev => prev ? { ...prev, status: 'stopped' as const } : null);
      
    } catch (error) {
      addLog('error', 'Failed to stop parsing', error);
      toast.error('Failed to stop parsing');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const getStatusColor = (status: ParseStatus['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Show authentication error if user is not authenticated or not an admin
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in as an administrator to access the parser monitor.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parser Monitor</h1>
          <p className="text-muted-foreground">Real-time monitoring of verse parsing</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Socket Connected" : "Socket Disconnected"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showLogs ? "Hide Logs" : "Show Logs"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parse Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Parse Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parseStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(parseStatus.status)}`} />
                      <span className="font-medium capitalize">{parseStatus.status}</span>
                      <Badge variant="outline">{parseStatus.textType.toUpperCase()}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {parseStatus.speed} verses/min
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{(parseStatus.progress || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={parseStatus.progress || 0} className="w-full" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Chapter</div>
                      <div className="font-medium">{parseStatus.currentChapter}/{parseStatus.totalChapters}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Verse</div>
                      <div className="font-medium">{parseStatus.currentVerse}/{parseStatus.totalVerses}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Processed</div>
                      <div className="font-medium">{parseStatus.processedVerses}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Errors</div>
                      <div className="font-medium text-red-500">{parseStatus.errors}</div>
                    </div>
                  </div>

                  {parseStatus.estimatedTimeRemaining && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>ETA: {formatDuration(parseStatus.estimatedTimeRemaining)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active parsing session
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Parser Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* AI Processing Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ai-processing"
                    checked={useAIProcessing}
                    onChange={(e) => setUseAIProcessing(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="ai-processing" className="text-sm font-medium">
                    Enable AI Processing (requires API key)
                  </label>
                </div>
                
                <div className="flex flex-wrap gap-2">
                <Button onClick={() => startParse('bg')} disabled={parseStatus?.status === 'running'}>
                  <Play className="w-4 h-4 mr-2" />
                  Parse BG
                </Button>
                <Button onClick={() => startParse('sb')} disabled={parseStatus?.status === 'running'}>
                  <Play className="w-4 h-4 mr-2" />
                  Parse SB
                </Button>
                <Button onClick={() => startParse('cc')} disabled={parseStatus?.status === 'running'}>
                  <Play className="w-4 h-4 mr-2" />
                  Parse CC
                </Button>
                <Button onClick={() => startParse('all')} disabled={parseStatus?.status === 'running'}>
                  <Play className="w-4 h-4 mr-2" />
                  Parse All
                </Button>
                
                <Separator orientation="vertical" className="h-8" />
                
                <Button 
                  variant="outline" 
                  onClick={parseStatus?.status === 'paused' ? resumeParse : pauseParse}
                  disabled={!parseStatus || parseStatus.status === 'idle' || parseStatus.status === 'completed' || parseStatus.status === 'stopped'}
                >
                  {parseStatus?.status === 'paused' ? (
                    <Play className="w-4 h-4 mr-2" />
                  ) : (
                    <Pause className="w-4 h-4 mr-2" />
                  )}
                  {parseStatus?.status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={stopParse}
                  disabled={!parseStatus || parseStatus.status === 'idle' || parseStatus.status === 'completed' || parseStatus.status === 'stopped'}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
                
                <Button variant="outline" onClick={clearLogs}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Logs
                </Button>
                
        <Button
          variant="outline"
          onClick={() => {
            if (socketRef.current) {
              socketRef.current.emit('test-message', { message: 'Test from UI' });
              addLog('info', 'Test message sent to socket server');
            }
          }}
        >
          Test Socket
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const response = await fetch('/api/test-auth/', {
                method: 'GET',
                credentials: 'include',
              });
              const result = await response.json();
              addLog('info', 'Test Auth API response', result);
            } catch (error) {
              addLog('error', 'Test Auth API failed', error);
            }
          }}
        >
          Test Auth
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing simple parser API...');
              const response = await fetch('/api/verses/parse-simple/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb',
                  processWithAI: false
                }),
              });
              const result = await response.json();
              addLog('info', 'Simple parser API response', result);
            } catch (error) {
              addLog('error', 'Simple parser API failed', error);
            }
          }}
        >
          Test Simple Parser
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing broadcast API...');
              const response = await fetch('/api/test-broadcast/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              });
              const result = await response.json();
              addLog('info', 'Broadcast API response', result);
            } catch (error) {
              addLog('error', 'Broadcast API failed', error);
            }
          }}
        >
          Test Broadcast
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing parser debug API...');
              const response = await fetch('/api/verses/parse-debug/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb',
                  processWithAI: false
                }),
              });
              const result = await response.json();
              addLog('info', 'Parser debug API response', result);
            } catch (error) {
              addLog('error', 'Parser debug API failed', error);
            }
          }}
        >
          Test Parser Debug
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing parser step by step API...');
              const response = await fetch('/api/verses/parse-step-by-step/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb',
                  processWithAI: false
                }),
              });
              const result = await response.json();
              addLog('info', 'Parser step by step API response', result);
            } catch (error) {
              addLog('error', 'Parser step by step API failed', error);
            }
          }}
        >
          Test Step by Step
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing parser with timeout...');
              const response = await fetch('/api/verses/parse-with-timeout/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb'
                }),
              });
              const result = await response.json();
              addLog('info', 'Parser with timeout response', result);
            } catch (error) {
              addLog('error', 'Parser with timeout failed', error);
            }
          }}
        >
          Test Parser Timeout
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing request API...');
              const response = await fetch('/api/test-request/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  test: 'data'
                }),
              });
              const result = await response.json();
              addLog('info', 'Request API response', result);
            } catch (error) {
              addLog('error', 'Request API failed', error);
            }
          }}
        >
          Test Request
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing single chapter parser...');
              const response = await fetch('/api/verses/parse-single-chapter/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb',
                  chapterNumber: 1
                }),
              });
              const result = await response.json();
              addLog('info', 'Single chapter parser response', result);
            } catch (error) {
              addLog('error', 'Single chapter parser failed', error);
            }
          }}
        >
          Test Chapter 1
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Testing chapter 2 parser...');
              const response = await fetch('/api/verses/parse-single-chapter/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb',
                  chapterNumber: 2
                }),
              });
              const result = await response.json();
              addLog('info', 'Chapter 2 parser response', result);
            } catch (error) {
              addLog('error', 'Chapter 2 parser failed', error);
            }
          }}
        >
          Test Chapter 2
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              addLog('info', 'Debugging HTML for chapter 1...');
              const response = await fetch('/api/verses/debug-html/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  textType: 'sb',
                  chapterNumber: 1
                }),
              });
              const result = await response.json();
              addLog('info', 'HTML debug response', result);
            } catch (error) {
              addLog('error', 'HTML debug failed', error);
            }
          }}
        >
          Debug HTML
        </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Parsed</span>
                  <span className="font-medium">{stats.totalParsed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Errors</span>
                  <span className="font-medium text-red-500">{stats.totalErrors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{(stats.successRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Speed</span>
                  <span className="font-medium">{(stats.averageSpeed || 0).toFixed(1)} v/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Parse</span>
                  <span className="font-medium text-xs">
                    {stats.lastParseTime ? stats.lastParseTime.toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                View Database
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Parser Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logs Console */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Console Logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                </Button>
                <Button variant="outline" size="sm" onClick={clearLogs}>
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 p-2 rounded text-sm">
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                      </div>
                      <div className="mt-1 break-words">{log.message}</div>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            Details
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
