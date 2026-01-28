import { useState, useEffect, useRef, useCallback } from 'react';

interface WebRTCConfig {
  onStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: any) => void;
}

export function useWebRTC(roomId: string, role: 'child' | 'parent' | 'viewer', config: WebRTCConfig = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Join the room
        ws.send(JSON.stringify({
          type: 'join_room',
          roomId,
          role,
          userId: 'current-user-id' // Replace with actual user ID
        }));
        
        // Start ping-pong to keep connection alive
        if (pingInterval.current) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (config.onMessage) {
            config.onMessage(message);
          }

          switch (message.type) {
            case 'offer':
              if (role === 'parent' && peerConnectionRef.current) {
                await handleOffer(message.offer, message.roomId);
              }
              break;
              
            case 'answer':
              if (role === 'child' && peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(
                  new RTCSessionDescription(message.answer)
                );
              }
              break;
              
            case 'ice_candidate':
              if (peerConnectionRef.current && message.candidate) {
                try {
                  await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(message.candidate)
                  );
                } catch (err) {
                  console.error('Error adding ICE candidate:', err);
                }
              }
              break;
              
            case 'stream_started':
              setIsStreaming(true);
              break;
              
            case 'stream_stopped':
            case 'stream_ended':
              setIsStreaming(false);
              break;
              
            case 'error':
              console.error('WebSocket error:', message.error);
              setError(new Error(message.error));
              break;
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsStreaming(false);
        
        // Clean up
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError(new Error('WebSocket connection error'));
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err instanceof Error ? err : new Error('Failed to create WebSocket'));
    }
  }, [roomId, role, config.onMessage]);

  // Initialize WebRTC peer connection
  const initPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return;
    }

    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers if needed
          // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;
      setConnectionState('new');

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate,
            roomId
          }));
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        setConnectionState(state);
        if (config.onConnectionStateChange) {
          config.onConnectionStateChange(state);
        }
        
        if (state === 'disconnected' || state === 'failed') {
          setIsStreaming(false);
        } else if (state === 'connected') {
          setIsStreaming(true);
        }
      };

      // Handle track events (for remote streams)
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          if (config.onRemoteStream) {
            config.onRemoteStream(event.streams[0]);
          }
        }
      };

      return pc;
    } catch (err) {
      console.error('Error initializing peer connection:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize WebRTC'));
      return null;
    }
  }, [roomId, config.onConnectionStateChange, config.onRemoteStream]);

  // Start streaming (for child role)
  const startStreaming = useCallback(async (stream: MediaStream) => {
    if (role !== 'child' || !wsRef.current || !peerConnectionRef.current) {
      return;
    }

    try {
      // Add local stream tracks to the peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Create and set local description
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // Send the offer to the server
      wsRef.current.send(JSON.stringify({
        type: 'offer',
        offer: peerConnectionRef.current.localDescription,
        roomId
      }));

      // Notify that streaming has started
      wsRef.current.send(JSON.stringify({
        type: 'start_stream',
        roomId
      }));

      localStreamRef.current = stream;
      if (config.onStream) {
        config.onStream(stream);
      }
    } catch (err) {
      console.error('Error starting stream:', err);
      setError(err instanceof Error ? err : new Error('Failed to start streaming'));
    }
  }, [roomId, role, config.onStream]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (role !== 'child' || !wsRef.current) {
      return;
    }

    // Notify that streaming has stopped
    wsRef.current.send(JSON.stringify({
      type: 'stop_stream',
      roomId
    }));

    // Stop all tracks in the local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close the peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
  }, [roomId, role]);

  // Handle incoming offer (for parent role)
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, roomId: string) => {
    if (role !== 'parent' || !wsRef.current || !peerConnectionRef.current) {
      return;
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create and set local description
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      // Send the answer to the server
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        answer: peerConnectionRef.current.localDescription,
        roomId
      }));
    } catch (err) {
      console.error('Error handling offer:', err);
      setError(err instanceof Error ? err : new Error('Failed to handle offer'));
    }
  }, [role]);

  // Initialize WebSocket and WebRTC on mount
  useEffect(() => {
    initPeerConnection();
    connectWebSocket();

    // Cleanup function
    return () => {
      // Clear timeouts and intervals
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
      
      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Reset state
      setIsConnected(false);
      setIsStreaming(false);
      setError(null);
      setConnectionState('disconnected');
    };
  }, [connectWebSocket, initPeerConnection]);

  return {
    isConnected,
    isStreaming,
    error,
    connectionState,
    startStreaming,
    stopStreaming,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current
  };
}
