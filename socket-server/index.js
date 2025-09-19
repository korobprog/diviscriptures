const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
require('dotenv').config();

const app = express();
const server = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  credentials: true
}));

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.connect().catch(console.error);

// Store active sessions and participants
const activeSessions = new Map();
const activeParticipants = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle joining a session
  socket.on('join-session', async (data) => {
    try {
      const { sessionId, participantId } = data;
      
      // Join socket room
      socket.join(sessionId);
      
      // Store participant info
      socket.sessionId = sessionId;
      socket.participantId = participantId;
      
      // Add to active participants
      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, new Set());
      }
      activeSessions.get(sessionId).add(participantId);
      activeParticipants.set(participantId, socket.id);
      
      // Store in Redis
      await redisClient.setEx(
        `participants:${sessionId}`,
        3600,
        JSON.stringify(Array.from(activeSessions.get(sessionId)))
      );
      
      // Notify all participants in the session
      const participants = Array.from(activeSessions.get(sessionId));
      io.to(sessionId).emit('session-joined', {
        sessionId,
        participants
      });
      
      // Notify others about new participant
      socket.to(sessionId).emit('participant-joined', {
        sessionId,
        participantId
      });
      
      console.log(`Participant ${participantId} joined session ${sessionId}`);
      
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Handle leaving a session
  socket.on('leave-session', async (data) => {
    try {
      const { sessionId, participantId } = data;
      
      // Leave socket room
      socket.leave(sessionId);
      
      // Remove from active participants
      if (activeSessions.has(sessionId)) {
        activeSessions.get(sessionId).delete(participantId);
        if (activeSessions.get(sessionId).size === 0) {
          activeSessions.delete(sessionId);
        }
      }
      activeParticipants.delete(participantId);
      
      // Update Redis
      if (activeSessions.has(sessionId)) {
        await redisClient.setEx(
          `participants:${sessionId}`,
          3600,
          JSON.stringify(Array.from(activeSessions.get(sessionId)))
        );
      } else {
        await redisClient.del(`participants:${sessionId}`);
      }
      
      // Notify others about participant leaving
      socket.to(sessionId).emit('participant-left', {
        sessionId,
        participantId
      });
      
      console.log(`Participant ${participantId} left session ${sessionId}`);
      
    } catch (error) {
      console.error('Error leaving session:', error);
      socket.emit('error', { message: 'Failed to leave session' });
    }
  });

  // Handle WebRTC offer
  socket.on('webrtc-offer', (data) => {
    try {
      const { sessionId, from, to, data: offerData } = data;
      
      if (to) {
        // Send to specific participant
        const targetSocketId = activeParticipants.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc-offer', {
            ...data,
            timestamp: Date.now()
          });
        }
      } else {
        // Broadcast to all participants in session except sender
        socket.to(sessionId).emit('webrtc-offer', {
          ...data,
          timestamp: Date.now()
        });
      }
      
      console.log(`WebRTC offer from ${from} in session ${sessionId}`);
      
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
      socket.emit('error', { message: 'Failed to handle WebRTC offer' });
    }
  });

  // Handle WebRTC answer
  socket.on('webrtc-answer', (data) => {
    try {
      const { sessionId, from, to, data: answerData } = data;
      
      if (to) {
        // Send to specific participant
        const targetSocketId = activeParticipants.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc-answer', {
            ...data,
            timestamp: Date.now()
          });
        }
      } else {
        // Broadcast to all participants in session except sender
        socket.to(sessionId).emit('webrtc-answer', {
          ...data,
          timestamp: Date.now()
        });
      }
      
      console.log(`WebRTC answer from ${from} in session ${sessionId}`);
      
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
      socket.emit('error', { message: 'Failed to handle WebRTC answer' });
    }
  });

  // Handle ICE candidate
  socket.on('webrtc-ice-candidate', (data) => {
    try {
      const { sessionId, from, to, data: candidateData } = data;
      
      if (to) {
        // Send to specific participant
        const targetSocketId = activeParticipants.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc-ice-candidate', {
            ...data,
            timestamp: Date.now()
          });
        }
      } else {
        // Broadcast to all participants in session except sender
        socket.to(sessionId).emit('webrtc-ice-candidate', {
          ...data,
          timestamp: Date.now()
        });
      }
      
      console.log(`ICE candidate from ${from} in session ${sessionId}`);
      
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      socket.emit('error', { message: 'Failed to handle ICE candidate' });
    }
  });

  // Handle verse change
  socket.on('verse-changed', (data) => {
    try {
      const { sessionId, verse, currentReader } = data;
      
      // Broadcast to all participants in session
      io.to(sessionId).emit('verse-changed', {
        sessionId,
        verse,
        currentReader,
        timestamp: Date.now()
      });
      
      console.log(`Verse changed in session ${sessionId}, reader: ${currentReader}`);
      
    } catch (error) {
      console.error('Error handling verse change:', error);
      socket.emit('error', { message: 'Failed to handle verse change' });
    }
  });

  // Handle reading queue update
  socket.on('reading-queue-update', (data) => {
    try {
      const { sessionId, queue } = data;
      
      // Broadcast to all participants in session
      io.to(sessionId).emit('reading-queue-update', {
        sessionId,
        queue,
        timestamp: Date.now()
      });
      
      console.log(`Reading queue updated in session ${sessionId}`);
      
    } catch (error) {
      console.error('Error handling reading queue update:', error);
      socket.emit('error', { message: 'Failed to handle reading queue update' });
    }
  });

  // Handle session timer start
  socket.on('start-session-timer', (data) => {
    try {
      const { sessionId, duration } = data;
      
      // Store timer state in Redis
      const timerData = {
        sessionId,
        duration,
        timeRemaining: duration,
        isActive: true,
        isPaused: false,
        startTime: Date.now()
      };
      
      redisClient.setEx(
        `timer:${sessionId}`,
        3600,
        JSON.stringify(timerData)
      );
      
      // Broadcast to all participants in session
      io.to(sessionId).emit('session-timer-update', {
        sessionId,
        timeRemaining: duration,
        isActive: true,
        isPaused: false,
        timestamp: Date.now()
      });
      
      console.log(`Session timer started in session ${sessionId} for ${duration}s`);
      
    } catch (error) {
      console.error('Error handling session timer start:', error);
      socket.emit('error', { message: 'Failed to start session timer' });
    }
  });

  // Handle session timer pause
  socket.on('pause-session-timer', async (data) => {
    try {
      const { sessionId } = data;
      
      // Get current timer state from Redis
      const timerDataStr = await redisClient.get(`timer:${sessionId}`);
      if (timerDataStr) {
        const timerData = JSON.parse(timerDataStr);
        timerData.isPaused = true;
        timerData.pauseTime = Date.now();
        
        // Update Redis
        redisClient.setEx(
          `timer:${sessionId}`,
          3600,
          JSON.stringify(timerData)
        );
        
        // Broadcast to all participants in session
        io.to(sessionId).emit('session-timer-update', {
          sessionId,
          timeRemaining: timerData.timeRemaining,
          isActive: timerData.isActive,
          isPaused: true,
          timestamp: Date.now()
        });
        
        console.log(`Session timer paused in session ${sessionId}`);
      }
      
    } catch (error) {
      console.error('Error handling session timer pause:', error);
      socket.emit('error', { message: 'Failed to pause session timer' });
    }
  });

  // Handle session timer resume
  socket.on('resume-session-timer', async (data) => {
    try {
      const { sessionId } = data;
      
      // Get current timer state from Redis
      const timerDataStr = await redisClient.get(`timer:${sessionId}`);
      if (timerDataStr) {
        const timerData = JSON.parse(timerDataStr);
        
        // Calculate pause duration and adjust start time
        if (timerData.pauseTime) {
          const pauseDuration = Date.now() - timerData.pauseTime;
          timerData.startTime += pauseDuration;
          delete timerData.pauseTime;
        }
        
        timerData.isPaused = false;
        
        // Update Redis
        redisClient.setEx(
          `timer:${sessionId}`,
          3600,
          JSON.stringify(timerData)
        );
        
        // Broadcast to all participants in session
        io.to(sessionId).emit('session-timer-update', {
          sessionId,
          timeRemaining: timerData.timeRemaining,
          isActive: timerData.isActive,
          isPaused: false,
          timestamp: Date.now()
        });
        
        console.log(`Session timer resumed in session ${sessionId}`);
      }
      
    } catch (error) {
      console.error('Error handling session timer resume:', error);
      socket.emit('error', { message: 'Failed to resume session timer' });
    }
  });

  // Handle session timer update
  socket.on('session-timer-update', (data) => {
    try {
      const { sessionId, timeLeft } = data;
      
      // Broadcast to all participants in session
      io.to(sessionId).emit('session-timer-update', {
        sessionId,
        timeLeft,
        timestamp: Date.now()
      });
      
      console.log(`Session timer updated in session ${sessionId}: ${timeLeft}s left`);
      
    } catch (error) {
      console.error('Error handling session timer update:', error);
      socket.emit('error', { message: 'Failed to handle session timer update' });
    }
  });

  // Handle session end
  socket.on('session-ended', (data) => {
    try {
      const { sessionId } = data;
      
      // Broadcast to all participants in session
      io.to(sessionId).emit('session-ended', {
        sessionId,
        timestamp: Date.now()
      });
      
      // Clean up session data
      activeSessions.delete(sessionId);
      redisClient.del(`participants:${sessionId}`);
      
      console.log(`Session ${sessionId} ended`);
      
    } catch (error) {
      console.error('Error handling session end:', error);
      socket.emit('error', { message: 'Failed to handle session end' });
    }
  });

  // Handle parser monitoring subscription
  socket.on('subscribe-parser-monitor', (data) => {
    try {
      // Join parser monitoring room
      socket.join('parser-monitor');
      console.log(`Client ${socket.id} subscribed to parser monitoring`);
      console.log(`Total clients in parser-monitor room: ${io.sockets.adapter.rooms.get('parser-monitor')?.size || 0}`);
      
      // Send confirmation to client
      socket.emit('parser-monitor-subscribed', {
        message: 'Successfully subscribed to parser monitoring',
        roomSize: io.sockets.adapter.rooms.get('parser-monitor')?.size || 0
      });
      
    } catch (error) {
      console.error('Error subscribing to parser monitor:', error);
      socket.emit('error', { message: 'Failed to subscribe to parser monitor' });
    }
  });

  // Handle parser monitoring unsubscription
  socket.on('unsubscribe-parser-monitor', (data) => {
    try {
      // Leave parser monitoring room
      socket.leave('parser-monitor');
      console.log(`Client ${socket.id} unsubscribed from parser monitoring`);
      
    } catch (error) {
      console.error('Error unsubscribing from parser monitor:', error);
      socket.emit('error', { message: 'Failed to unsubscribe from parser monitor' });
    }
  });

  // Handle test message
  socket.on('test-message', (data) => {
    console.log('Received test message from client:', data);
    // Broadcast test message back to parser-monitor room
    io.to('parser-monitor').emit('test-response', {
      message: 'Test response from socket server',
      originalMessage: data.message,
      timestamp: Date.now()
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      if (socket.sessionId && socket.participantId) {
        const { sessionId, participantId } = socket;
        
        // Remove from active participants
        if (activeSessions.has(sessionId)) {
          activeSessions.get(sessionId).delete(participantId);
          if (activeSessions.get(sessionId).size === 0) {
            activeSessions.delete(sessionId);
          }
        }
        activeParticipants.delete(participantId);
        
        // Update Redis
        if (activeSessions.has(sessionId)) {
          await redisClient.setEx(
            `participants:${sessionId}`,
            3600,
            JSON.stringify(Array.from(activeSessions.get(sessionId)))
          );
        } else {
          await redisClient.del(`participants:${sessionId}`);
        }
        
        // Notify others about participant leaving
        socket.to(sessionId).emit('participant-left', {
          sessionId,
          participantId
        });
        
        console.log(`Participant ${participantId} disconnected from session ${sessionId}`);
      }
      
      console.log(`Client disconnected: ${socket.id}`);
      
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
    activeParticipants: activeParticipants.size
  });
});

