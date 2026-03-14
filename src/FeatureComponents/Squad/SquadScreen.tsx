import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useRoute} from '@react-navigation/native';
import {GlobalColors} from '../../styles/GlobalColors';
import {SquadIcon, ShareIcon} from '../../UIComponents/Icons';
import useGetLocation from '../../CustomHooks/useGetLocation';
import {
  useCreateSquadMutation,
  useGetSquadQuery,
} from '../../../features/squad/SquadApi';
import SquadFormingView from './SquadFormingView';
import SquadRecommendationView from './SquadRecommendationView';
import SquadConfirmedView from './SquadConfirmedView';
import SquadOutcomeScreen from './SquadOutcomeScreen';
import useSquadSocket from '../../Hooks/useSquadSocket';
import {useAnalytics} from '../../Hooks/useAnalytics';
import {AnalyticsEventType} from '../../types/AnalyticsEnums';
import type {
  SquadMember,
  SquadRecommendation,
  ConfirmedVenue,
  VenueRecommendation,
} from '../../../features/squad/SquadApi';

const {width} = Dimensions.get('window');
const colors = GlobalColors.SquadMode;

const SquadScreen: React.FC = () => {
  const currentUser = useSelector((state: any) => state.currentUser);
  const {coordinates} = useGetLocation();
  const {trackEvent} = useAnalytics({screenName: 'SquadScreen'});
  const route = useRoute();
  const routeParams = (route.params as any) || {};

  // Local state
  const [activeSquadCode, setActiveSquadCode] = useState<string | null>(null);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(true);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [currentRecommendation, setCurrentRecommendation] =
    useState<SquadRecommendation | null>(null);
  const [confirmedVenue, setConfirmedVenue] = useState<ConfirmedVenue | null>(
    null,
  );
  const [squadStatus, setSquadStatus] = useState<string>('none');
  const [autoConfirmWarning, setAutoConfirmWarning] = useState<string | null>(
    null,
  );
  const [creatorFinalSayOptions, setCreatorFinalSayOptions] = useState<
    VenueRecommendation[] | null
  >(null);
  const [venueAlert, setVenueAlert] = useState<string | null>(null);
  const [webJoinUrl, setWebJoinUrl] = useState<string | null>(null);
  // V2: Outcome feedback
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeVenueName, setOutcomeVenueName] = useState<string>('');

  // RTK Query
  const [createSquad, {isLoading: isCreating}] = useCreateSquadMutation();

  const {
    data: squadData,
    refetch: refetchSquad,
  } = useGetSquadQuery(activeSquadCode!, {
    skip: !activeSquadCode,
    pollingInterval: 0, // We use WebSocket, not polling
  });

  // Initialize state from join flow navigation params
  useEffect(() => {
    if (routeParams.joined_squad_code && routeParams.joined_guest_token && routeParams.joined_squad_id) {
      setActiveSquadCode(routeParams.joined_squad_code);
      setActiveSquadId(routeParams.joined_squad_id);
      setGuestToken(routeParams.joined_guest_token);
      setIsCreator(false);
      setSquadStatus('forming');
    }
  }, [routeParams.joined_squad_code, routeParams.joined_guest_token, routeParams.joined_squad_id]);

  // Sync RTK Query data to local state
  useEffect(() => {
    if (squadData) {
      setMembers(squadData.members);
      setSquadStatus(squadData.status);
      setConfirmedVenue(squadData.confirmed_venue);
      if (squadData.current_recommendation) {
        setCurrentRecommendation(squadData.current_recommendation);
      }
    }
  }, [squadData]);

  // ── WebSocket ───────────────────────────────────────────────────────
  const {isConnected} = useSquadSocket({
    squadId: activeSquadId || squadData?.squad_id || null,
    guestToken,
    onMemberJoined: ({member}) => {
      setMembers(prev => {
        if (prev.find(m => m.member_id === member.member_id)) return prev;
        return [...prev, member];
      });
    },
    onMemberCount: ({count}) => {
      // Member count is already tracked via member list
    },
    onRecommendation: ({recommendation}) => {
      setCurrentRecommendation(recommendation);
      setSquadStatus('active');
      setCreatorFinalSayOptions(null);
      trackEvent(AnalyticsEventType.SQUAD_RECOMMENDATION_GENERATED, {
        squadCode: activeSquadCode,
        round: recommendation?.round,
        venueName: recommendation?.primary?.venue_name,
      }, 'squad');
    },
    onVetoCast: ({member_name, reason}) => {
      // Show brief toast/feedback
      Alert.alert('Veto', `${member_name} vetoed — finding a new spot...`);
    },
    onVetoResolved: ({new_recommendation}) => {
      setCurrentRecommendation(new_recommendation);
      setCreatorFinalSayOptions(null);
      setAutoConfirmWarning(null);
    },
    onCreatorFinalSay: ({message, options}) => {
      setCreatorFinalSayOptions(options);
    },
    onConfirmed: ({venue}) => {
      setConfirmedVenue(venue);
      setSquadStatus('confirmed');
      setAutoConfirmWarning(null);
      setCreatorFinalSayOptions(null);
      trackEvent(AnalyticsEventType.SQUAD_RECOMMENDATION_CONFIRMED, {
        squadCode: activeSquadCode,
        venueName: venue?.venue_name,
        venueId: venue?.venue_id,
      }, 'squad');
    },
    onAutoConfirmWarning: ({message}) => {
      setAutoConfirmWarning(message);
    },
    onVenueStatusUpdate: ({alert_message}) => {
      setVenueAlert(alert_message);
      setTimeout(() => setVenueAlert(null), 10000);
    },
    onDefaultsApplied: ({members}) => {
      // Update member list with new default profile tags
      setMembers(prev =>
        prev.map(m => {
          const updated = members.find(u => u.member_id === m.member_id);
          if (updated) {
            return {...m, venue_type_tags: updated.venue_type_tags, is_default_profile: updated.is_default_profile};
          }
          return m;
        }),
      );
    },
    onOutcomePrompt: ({venue_name}) => {
      setOutcomeVenueName(venue_name);
      setShowOutcome(true);
    },
    onExpired: () => {
      setSquadStatus('expired');
      Alert.alert('Squad Expired', 'This squad session has ended.');
      trackEvent(AnalyticsEventType.SQUAD_EXPIRED, {
        squadCode: activeSquadCode,
      }, 'squad');
    },
    onCancelled: () => {
      setSquadStatus('cancelled');
      Alert.alert('Squad Cancelled', 'The squad creator cancelled this session.');
      trackEvent(AnalyticsEventType.SQUAD_CANCELLED, {
        squadCode: activeSquadCode,
      }, 'squad');
    },
    onError: ({message}) => {
      console.warn('[SquadScreen] Socket error:', message);
    },
  });

  // ── Create Squad ────────────────────────────────────────────────────
  const handleCreateSquad = useCallback(async () => {
    if (!coordinates || coordinates?.length == 0) {
      Alert.alert(
        'Location Required',
        `Enable location access to create a squad.${Array.isArray(coordinates)}`,
      );
      return;
    }

    try {
      const result = await createSquad({
        area: {
          lat: coordinates[1],
          lng: coordinates[0],
          radius_km: 2.0,
        },
      }).unwrap();
console.log({result});

      setActiveSquadCode(result.squad_code);
      setActiveSquadId(result.squad_id);
      setWebJoinUrl(result.web_join_url || result.invite_link || null);
      setGuestToken(result.guest_token);
      setSquadStatus('forming');

      trackEvent(AnalyticsEventType.SQUAD_CREATED, {
        squadCode: result.squad_code,
        squadId: result.squad_id,
      }, 'squad');

      // Store the guest token from the first member (creator)
      // We'll get it from the squad state after refetch
    } catch (err: any) {
      if (err?.data?.squad_code) {
        // User already has an active squad
        setActiveSquadCode(err.data.squad_code);
        setSquadStatus('forming');
      } else {
        Alert.alert('Error', err?.data?.error || 'Failed to create squad');
      }
    }
  }, [coordinates, createSquad]);

  // ── Reset State ─────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setActiveSquadCode(null);
    setActiveSquadId(null);
    setGuestToken(null);
    setIsCreator(true);
    setMembers([]);
    setCurrentRecommendation(null);
    setConfirmedVenue(null);
    setSquadStatus('none');
    setAutoConfirmWarning(null);
    setCreatorFinalSayOptions(null);
    setVenueAlert(null);
  }, []);

  // ── Render based on squad status ────────────────────────────────────

  // V2: Outcome feedback overlay
  if (showOutcome && activeSquadCode) {
    return (
      <SquadOutcomeScreen
        squadCode={activeSquadCode}
        venueName={outcomeVenueName}
        onDismiss={() => {
          setShowOutcome(false);
          handleReset();
        }}
      />
    );
  }

  // Empty state — no active squad
  if (squadStatus === 'none' || squadStatus === 'expired' || squadStatus === 'cancelled') {
    return (
      <View style={styles.container}>
        <SquadEmptyState
          onCreateSquad={handleCreateSquad}
          isCreating={isCreating}
          wasExpired={squadStatus === 'expired'}
          wasCancelled={squadStatus === 'cancelled'}
        />
      </View>
    );
  }

  // Forming state — waiting for members
  if (squadStatus === 'forming') {
    return (
      <View style={styles.container}>
        <SquadFormingView
          squadCode={activeSquadCode!}
          squadData={squadData}
          members={members}
          isConnected={isConnected}
          isCreator={isCreator}
          webJoinUrl={webJoinUrl}
          onReset={handleReset}
        />
      </View>
    );
  }

  // Active state — recommendation shown
  if (squadStatus === 'active' && currentRecommendation) {
    return (
      <View style={styles.container}>
        <SquadRecommendationView
          squadCode={activeSquadCode!}
          recommendation={currentRecommendation}
          members={members}
          isCreator={isCreator}
          autoConfirmWarning={autoConfirmWarning}
          creatorFinalSayOptions={creatorFinalSayOptions}
        />
      </View>
    );
  }

  // Confirmed state
  if (squadStatus === 'confirmed' && confirmedVenue) {
    return (
      <View style={styles.container}>
        <SquadConfirmedView
          venue={confirmedVenue}
          members={members}
          venueAlert={venueAlert}
        />
      </View>
    );
  }

  // Loading / transitional
  return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading squad...</Text>
    </View>
  );
};

