import {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {io, Socket} from 'socket.io-client';
import {baseUrl} from '../../baseUrl';

interface UseSocketOptions {
  url?: string;
  options?: Parameters<typeof io>[1]; // Optional Socket.IO client options
}

export const useSocketInstance = () => {
  const {
    currentUser 
  } = useSelector(state => state?.currentUser);
  const socketRef = useRef<Socket | null>(null); // Persistent reference to socket instance
  const [isConnected, setIsConnected] = useState(false); // Track connection status


  useEffect(() => {
    if (!currentUser) {
      console.warn('User data not available. Skipping socket initialization.');
      return;
    }
    if (!isConnected) {
      // Create the Socket.IO instance
      const socket = io(baseUrl + '/liveStream', {
        query: {
          userId: currentUser._id,
          token: currentUser.email,
        },
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
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser]);

  console.log("from costum hook")
  // Send events to the server
  const emitEvent = (eventName: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    } else {
      console.error('Socket not connected. Cannot emit event:', eventName);
    }
  };

  // Listen to events from the server
  const listenEvent = (eventName: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, callback);
    }
  };

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
