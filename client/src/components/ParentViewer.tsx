import { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

interface ParentViewerProps {
  roomId: string;
  onError?: (error: Error) => void;
  onStreamAvailable?: (isAvailable: boolean) => void;
}

export function ParentViewer({ roomId, onError, onStreamAvailable }: ParentViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const {
    isConnected,
    isStreaming,
    error,
    connectionState,
  } = useWebRTC(roomId, 'parent', {
    onRemoteStream: (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsLoading(false);
        setIsRetrying(false);
        if (onStreamAvailable) {
          onStreamAvailable(true);
        }
      }
    },
    onError: (err) => {
      console.error('WebRTC error:', err);
      setStreamError(err.message);
      setIsLoading(false);
      if (onError) {
        onError(err);
      }
      if (onStreamAvailable) {
        onStreamAvailable(false);
      }
    },
    onConnectionStateChange: (state) => {
      console.log('Connection state changed:', state);
      if (state === 'connected') {
        setIsLoading(false);
      } else if (state === 'disconnected' || state === 'failed') {
        if (onStreamAvailable) {
          onStreamAvailable(false);
        }
      }
    },
    onMessage: (message) => {
      if (message.type === 'stream_ended' || message.type === 'stream_stopped') {
        if (onStreamAvailable) {
          onStreamAvailable(false);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }
  });

  const handleRetry = () => {
    setIsRetrying(true);
    setStreamError(null);
    // The WebRTC hook will automatically try to reconnect
    setTimeout(() => {
      setIsRetrying(false);
    }, 5000);
  };

  // Handle error state
  useEffect(() => {
    if (error) {
      setStreamError(error.message);
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-auto aspect-video bg-gray-900"
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-white">
            <div className="text-center p-4">
              {isLoading || isRetrying ? (
                <>
                  <RefreshCw className="mx-auto h-12 w-12 mb-4 text-blue-400 animate-spin" />
                  <p className="text-lg font-medium">
                    {isRetrying ? 'Reconnecting...' : 'Waiting for stream...'}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {isRetrying 
                      ? 'Attempting to reconnect to the stream'
                      : 'The stream will start when the child begins broadcasting'}
                  </p>
                </>
              ) : (
                <>
                  <WifiOff className="mx-auto h-12 w-12 mb-4 text-red-400" />
                  <p className="text-lg font-medium">Stream disconnected</p>
                  <p className="text-sm text-gray-300 mt-1">
                    The stream has ended or the connection was lost
                  </p>
                </>
              )}
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
          {isStreaming && <span className="ml-2 text-green-400">• LIVE</span>}
        </div>
      </div>
      
      {streamError && (
        <div className="w-full max-w-4xl space-y-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{streamError}</AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            size="sm"
            disabled={isRetrying}
            className="w-full"
          >
            {isRetrying ? 'Reconnecting...' : 'Retry Connection'}
          </Button>
        </div>
      )}
      
      {!isConnected && !streamError && (
        <div className="text-center text-sm text-gray-500">
          <p>Connecting to the stream server...</p>
          <p className="text-xs mt-1">Please check your internet connection</p>
        </div>
      )}
    </div>
  );
}