// ── Empty State Component ───────────────────────────────────────────────────

interface EmptyStateProps {
  onCreateSquad: () => void;
  isCreating: boolean;
  wasExpired: boolean;
  wasCancelled: boolean;
}

const SquadEmptyState: React.FC<EmptyStateProps> = ({
  onCreateSquad,
  isCreating,
  wasExpired,
  wasCancelled,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.emptyContainer}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.emptyHeader}>
        <View style={styles.iconCircle}>
          <SquadIcon size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Squad Mode</Text>
        <Text style={styles.emptySubtitle}>
          Date night or group outing — one confident recommendation for
          everyone
        </Text>
      </View>

      {/* Status message if returning from expired/cancelled */}
      {wasExpired && (
        <View style={[styles.statusBanner, {backgroundColor: colors.goldMuted}]}>
          <Text style={styles.statusBannerText}>
            Your last squad has ended. Start a fresh one for tonight!
          </Text>
        </View>
      )}
      {wasCancelled && (
        <View
          style={[styles.statusBanner, {backgroundColor: colors.accentMuted}]}>
          <Text style={styles.statusBannerText}>
            Squad was cancelled. Ready for a new one?
          </Text>
        </View>
      )}

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <StepItem
          number="1"
          title="Create & invite"
          description="Start a squad and share the link — no app required for friends"
        />
        <StepItem
          number="2"
          title="Everyone picks their vibe"
          description="Each person selects venue types they're into tonight"
        />
        <StepItem
          number="3"
          title="Get your recommendation"
          description="We find the one spot that works for everyone"
        />
        <StepItem
          number="4"
          title="Veto or confirm"
          description="Not feeling it? One tap veto gets you a new suggestion"
        />
      </View>

      {/* Create button */}
      <TouchableOpacity
        style={[styles.createButton, isCreating && styles.createButtonDisabled]}
        onPress={onCreateSquad}
        disabled={isCreating}
        activeOpacity={0.8}>
        {isCreating ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.createButtonText}>Start a Squad</Text>
        )}
      </TouchableOpacity>

      {/* Zero friction tagline */}
      <Text style={styles.tagline}>
        Free forever. No account needed for your friends.
      </Text>
    </ScrollView>
  );
};

// ── Step Item ───────────────────────────────────────────────────────────────

const StepItem: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({number, title, description}) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  // Empty state
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  statusBanner: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  statusBannerText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  // How it works
  howItWorks: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  // Create button
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SquadScreen;
