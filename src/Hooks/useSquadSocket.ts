import {useEffect, useRef, useCallback, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import {baseUrl} from '../../baseUrl';
import type {
  SquadMember,
  SquadRecommendation,
  ConfirmedVenue,
  VenueRecommendation,
} from '../../features/squad/SquadApi';

// ── Event payload types ─────────────────────────────────────────────────────

interface MemberJoinedPayload {
  member: SquadMember;
}

interface MemberCountPayload {
  count: number;
}

interface RecommendationPayload {
  recommendation: SquadRecommendation;
}

interface VetoCastPayload {
  member_name: string;
  reason: string;
}

interface VetoResolvedPayload {
  new_recommendation: SquadRecommendation;
}

interface CreatorFinalSayPayload {
  message: string;
  options: VenueRecommendation[];
}

interface ConfirmedPayload {
  venue: ConfirmedVenue;
}

interface AutoConfirmWarningPayload {
  message: string;
  venue: VenueRecommendation;
  seconds_remaining: number;
}

interface VenueStatusUpdatePayload {
  venue_id: string;
  shift_classification: string;
  alert_message: string;
}

interface CreatorIdlePayload {
  message: string;
  member_count: number;
}

// V2 event payloads
interface DefaultsAppliedPayload {
  members: Array<{
    member_id: string;
    display_name: string;
    is_default_profile: boolean;
    venue_type_tags: string[];
  }>;
}

interface OutcomePromptPayload {
  squad_code: string;
  venue_name: string;
}

// ── Hook config ─────────────────────────────────────────────────────────────

interface UseSquadSocketConfig {
  squadId: string | null;
  guestToken: string | null;
  onMemberJoined?: (payload: MemberJoinedPayload) => void;
  onMemberCount?: (payload: MemberCountPayload) => void;
  onRecommendation?: (payload: RecommendationPayload) => void;
  onVetoCast?: (payload: VetoCastPayload) => void;
  onVetoResolved?: (payload: VetoResolvedPayload) => void;
  onCreatorFinalSay?: (payload: CreatorFinalSayPayload) => void;
  onConfirmed?: (payload: ConfirmedPayload) => void;
  onAutoConfirmWarning?: (payload: AutoConfirmWarningPayload) => void;
  onVenueStatusUpdate?: (payload: VenueStatusUpdatePayload) => void;
  onCreatorIdle?: (payload: CreatorIdlePayload) => void;
  onDefaultsApplied?: (payload: DefaultsAppliedPayload) => void;
  onOutcomePrompt?: (payload: OutcomePromptPayload) => void;
  onExpired?: () => void;
  onCancelled?: () => void;
  onError?: (error: {message: string}) => void;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useSquadSocket(config: UseSquadSocketConfig) {
  const {squadId, guestToken} = config;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs to avoid reconnection on callback change
  const callbacksRef = useRef(config);
  callbacksRef.current = config;

  const connect = useCallback(() => {
    if (!squadId || !guestToken) return;


    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Fix URL construction - ensure proper format
    let socketUrl = baseUrl.replace('/api', '').replace(/\/$/, '');
    console.log('[SquadSocket] Attempting connection to:', socketUrl);
    
    const socket = io(`${socketUrl}/squad`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SquadSocket] Connected');
      setIsConnected(true);

      // Join the squad room
      socket.emit('squad:join_room', {
        squad_id: squadId,
        guest_token: guestToken,
      });
    });

    socket.on('disconnect', reason => {
      console.log('[SquadSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', error => {
      console.error('[SquadSocket] Connection error:', error.message);
      setIsConnected(false);
    });

    // ── Squad events ──────────────────────────────────────────────────

    socket.on('squad:member_joined', (data: MemberJoinedPayload) => {
      callbacksRef.current.onMemberJoined?.(data);
    });

    socket.on('squad:member_count', (data: MemberCountPayload) => {
      callbacksRef.current.onMemberCount?.(data);
    });

    socket.on('squad:recommendation', (data: RecommendationPayload) => {
      callbacksRef.current.onRecommendation?.(data);
    });

    socket.on('squad:veto_cast', (data: VetoCastPayload) => {
      callbacksRef.current.onVetoCast?.(data);
    });

    socket.on('squad:veto_resolved', (data: VetoResolvedPayload) => {
      callbacksRef.current.onVetoResolved?.(data);
    });

    socket.on('squad:creator_final_say', (data: CreatorFinalSayPayload) => {
      callbacksRef.current.onCreatorFinalSay?.(data);
    });

    socket.on('squad:confirmed', (data: ConfirmedPayload) => {
      callbacksRef.current.onConfirmed?.(data);
    });

    socket.on(
      'squad:auto_confirm_warning',
      (data: AutoConfirmWarningPayload) => {
        callbacksRef.current.onAutoConfirmWarning?.(data);
      },
    );

    socket.on(
      'squad:venue_status_update',
      (data: VenueStatusUpdatePayload) => {
        callbacksRef.current.onVenueStatusUpdate?.(data);
      },
    );

    socket.on('squad:creator_idle', (data: CreatorIdlePayload) => {
      callbacksRef.current.onCreatorIdle?.(data);
    });

    // V2 events
    socket.on('squad:defaults_applied', (data: DefaultsAppliedPayload) => {
      callbacksRef.current.onDefaultsApplied?.(data);
    });

    socket.on('squad:outcome_prompt', (data: OutcomePromptPayload) => {
      callbacksRef.current.onOutcomePrompt?.(data);
    });

    socket.on('squad:expired', () => {
      callbacksRef.current.onExpired?.();
    });

    socket.on('squad:cancelled', () => {
      callbacksRef.current.onCancelled?.();
    });

    socket.on('squad:error', (data: {message: string}) => {
      callbacksRef.current.onError?.(data);
    });
  }, [squadId, guestToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const requestUpdate = useCallback(() => {
    if (socketRef.current && squadId) {
      socketRef.current.emit('squad:request_update', {squad_id: squadId});
    }
  }, [squadId]);

  // Auto-connect when squadId and guestToken are available
  useEffect(() => {
    if (squadId && guestToken) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [squadId, guestToken, connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    requestUpdate,
    socket: socketRef.current,
  };
}

export default useSquadSocket;
