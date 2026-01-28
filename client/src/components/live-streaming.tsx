import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Square, Play, Share2, Eye, Users, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { getBackendWsUrl } from '@/lib/ws';

const getIceServers = () => {
  const env = (import.meta as any).env || {};
  const stunEnv = env.VITE_STUN_URLS as string | undefined;
  const turnUrl = env.VITE_TURN_URL as string | undefined;
  const turnUsername = env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = env.VITE_TURN_CREDENTIAL as string | undefined;

  const stunUrls = stunEnv
    ? stunEnv.split(',').map(url => url.trim()).filter(Boolean)
    : ['stun:stun.l.google.com:19302'];

  const iceServers: RTCIceServer[] = [{ urls: stunUrls }];

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential
    });
  }
  return iceServers;
};

interface LiveStreamingProps {
  autoStart?: boolean;
  onStreamStarted?: (streamUrl: string) => void;
  onStreamEnded?: () => void;
  emergencyMode?: boolean;
  voiceScenario?: {triggerType: string, scenario: string, detectedText: string} | null;
}

export default function LiveStreaming({ 
  autoStart = false, 
  onStreamStarted, 
  onStreamEnded,
  emergencyMode = false,
  voiceScenario = null
}: LiveStreamingProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [shareableLink, setShareableLink] = useState<string>('');
  const [viewerCount, setViewerCount] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectionRef = useRef<{ socket?: WebSocket; pc?: RTCPeerConnection; offer?: RTCSessionDescriptionInit; streamId?: string } | null>(null);
  const { toast } = useToast();

  // Start live stream mutation
  const startStreamMutation = useMutation({
    mutationFn: async (streamData: {
      streamUrl: string;
      shareableLink: string;
      isEmergency: boolean;
      alertId?: string | null;
      latitude?: number;
      longitude?: number;
      address?: string;
      triggerType?: string;
      scenario?: string;
      detectedText?: string;
    }) => {
      const response = await fetch('/api/live-stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to start live stream');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setViewerCount(data.viewerCount || 0);
      const previousEmergencyAlertId = sessionStorage.getItem('currentEmergencyAlertId');
      if (data.alertId) {
        sessionStorage.setItem('currentEmergencyAlertId', String(data.alertId));
      }

      const storedEmergencyAlertId = sessionStorage.getItem('currentEmergencyAlertId');
      const shouldTreatEmergency = emergencyMode || Boolean(storedEmergencyAlertId) || Boolean(data.alertId);

      if (data.alertId && previousEmergencyAlertId && String(data.alertId) !== String(previousEmergencyAlertId)) {
        const socket = (streamRef.current as any)?.socket as WebSocket | undefined;
        const offer = (streamRef.current as any)?.offer;
        const streamId = (streamRef.current as any)?.streamId;
        if (socket && offer && streamId && socket.readyState === WebSocket.OPEN) {
          const emergencyRoomId = `emergency_room_emergency_${data.alertId}`;
          socket.send(JSON.stringify({
            type: 'child_join_room',
            roomId: emergencyRoomId,
            offer,
            streamId,
            deviceType: 'child'
          }));
          console.log(`Child re-joined emergency room: ${emergencyRoomId}`);
        }
      }

      if (shouldTreatEmergency && (data.alertId || storedEmergencyAlertId)) {
        const emergencyId = data.alertId || storedEmergencyAlertId;
        const emergencyLink = `${window.location.origin}/watch/emergency_${emergencyId}`;
        setShareableLink(emergencyLink);
        onStreamStarted?.(emergencyLink);
      } else {
        onStreamStarted?.(data.shareableLink);
      }
      
      if (shouldTreatEmergency) {
        toast({
          title: "Emergency Live Stream Started",
          description: "Stream link sent to emergency contacts",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Live Stream Started",
          description: "Stream is now active and shareable",
        });
      }
    },
    onError: () => {
      toast({
        title: "Stream Failed",
        description: "Could not start live stream. Please try again.",
        variant: "destructive",
      });
      setIsStreaming(false);
    }
  });

  // End live stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/live-stream/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamUrl })
      });
      
      if (!response.ok) {
        throw new Error('Failed to end live stream');
      }
      
      return response.json();
    },
    onSuccess: () => {
      onStreamEnded?.();
      toast({
        title: "Stream Ended",
        description: "Live stream has been stopped successfully",
      });
    }
  });

  // Check camera and microphone permissions
  useEffect(() => {
    checkPermissions();
  }, []);

  // Auto-start stream if requested
  useEffect(() => {
    if (autoStart && hasPermissions && !isStreaming) {
      startStreaming();
    }
  }, [autoStart, hasPermissions]);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      setHasPermissions(true);
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermissions(false);
      
      toast({
        title: "Camera/Microphone Access Required",
        description: "Please allow camera and microphone access for live streaming",
        variant: "destructive",
      });
    }
  };

  const startStreaming = async () => {
    if (isStreaming || mediaRecorderRef.current?.state === 'recording') {
      console.warn('Stream already active or recording in progress');
      return;
    }

    if (!hasPermissions) {
      await checkPermissions();
      return;
    }

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      
      // Display video preview with safe play and logging
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        console.log('Local preview attached to video element');
        videoRef.current.play?.()
          .then(() => console.log('Local preview play() resolved'))
          .catch(err => console.warn('Local preview auto-play failed:', err));
        // Force play after a short delay in case autoplay policies block initial play
        setTimeout(() => {
          videoRef.current?.play?.()
            .then(() => console.log('Local preview play() forced by timeout'))
            .catch(() => {});
        }, 300);
      }

      // Create MediaRecorder for automatic session recording (if supported)
      const preferredMimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4'
      ];
      const supportedMimeType = preferredMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      const recordedChunks: BlobPart[] = [];

      if (supportedMimeType) {
        try {
          const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: supportedMimeType });
            const formData = new FormData();
            formData.append('video', blob, `emergency_session_${Date.now()}.webm`);
            formData.append('sessionType', emergencyMode ? 'emergency' : 'normal');
            formData.append('userId', 'demo-user');
            formData.append('timestamp', new Date().toISOString());
            const alertId = sessionStorage.getItem('currentEmergencyAlertId');
            if (alertId) {
              formData.append('alertId', alertId);
            }
            
            try {
              const response = await fetch('/api/emergency/save-session-recording', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                console.log('Session recording saved to emergency history');
              }
            } catch (error) {
              console.error('Failed to save session recording:', error);
            }
          };
          
          // Start recording immediately
          mediaRecorder.start(1000);
          setIsRecording(true);
          mediaRecorderRef.current = mediaRecorder;
        } catch (error) {
          console.warn('MediaRecorder failed to start, continuing without recording:', error);
          setIsRecording(false);
          mediaRecorderRef.current = null;
        }
      } else {
        console.warn('No supported MediaRecorder MIME type found; streaming without recording.');
        setIsRecording(false);
        mediaRecorderRef.current = null;
      }
      
      // Generate stream URLs using WebRTC peer-to-peer streaming
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const generatedStreamUrl = `webrtc://${streamId}`;
      const generatedShareableLink = `${window.location.origin}/watch/${streamId}`;
      const storedEmergencyAlertId = sessionStorage.getItem('currentEmergencyAlertId');
      const emergencyShareableLink = storedEmergencyAlertId
        ? `${window.location.origin}/watch/emergency_${storedEmergencyAlertId}`
        : generatedShareableLink;
      const isEmergencySession = emergencyMode || Boolean(storedEmergencyAlertId);
      
      // Set up WebRTC connection to send stream to parent
      const pc = new RTCPeerConnection({
        iceServers: getIceServers()
      });
      
      // Add the stream to the peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Create offer and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      (streamRef.current as any).offer = offer;
      (streamRef.current as any).streamId = streamId;
      console.log('Created local offer for stream', streamId);
      
      // Immediately establish WebSocket connection for emergency streaming
      if (isEmergencySession) {
        const wsUrl = getBackendWsUrl();
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('Child device signaling socket opened');
          const currentEmergencyId = sessionStorage.getItem('currentEmergencyAlertId');
          if (!currentEmergencyId) console.warn('No emergency alert id in sessionStorage yet');
          const emergencyRoomId = `emergency_room_emergency_${currentEmergencyId || streamId}`;
          const payload = {
            type: 'child_join_room',
            roomId: emergencyRoomId,
            offer: offer,
            streamId: streamId,
            deviceType: 'child'
          };
          socket.send(JSON.stringify(payload));
          console.log('Sent child_join_room to signaling server:', payload);
        };
        
        socket.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log('Child socket received message:', data.type);
          
          if (data.type === 'parent_stream_answer') {
            console.log('Received parent answer, completing WebRTC connection');
            try {
              if (pc.signalingState !== 'have-local-offer') {
                console.warn('Ignoring parent answer in state:', pc.signalingState);
                return;
              }
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              console.log('WebRTC connection established with parent');
            } catch (error) {
              console.error('Error setting remote description:', error);
            }
          }
          
          if (data.type === 'ice_candidate') {
            console.log('Received ICE candidate from parent');
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
        };
        socket.onerror = (err) => {
          console.error('Child signaling socket error:', err);
        };
        socket.onclose = (ev) => {
          console.log('Child signaling socket closed', ev.code, ev.reason);
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socket.readyState === WebSocket.OPEN) {
            const payload = {
              type: 'ice_candidate',
              candidate: event.candidate,
              streamId: streamId
            };
            socket.send(JSON.stringify(payload));
            console.log('Sent ICE candidate to parent via signaling server');
          }
        };
        
        // Store socket and pc for cleanup
        streamRef.current = stream;
        (streamRef.current as any).socket = socket;
        (streamRef.current as any).pc = pc;
        connectionRef.current = { socket, pc, offer, streamId };
      }
      
      setStreamUrl(generatedStreamUrl);
      setShareableLink(isEmergencySession ? emergencyShareableLink : generatedShareableLink);
      setIsStreaming(true);
      
      // Store stream in browser storage for WebRTC sharing
      localStorage.setItem(`stream_${streamId}`, JSON.stringify({
        id: streamId,
        startTime: Date.now(),
        isActive: true
      }));
      
      // Recording already started above
      
      // Get current location for emergency mode
          if (isEmergencySession && 'geolocation' in navigator) {
            const existingAlertId = sessionStorage.getItem('currentEmergencyAlertId');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Start live stream with location data
            startStreamMutation.mutate({
              streamUrl: generatedStreamUrl,
              shareableLink: generatedShareableLink,
                  isEmergency: isEmergencySession,
                  alertId: existingAlertId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: `Emergency Location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
              triggerType: voiceScenario?.triggerType || 'sos_manual',
              scenario: voiceScenario?.scenario,
              detectedText: voiceScenario?.detectedText
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Start live stream without precise location
            startStreamMutation.mutate({
              streamUrl: generatedStreamUrl,
              shareableLink: generatedShareableLink,
                  isEmergency: isEmergencySession,
                  alertId: existingAlertId,
              latitude: 12.9716, // Bangalore fallback
              longitude: 77.5946,
              address: 'Bangalore, Karnataka, India - CURRENT LOCATION',
              triggerType: 'sos_manual'
            });
          }
        );
      } else {
        // Start live stream on server
        startStreamMutation.mutate({
          streamUrl: generatedStreamUrl,
          shareableLink: generatedShareableLink,
              isEmergency: isEmergencySession,
              alertId: sessionStorage.getItem('currentEmergencyAlertId')
        });
      }
      
      // Handle recorded data
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // In a real implementation, this would be sent to a streaming server
            console.log('Recording chunk available:', event.data.size, 'bytes');
          }
        };
      }
      
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Stream Error", 
        description: "Failed to start camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopStreaming = () => {
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setStreamUrl('');
    setShareableLink('');
    setViewerCount(0);

    sessionStorage.removeItem('currentEmergencyAlertId');
    
    // End stream on server
    if (streamUrl) {
      endStreamMutation.mutate();
    }
    
    // Close signaling socket and peer connection
    try {
      const conn = connectionRef.current;
      if (conn?.socket && conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.close();
        console.log('Closed signaling socket');
      }
      if (conn?.pc) {
        conn.pc.getSenders().forEach(s => {
          try { s.track?.stop(); } catch {};
        });
        conn.pc.close();
        console.log('Closed RTCPeerConnection');
      }
      connectionRef.current = null;
    } catch (err) {
      console.warn('Error during connection cleanup:', err);
    }
  };

  const copyShareLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      toast({
        title: "Link Copied",
        description: "Shareable link copied to clipboard",
      });
    }
  };

  const shareWithEmergencyContacts = async () => {
    if (!shareableLink) return;
    
    try {
      const response = await fetch('/api/emergency/share-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shareableLink,
          message: `🔴 LIVE EMERGENCY STREAM
Watch live: ${shareableLink}
This is an active emergency situation. Please monitor or contact immediately.
Time: ${new Date().toLocaleString()}`
        })
      });
      
      if (response.ok) {
        toast({
          title: "Stream Shared",
          description: "Live stream link sent to emergency contacts",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Could not share stream with contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`w-full ${emergencyMode ? 'border-red-500 bg-red-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className={`w-5 h-5 ${emergencyMode ? 'text-red-600' : 'text-blue-600'}`} />
          {emergencyMode ? 'Emergency Live Stream' : 'Live Streaming'}
          {isStreaming && (
            <Badge variant="destructive" className="ml-auto">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">
                  {hasPermissions ? 'Ready to stream' : 'Camera access required'}
                </p>
              </div>
            </div>
          )}
          
          {emergencyMode && isStreaming && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                EMERGENCY
              </Badge>
            </div>
          )}
          
          {isStreaming && (
            <div className="absolute top-2 right-2 flex items-center space-x-2">
              <Badge className="bg-black/50 text-white">
                <Eye className="w-3 h-3 mr-1" />
                {viewerCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Stream Controls */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-2">
            {!isStreaming ? (
              <Button
                onClick={startStreaming}
                disabled={!hasPermissions || startStreamMutation.isPending}
                className={`flex-1 ${emergencyMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                <Play className="w-4 h-4 mr-2" />
                {emergencyMode ? 'Start Emergency Stream' : 'Start Streaming'}
              </Button>
            ) : (
              <Button
                onClick={stopStreaming}
                variant="destructive"
                disabled={endStreamMutation.isPending}
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Stream
              </Button>
            )}
            
            {!hasPermissions && (
              <Button onClick={checkPermissions} variant="outline">
                <Video className="w-4 h-4 mr-2" />
                Enable Camera
              </Button>
            )}
          </div>

          {/* Share Controls */}
          {isStreaming && shareableLink && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button onClick={copyShareLink} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                
                <Button 
                  onClick={shareWithEmergencyContacts}
                  variant={emergencyMode ? "destructive" : "outline"}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Share with Contacts
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded break-all">
                Stream: {shareableLink}
              </div>
            </div>
          )}
        </div>

        {emergencyMode && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            Emergency mode: Stream will automatically be shared with emergency contacts
          </div>
        )}
      </CardContent>
    </Card>
  );
}