// Parser monitoring functions
const ParserMonitor = {
  broadcastStatus: (status) => {
    const roomSize = io.sockets.adapter.rooms.get('parser-monitor')?.size || 0;
    console.log(`Broadcasting parser status to ${roomSize} clients in parser-monitor room`);
    io.to('parser-monitor').emit('parser-status-update', {
      type: 'parse_status',
      status,
      timestamp: Date.now()
    });
    console.log('Parser status broadcasted:', status);
  },

  broadcastLog: (level, message, details) => {
    const roomSize = io.sockets.adapter.rooms.get('parser-monitor')?.size || 0;
    console.log(`Broadcasting parser log to ${roomSize} clients in parser-monitor room`);
    io.to('parser-monitor').emit('parser-log', {
      type: 'log',
      level,
      message,
      details,
      timestamp: Date.now()
    });
    console.log(`Parser log broadcasted [${level}]:`, message);
  },

  broadcastProgress: (progress) => {
    io.to('parser-monitor').emit('parser-progress-update', {
      type: 'progress',
      progress,
      timestamp: Date.now()
    });
    console.log('Parser progress broadcasted:', progress);
  },

  broadcastStats: (stats) => {
    io.to('parser-monitor').emit('parser-stats-update', {
      type: 'stats',
      stats,
      timestamp: Date.now()
    });
    console.log('Parser stats broadcasted:', stats);
  },

  broadcastError: (error) => {
    io.to('parser-monitor').emit('parser-log', {
      type: 'log',
      level: 'error',
      message: error.message || 'Unknown error',
      details: error,
      timestamp: Date.now()
    });
    console.log('Parser error broadcasted:', error);
  }
};

