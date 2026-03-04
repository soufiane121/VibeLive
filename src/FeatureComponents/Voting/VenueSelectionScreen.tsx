import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useCastVoteMutation} from '../../../features/voting/VotingApi';

interface VenueItem {
  id: string;
  name: string;
  category: string;
  vibeScore: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  bar: '🍺',
  nightclub: '🎵',
  lounge: '🛋️',
  restaurant: '🍽️',
  pub: '🍻',
  brewery: '🏭',
  wine_bar: '🍷',
  cocktail_bar: '🍸',
  sports_bar: '⚽',
  live_music: '🎸',
  karaoke: '🎤',
  rooftop: '🌃',
  other: '📍',
};

const VenueSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venues: VenueItem[] = route.params?.venues || [];

  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [votingVenueId, setVotingVenueId] = useState<string | null>(null);
  const [castVote, {isLoading}] = useCastVoteMutation();

  const handleSelectVenue = useCallback((venueId: string) => {
    setSelectedVenueId(venueId);
  }, []);

  const handleVote = useCallback(
    async (voteType: 'hot' | 'dead') => {
      if (!selectedVenueId) {
        Alert.alert('Select a Venue', 'Please tap the venue you are at before voting.');
        return;
      }

      setVotingVenueId(selectedVenueId);

      try {
        const result = await castVote({
          venueId: selectedVenueId,
          voteType,
          source: 'venue_selection',
        }).unwrap();

        if (result.success) {
          const emoji = voteType === 'hot' ? '🔥' : '💀';
          const venueName = venues.find(v => v.id === selectedVenueId)?.name || 'Venue';
          Alert.alert(
            'Vote Recorded!',
            `${emoji} You voted ${venueName} as ${voteType}!`,
            [{text: 'Done', onPress: () => navigation.goBack()}],
          );
        } else if (result.reason === 'duplicate_vote') {
          Alert.alert(
            'Already Voted',
            "You've already voted for this venue tonight.",
            [{text: 'OK', onPress: () => navigation.goBack()}],
          );
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to record vote. Please try again.');
        console.log('[VenueSelection] Vote error:', error);
      } finally {
        setVotingVenueId(null);
      }
    },
    [selectedVenueId, castVote, venues, navigation],
  );

  const getVibeColor = (score: number) => {
    if (score > 30) return '#FF4500';
    if (score > 0) return '#FFA500';
    if (score === 0) return '#888';
    return '#4169E1';
  };

  const getVibeLabel = (score: number) => {
    if (score > 50) return '🔥 ON FIRE';
    if (score > 30) return '🔥 Hot';
    if (score > 0) return '😊 Warm';
    if (score === 0) return '🤷 No votes yet';
    if (score > -30) return '😐 Meh';
    return '💀 Dead';
  };

  const renderVenueItem = useCallback(
    ({item}: {item: VenueItem}) => {
      const isSelected = selectedVenueId === item.id;
      const isVoting = votingVenueId === item.id;
      const emoji = CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.other;

      return (
        <TouchableOpacity
          style={[styles.venueCard, isSelected && styles.venueCardSelected]}
          onPress={() => handleSelectVenue(item.id)}
          activeOpacity={0.7}>
          <View style={styles.venueHeader}>
            <Text style={styles.venueEmoji}>{emoji}</Text>
            <View style={styles.venueInfo}>
              <Text style={styles.venueName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.venueCategory}>
                {item.category.replace(/_/g, ' ')}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.vibeRow}>
            <View
              style={[
                styles.vibeBadge,
                {backgroundColor: getVibeColor(item.vibeScore) + '20'},
              ]}>
              <Text
                style={[
                  styles.vibeText,
                  {color: getVibeColor(item.vibeScore)},
                ]}>
                {getVibeLabel(item.vibeScore)}
              </Text>
            </View>
            <Text style={styles.vibeScore}>
              {item.vibeScore > 0 ? '+' : ''}
              {item.vibeScore}
            </Text>
          </View>

          {isVoting && (
            <ActivityIndicator
              color="#00FFFF"
              style={styles.loadingIndicator}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedVenueId, votingVenueId, handleSelectVenue],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Which venue are you at?</Text>
          <Text style={styles.headerSubtitle}>
            {venues.length} venues nearby — tap yours to vote
          </Text>
        </View>
      </View>

      <FlatList
        data={venues}
        keyExtractor={item => item.id}
        renderItem={renderVenueItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.voteButtons}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            styles.deadButton,
            (!selectedVenueId || isLoading) && styles.disabledButton,
          ]}
          onPress={() => handleVote('dead')}
          disabled={!selectedVenueId || isLoading}>
          <Text style={styles.voteButtonEmoji}>💀</Text>
          <Text style={styles.voteButtonText}>Dead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.voteButton,
            styles.hotButton,
            (!selectedVenueId || isLoading) && styles.disabledButton,
          ]}
          onPress={() => handleVote('hot')}
          disabled={!selectedVenueId || isLoading}>
          <Text style={styles.voteButtonEmoji}>🔥</Text>
          <Text style={styles.voteButtonText}>Hot!</Text>
        </TouchableOpacity>
      </View>

      {!selectedVenueId && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Not seeing your venue? Walk closer and we'll detect it.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 180,
  },
  venueCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  venueCardSelected: {
    borderColor: '#00FFFF',
    backgroundColor: '#1A1A3A',
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  venueCategory: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00FFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '700',
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  vibeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vibeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  vibeScore: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  voteButtons: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  deadButton: {
    backgroundColor: '#4169E1',
  },
  hotButton: {
    backgroundColor: '#FF4500',
  },
  disabledButton: {
    opacity: 0.4,
  },
  voteButtonEmoji: {
    fontSize: 24,
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 100,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  hintText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default VenueSelectionScreen;
