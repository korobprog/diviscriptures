import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

redisClient.on('end', () => {
  console.log('Redis Client Disconnected');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

// Initialize connection
connectRedis();

// WebRTC signaling data storage
export const signalingStore = {
  // Store signaling data for a session
  async setSignalingData(sessionId: string, data: any) {
    try {
      await redisClient.setEx(
        `signaling:${sessionId}`,
        3600, // 1 hour TTL
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error storing signaling data:', error);
    }
  },

  // Get signaling data for a session
  async getSignalingData(sessionId: string) {
    try {
      const data = await redisClient.get(`signaling:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting signaling data:', error);
      return null;
    }
  },

  // Delete signaling data
  async deleteSignalingData(sessionId: string) {
    try {
      await redisClient.del(`signaling:${sessionId}`);
    } catch (error) {
      console.error('Error deleting signaling data:', error);
    }
  },

  // Store active participants in a session
  async setActiveParticipants(sessionId: string, participants: string[]) {
    try {
      await redisClient.setEx(
        `participants:${sessionId}`,
        3600, // 1 hour TTL
        JSON.stringify(participants)
      );
    } catch (error) {
      console.error('Error storing participants:', error);
    }
  },

  // Get active participants
  async getActiveParticipants(sessionId: string) {
    try {
      const data = await redisClient.get(`participants:${sessionId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting participants:', error);
      return [];
    }
  },

  // Add participant to session
  async addParticipant(sessionId: string, participantId: string) {
    try {
      const participants = await this.getActiveParticipants(sessionId);
      if (!participants.includes(participantId)) {
        participants.push(participantId);
        await this.setActiveParticipants(sessionId, participants);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  },

  // Remove participant from session
  async removeParticipant(sessionId: string, participantId: string) {
    try {
      const participants = await this.getActiveParticipants(sessionId);
      const filtered = participants.filter(id => id !== participantId);
      await this.setActiveParticipants(sessionId, filtered);
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  },

  // Store session timer
  async setSessionTimer(sessionId: string, duration: number) {
    try {
      await redisClient.setEx(
        `timer:${sessionId}`,
        duration,
        JSON.stringify({ startTime: Date.now(), duration })
      );
    } catch (error) {
      console.error('Error setting session timer:', error);
    }
  },

  // Get session timer
  async getSessionTimer(sessionId: string) {
    try {
      const data = await redisClient.get(`timer:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting session timer:', error);
      return null;
    }
  },

  // Check if session timer is active
  async isSessionActive(sessionId: string) {
    try {
      const exists = await redisClient.exists(`timer:${sessionId}`);
      return exists === 1;
    } catch (error) {
      console.error('Error checking session status:', error);
      return false;
    }
  }
};

export default redisClient;