// Timer management
const TimerManager = {
  // Update all active timers every second
  updateTimers: async () => {
    try {
      // Get all timer keys from Redis
      const timerKeys = await redisClient.keys('timer:*');
      
      for (const key of timerKeys) {
        const timerDataStr = await redisClient.get(key);
        if (timerDataStr) {
          const timerData = JSON.parse(timerDataStr);
          
          // Only update if timer is active and not paused
          if (timerData.isActive && !timerData.isPaused) {
            const now = Date.now();
            const elapsed = Math.floor((now - timerData.startTime) / 1000);
            const newTimeRemaining = Math.max(0, timerData.duration - elapsed);
            
            // Update timer data
            timerData.timeRemaining = newTimeRemaining;
            
            // If timer reached zero, mark as inactive
            if (newTimeRemaining <= 0) {
              timerData.isActive = false;
              console.log(`Timer for session ${timerData.sessionId} completed`);
            }
            
            // Update Redis
            redisClient.setEx(key, 3600, JSON.stringify(timerData));
            
            // Broadcast update to session participants
            io.to(timerData.sessionId).emit('session-timer-update', {
              sessionId: timerData.sessionId,
              timeRemaining: newTimeRemaining,
              isActive: timerData.isActive,
              isPaused: timerData.isPaused,
              timestamp: now
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating timers:', error);
    }
  }
};

// Start timer update interval (every 5 seconds to reduce video jumping)
setInterval(TimerManager.updateTimers, 5000);

// Export for use in other modules
module.exports = { ParserMonitor, TimerManager };

// Start server
const PORT = process.env.SOCKET_PORT || 3002;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    redisClient.quit();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    redisClient.quit();
    process.exit(0);
  });
});
