import {useCallback, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {io, Socket} from 'socket.io-client';
import {baseUrl} from '../../baseUrl';

interface UseSocketOptions {
  url?: string;
  options?: Parameters<typeof io>[1]; // Optional Socket.IO client options
}

export const useSocketInstance = () => {
  const {currentUser} = useSelector((state: any) => state?.currentUser);
  const socketRef = useRef<Socket | null>(null); // Persistent reference to socket instance
  const [isConnected, setIsConnected] = useState(false); // Track connection status

  useEffect(() => {
    if (!currentUser) {
      console.warn('User data not available. Skipping socket initialization.');
      return;
    }
    if (!socketRef.current) {
      // Create the Socket.IO instance
      const socket = io(baseUrl + '/liveStream', {
        query: {
          userId: currentUser._id,
          token: currentUser.email,
        },
        transports: ['websocket', 'polling'],
        reconnection: true, // Enables reconnection
        reconnectionAttempts: 5, // Max attempts before giving up
        reconnectionDelay: 2000, // Time (ms) between attempts
        timeout: 10000,
      });
      socketRef.current = socket;

      // Handle connection state
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to socket server:', socket.id);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from socket server');
      });

      // Handle stop-all-streams event
      socket.on('stop-all-streams', (data) => {
        console.log('🚨 STOP ALL STREAMS EVENT RECEIVED:', data);
        // This will be handled by individual streaming components
        // The event data contains: reason, message, limitMinutes, timestamp
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser]);

  // Send events to the server
  const emitEvent = useCallback((eventName: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    } else {
      console.error('Socket not connected. Cannot emit event:', eventName);
    }
  }, []);

  // Listen to events from the server
  const listenEvent = useCallback((eventName: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, callback);
    }
  }, []);

  // Unsubscribe from a specific event
  const offEvent = (eventName: string) => {
    if (socketRef.current) {
      socketRef.current.off(eventName);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    emitEvent,
    listenEvent,
    offEvent,
  };
};
