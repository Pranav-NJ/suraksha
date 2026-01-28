import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { Button } from './ui/button';
import { Video, VideoOff, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ChildStreamProps {
  roomId: string;
  onError?: (error: Error) => void;
}

export function ChildStream({ roomId, onError }: ChildStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  const {
    isConnected,
    isStreaming,
    error,
    connectionState,
    startStreaming,
    stopStreaming,
  } = useWebRTC(roomId, 'child', {
    onStream: (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    },
    onError: (err) => {
      console.error('WebRTC error:', err);
      setStreamError(err.message);
      if (onError) {
        onError(err);
      }
    },
    onConnectionStateChange: (state) => {
      console.log('Connection state changed:', state);
    },
  });

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setStreamError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      });
      
      await startStreaming(stream);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      const error = err instanceof Error ? err : new Error('Failed to access camera');
      setStreamError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError, startStreaming]);

  const stopCamera = useCallback(() => {
    stopStreaming();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stopStreaming]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setStreamError(error.message);
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto aspect-video bg-gray-900"
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-white">
            <div className="text-center p-4">
              <VideoOff className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                {isLoading ? 'Starting camera...' : 'Camera is off'}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                {isLoading ? 'Please allow camera access when prompted' : 'Start streaming to begin'}
              </p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-400" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-400" />
          )}
          <span>{connectionState}</span>
        </div>
      </div>
      
      {streamError && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{streamError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex space-x-4">
        <Button
          onClick={isStreaming ? stopCamera : startCamera}
          disabled={isLoading || !isConnected}
          variant={isStreaming ? "destructive" : "default"}
          className="flex items-center space-x-2"
        >
          {isStreaming ? (
            <>
              <VideoOff className="h-4 w-4" />
              <span>Stop Streaming</span>
            </>
          ) : (
            <>
              <Video className="h-4 w-4" />
              <span>{isLoading ? 'Starting...' : 'Start Streaming'}</span>
            </>
          )}
        </Button>
        
        {!isConnected && (
          <Button variant="outline" disabled>
            <span>Connecting to server...</span>
          </Button>
        )}
      </div>
    </div>
  );
}
