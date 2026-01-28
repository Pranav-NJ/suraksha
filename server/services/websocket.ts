import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

interface WebSocketClient extends WebSocket {
  id: string;
  role?: 'child' | 'parent' | 'viewer';
  roomId?: string;
  userId?: string;
}

interface StreamingSession {
  childSocket: WebSocketClient;
  parentSockets: Set<WebSocketClient>;
  offer?: any;
  answer?: any;
  iceCandidates: any[];
  roomId: string;
  streamId?: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private activeSessions: Map<string, StreamingSession> = new Map();
  private rooms: Map<string, Set<WebSocketClient>> = new Map();
  private clients: Set<WebSocketClient> = new Set();
  private streamIdToRoomId: Map<string, string> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupEventHandlers();
    console.log('WebSocket server started');
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocketClient) => {
      // Generate a unique ID for this connection
      ws.id = this.generateId();
      this.clients.add(ws);
      console.log(`New WebSocket connection: ${ws.id}`);

      // Handle incoming messages
      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          console.log(`Message from ${ws.id} (${ws.role || 'unknown'}):`, data.type);

          switch (data.type) {
            case 'join_room':
              await this.handleJoinRoom(ws, data);
              break;

            // Legacy support (current app code)
            case 'child_join_room':
              await this.handleChildJoinRoomLegacy(ws, data);
              break;

            case 'parent_join_room':
              await this.handleParentJoinRoomLegacy(ws, data);
              break;

            case 'request_child_stream':
              await this.handleRequestChildStreamLegacy(ws, data);
              break;
              
            case 'offer':
              this.handleOffer(ws, data);
              break;
              
            case 'answer':
              this.handleAnswer(ws, data);
              break;

            case 'parent_stream_answer':
              this.handleParentStreamAnswerLegacy(ws, data);
              break;
              
            case 'ice_candidate':
              this.handleIceCandidate(ws, data);
              break;
              
            case 'start_stream':
              this.handleStartStream(ws, data);
              break;
              
            case 'stop_stream':
              this.handleStopStream(ws, data);
              break;
              
            case 'ping':
              this.send(ws, { type: 'pong', timestamp: Date.now() });
              break;
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Handle connection close
      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${ws.id}`);
        this.handleDisconnect(ws);
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${ws.id}:`, error);
        this.handleDisconnect(ws);
        this.clients.delete(ws);
      });
    });
  }

  private async handleJoinRoom(ws: WebSocketClient, data: any) {
    const { roomId, role, userId } = data;
    
    if (!roomId) {
      this.sendError(ws, 'Missing roomId');
      return;
    }

    // Update client metadata
    ws.role = role || 'viewer';
    ws.roomId = roomId;
    ws.userId = userId;

    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    // Add client to room
    this.rooms.get(roomId)?.add(ws);

    // If this is a child, create or update the streaming session
    if (role === 'child') {
      if (!this.activeSessions.has(roomId)) {
        this.activeSessions.set(roomId, {
          childSocket: ws,
          parentSockets: new Set(),
          iceCandidates: [],
          roomId
        });
      }
      this.send(ws, { type: 'room_joined', roomId, role: 'child' });
      console.log(`Child ${ws.id} joined room ${roomId}`);
      return;
    }

    // If this is a parent/viewer, add to the session if it exists
    const session = this.activeSessions.get(roomId);
    if (session) {
      if (role === 'parent') {
        session.parentSockets.add(ws);
      }
      
      // If there's an offer from the child, send it to the new parent
      if (session.offer) {
        this.send(ws, {
          type: 'offer',
          offer: session.offer,
          roomId
        });

        // Legacy: parent dashboard expects this event
        this.send(ws, {
          type: 'child_stream_offer',
          offer: session.offer,
          roomId,
          streamId: session.streamId
        });
      }
      
      // Send any existing ICE candidates
      session.iceCandidates.forEach(candidate => {
        this.send(ws, {
          type: 'ice_candidate',
          candidate,
          roomId
        });
      });
      
      this.send(ws, { type: 'room_joined', roomId, role: 'parent' });
      console.log(`Parent/Viewer ${ws.id} joined room ${roomId}`);
    } else {
      // Parent can join before child; do not treat as fatal.
      this.send(ws, { type: 'room_joined', roomId, role: ws.role || 'viewer' });
    }
  }

  private ensureRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
  }

  private ensureSession(roomId: string, childSocket?: WebSocketClient) {
    if (!this.activeSessions.has(roomId) && childSocket) {
      this.activeSessions.set(roomId, {
        childSocket,
        parentSockets: new Set(),
        iceCandidates: [],
        roomId
      });
    }
    return this.activeSessions.get(roomId);
  }

  private async handleChildJoinRoomLegacy(ws: WebSocketClient, data: any) {
    const { roomId, offer, streamId } = data;
    if (!roomId) {
      this.sendError(ws, 'Missing roomId');
      return;
    }

    ws.role = 'child';
    ws.roomId = roomId;

    this.ensureRoom(roomId);
    this.rooms.get(roomId)!.add(ws);

    const session = this.ensureSession(roomId, ws);
    if (!session) return;

    session.childSocket = ws;
    session.offer = offer;
    session.streamId = streamId;

    // Legacy clients often send ICE candidates using streamId only.
    // Keep an alias so lookups by streamId also work.
    if (streamId) {
      this.streamIdToRoomId.set(streamId, roomId);
      this.activeSessions.set(streamId, session);
    }

    // Notify any parents currently in the room
    if (offer) {
      this.broadcastToRoom(roomId, {
        type: 'offer',
        offer,
        roomId
      }, ws);

      this.broadcastToRoom(roomId, {
        type: 'child_stream_offer',
        offer,
        roomId,
        streamId
      }, ws);
    }
  }

  private async handleParentJoinRoomLegacy(ws: WebSocketClient, data: any) {
    const { roomId } = data;
    if (!roomId) {
      this.sendError(ws, 'Missing roomId');
      return;
    }

    ws.role = 'parent';
    ws.roomId = roomId;

    this.ensureRoom(roomId);
    this.rooms.get(roomId)!.add(ws);

    const session = this.activeSessions.get(roomId);
    if (session) {
      session.parentSockets.add(ws);
      if (session.offer) {
        this.send(ws, {
          type: 'child_stream_offer',
          offer: session.offer,
          roomId,
          streamId: session.streamId
        });
        this.send(ws, {
          type: 'offer',
          offer: session.offer,
          roomId
        });
      }
    }
  }

  private async handleRequestChildStreamLegacy(ws: WebSocketClient, data: any) {
    // This legacy flow uses streamId as the lookup key.
    const { streamId } = data;
    if (!streamId) {
      this.sendError(ws, 'Missing streamId');
      return;
    }

    ws.role = 'parent';
    ws.roomId = streamId;

    this.ensureRoom(streamId);
    this.rooms.get(streamId)!.add(ws);

    const resolvedRoomId = this.streamIdToRoomId.get(streamId) || streamId;
    const session = this.activeSessions.get(resolvedRoomId) || this.activeSessions.get(streamId);
    if (session) {
      session.parentSockets.add(ws);
      if (session.offer) {
        this.send(ws, {
          type: 'child_stream_offer',
          offer: session.offer,
          streamId
        });
        this.send(ws, {
          type: 'offer',
          offer: session.offer,
          roomId: resolvedRoomId
        });
      }
    }
  }

  private handleParentStreamAnswerLegacy(ws: WebSocketClient, data: any) {
    const requestedId = data.roomId || data.streamId;
    const answer = data.answer;
    if (!requestedId || !answer) {
      this.sendError(ws, 'Invalid parent_stream_answer');
      return;
    }

    const roomId = this.streamIdToRoomId.get(requestedId) || requestedId;
    const session = this.activeSessions.get(roomId) || this.activeSessions.get(requestedId);
    if (!session) {
      this.sendError(ws, 'Invalid session');
      return;
    }

    if (session.childSocket.readyState === WebSocket.OPEN) {
      // Legacy
      this.send(session.childSocket, {
        type: 'parent_stream_answer',
        answer,
        roomId,
        streamId: data.streamId
      });

      // Modern
      this.send(session.childSocket, {
        type: 'answer',
        answer,
        roomId
      });
    }
  }

  private handleOffer(ws: WebSocketClient, data: any) {
    const { roomId, offer } = data;
    const session = this.activeSessions.get(roomId);
    
    if (!session || session.childSocket.id !== ws.id) {
      this.sendError(ws, 'Invalid session or not authorized');
      return;
    }

    // Store the offer
    session.offer = offer;
    
    // Broadcast to all parents
    this.broadcastToRoom(roomId, {
      type: 'offer',
      offer,
      roomId
    }, ws);

    this.broadcastToRoom(roomId, {
      type: 'child_stream_offer',
      offer,
      roomId,
      streamId: session.streamId
    }, ws);
  }

  private handleAnswer(ws: WebSocketClient, data: any) {
    const { roomId, answer } = data;
    const session = this.activeSessions.get(roomId);
    
    if (!session) {
      this.sendError(ws, 'Invalid session');
      return;
    }

    // Forward answer to the child
    if (session.childSocket.readyState === WebSocket.OPEN) {
      this.send(session.childSocket, {
        type: 'answer',
        answer,
        roomId
      });

      // Legacy
      this.send(session.childSocket, {
        type: 'parent_stream_answer',
        answer,
        roomId,
        streamId: session.streamId
      });
    }
  }

  private handleIceCandidate(ws: WebSocketClient, data: any) {
    const requestedId = data.roomId || data.streamId;
    const candidate = data.candidate;
    const roomId = requestedId ? (this.streamIdToRoomId.get(requestedId) || requestedId) : undefined;
    const session = roomId ? (this.activeSessions.get(roomId) || (requestedId ? this.activeSessions.get(requestedId) : undefined)) : undefined;
    
    if (!roomId || !session) {
      this.sendError(ws, 'Invalid session');
      return;
    }

    // Store ICE candidate
    session.iceCandidates.push(candidate);

    // Forward to the other side
    if (ws.role === 'child') {
      // From child to all parents
      this.broadcastToRoom(roomId, {
        type: 'ice_candidate',
        candidate,
        roomId
      }, ws);
    } else {
      // From parent to child
      if (session.childSocket.readyState === WebSocket.OPEN) {
        this.send(session.childSocket, {
          type: 'ice_candidate',
          candidate,
          roomId
        });
      }
    }
  }

  public getWss() {
    return this.wss;
  }

  private handleStartStream(ws: WebSocketClient, data: any) {
    const { roomId } = data;
    const session = this.activeSessions.get(roomId);
    
    if (!session || session.childSocket.id !== ws.id) {
      this.sendError(ws, 'Invalid session or not authorized');
      return;
    }

    // Notify all parents that the stream has started
    this.broadcastToRoom(roomId, {
      type: 'stream_started',
      roomId
    }, ws);
  }

  private handleStopStream(ws: WebSocketClient, data: any) {
    const { roomId } = data;
    const session = this.activeSessions.get(roomId);
    
    if (!session || session.childSocket.id !== ws.id) {
      this.sendError(ws, 'Invalid session or not authorized');
      return;
    }

    // Notify all parents that the stream has stopped
    this.broadcastToRoom(roomId, {
      type: 'stream_stopped',
      roomId
    }, ws);

    // Clean up the session
    this.cleanupSession(roomId);
  }

  private handleDisconnect(ws: WebSocketClient) {
    // Remove from rooms
    if (ws.roomId) {
      const room = this.rooms.get(ws.roomId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          this.rooms.delete(ws.roomId);
        }
      }

      // Handle child disconnection
      const session = this.activeSessions.get(ws.roomId);
      if (session && session.childSocket.id === ws.id) {
        // Notify all parents that the child has disconnected
        this.broadcastToRoom(ws.roomId, {
          type: 'stream_ended',
          roomId: ws.roomId,
          reason: 'child_disconnected'
        }, ws);
        
        // Clean up the session
        this.cleanupSession(ws.roomId);
      } else if (session) {
        // Remove parent from the session
        session.parentSockets.delete(ws);
      }
    }
  }

  private cleanupSession(roomId: string) {
    const session = this.activeSessions.get(roomId);
    if (session) {
      // Close all parent connections
      session.parentSockets.forEach(parent => {
        if (parent.readyState === WebSocket.OPEN) {
          parent.close(1000, 'Session ended');
        }
      });
      
      // Close child connection if still open
      if (session.childSocket.readyState === WebSocket.OPEN) {
        session.childSocket.close(1000, 'Session ended');
      }
      
      // Remove the session
      this.activeSessions.delete(roomId);

      if (session.streamId) {
        this.activeSessions.delete(session.streamId);
        this.streamIdToRoomId.delete(session.streamId);
      }
      console.log(`Cleaned up session for room ${roomId}`);
    }
  }

  private broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocketClient) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    let recipients = 0;

    room.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        recipients++;
      }
    });

    console.log(`Broadcasted ${message.type} to ${recipients} clients in room ${roomId}`);
  }

  private send(ws: WebSocketClient, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocketClient, error: string) {
    this.send(ws, {
      type: 'error',
      error
    });
    console.error(`Error for client ${ws.id}: ${error}`);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Export a singleton instance
export let webSocketService: WebSocketService;

export function initializeWebSocket(server: Server) {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
}
