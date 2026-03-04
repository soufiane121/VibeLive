import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  useGetHeatmapQuery,
  useCastVoteMutation,
  VenueData,
} from '../../../features/voting/VotingApi';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface VenueHeatmapOverlayProps {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  visible?: boolean;
}

const VenueHeatmapOverlay: React.FC<VenueHeatmapOverlayProps> = ({
  latitude,
  longitude,
  radiusKm = 2,
  visible = true,
}) => {
  const navigation = useNavigation<any>();
  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
  const [castVote, {isLoading: isVoting}] = useCastVoteMutation();
  const slideAnim = useState(new Animated.Value(0))[0];

  const {data, refetch} = useGetHeatmapQuery(
    {latitude, longitude, radius: radiusKm},
    {
      skip: !latitude || !longitude || !visible,
      pollingInterval: 60000,
    },
  );

  const sortedVenues = useMemo(() => {
    if (!data?.heatmap) return [];
    return [...data.heatmap].sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      return Math.abs(b.vibeScore) - Math.abs(a.vibeScore);
    });
  }, [data?.heatmap]);

  useEffect(() => {
    if (selectedVenue) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedVenue, slideAnim]);

  const handleVenuePress = useCallback((venue: VenueData) => {
    setSelectedVenue(prev => (prev?.id === venue.id ? null : venue));
  }, []);

  const handleVote = useCallback(
    async (voteType: 'hot' | 'dead') => {
      if (!selectedVenue) return;
      try {
        await castVote({
          venueId: selectedVenue.id,
          voteType,
          source: 'in_app',
        }).unwrap();
        refetch();
      } catch (err) {
        console.log('[HeatmapOverlay] Vote error:', err);
      }
    },
    [selectedVenue, castVote, refetch],
  );

  const handleViewDashboard = useCallback(() => {
    if (!selectedVenue) return;
    navigation.navigate('VenueOwnerDashboard', {venueId: selectedVenue.id});
  }, [selectedVenue, navigation]);

  const getVibeColor = (score: number): string => {
    if (score > 50) return '#FF4500';
    if (score > 20) return '#FFA500';
    if (score > 0) return '#00FFFF';
    if (score === 0) return '#888888';
    return '#4169E1';
  };

  const getVibeEmoji = (score: number): string => {
    if (score > 50) return '🔥';
    if (score > 20) return '🔥';
    if (score > 0) return '😊';
    if (score === 0) return '🤷';
    if (score > -30) return '😐';
    return '💀';
  };

  if (!visible || sortedVenues.length === 0) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Venue count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {sortedVenues.length} venue{sortedVenues.length > 1 ? 's' : ''} nearby
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshSmall}>
          <Text style={styles.refreshSmallText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Venue chips row */}
      <View style={styles.chipsContainer}>
        {sortedVenues.slice(0, 8).map(venue => {
          const isSelected = selectedVenue?.id === venue.id;
          const color = getVibeColor(venue.vibeScore);

          return (
            <TouchableOpacity
              key={venue.id}
              style={[
                styles.chip,
                {borderColor: color},
                isSelected && {backgroundColor: color + '30'},
                venue.isBoosted && styles.chipBoosted,
              ]}
              onPress={() => handleVenuePress(venue)}
              activeOpacity={0.7}>
              {venue.isBoosted && <Text style={styles.chipBoostIcon}>⚡</Text>}
              <Text
                style={[styles.chipName, isSelected && {color}]}
                numberOfLines={1}>
                {venue.name}
              </Text>
              <Text style={[styles.chipScore, {color}]}>
                {getVibeEmoji(venue.vibeScore)}{' '}
                {venue.vibeScore > 0 ? '+' : ''}
                {venue.vibeScore}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected venue detail card */}
      {selectedVenue && (
        <Animated.View
          style={[styles.detailCard, {transform: [{translateY}]}]}>
          <View style={styles.detailHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.detailName}>{selectedVenue.name}</Text>
              <Text style={styles.detailCategory}>
                {selectedVenue.category?.replace(/_/g, ' ')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedVenue(null)}
              style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text
                style={[
                  styles.detailStatValue,
                  {color: getVibeColor(selectedVenue.vibeScore)},
                ]}>
                {getVibeEmoji(selectedVenue.vibeScore)}{' '}
                {selectedVenue.vibeScore > 0 ? '+' : ''}
                {selectedVenue.vibeScore}
              </Text>
              <Text style={styles.detailStatLabel}>Vibe Score</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>
                🔥 {selectedVenue.hotVotes}
              </Text>
              <Text style={styles.detailStatLabel}>Hot</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>
                💀 {selectedVenue.deadVotes}
              </Text>
              <Text style={styles.detailStatLabel}>Dead</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>
                📊 {selectedVenue.totalVotes}
              </Text>
              <Text style={styles.detailStatLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={[styles.voteBtn, styles.deadBtn]}
              onPress={() => handleVote('dead')}
              disabled={isVoting}>
              <Text style={styles.voteBtnText}>💀 Dead</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteBtn, styles.hotBtn]}
              onPress={() => handleVote('hot')}
              disabled={isVoting}>
              <Text style={styles.voteBtnText}>🔥 Hot!</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.dashboardLink}
            onPress={handleViewDashboard}>
            <Text style={styles.dashboardLinkText}>View Full Details →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  countBadge: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2EEE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  countText: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00FFFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshSmallText: {
    color: '#00FFFF',
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2EEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  chipBoosted: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  chipBoostIcon: {
    fontSize: 10,
  },
  chipName: {
    color: '#DDD',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  chipScore: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: '#1A1A2EF5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  detailCategory: {
    color: '#888',
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 14,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailStatLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 3,
  },
  detailDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#333',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  voteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  deadBtn: {
    backgroundColor: '#4169E1',
  },
  hotBtn: {
    backgroundColor: '#FF4500',
  },
  voteBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dashboardLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dashboardLinkText: {
    color: '#00FFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default VenueHeatmapOverlay;
