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
import {premiumColors} from '../../styles/premuimColors';

const data = [
  {
    category: 'live_music',
    id: '69a7ac434298318826476569',
    name: "Coyote Joe's",
    vibeScore: 79,
  },
  {
    category: 'rooftop',
    id: '69a7ac434298318826476599',
    name: 'Nuvole Rooftop',
    vibeScore: 60,
  },
  {
    category: 'nightclub',
    id: '69a7ac434298318826476579',
    name: 'Label',
    vibeScore: 71,
  },
  {
    category: 'cocktail_bar',
    id: '69a7ac434298318826476559',
    name: 'The Blind Pig',
    vibeScore: 60,
  },
  {
    category: 'lounge',
    id: '69a7ac434298318826476571',
    name: 'Ink N Ivy',
    vibeScore: 42,
  },
  {
    category: 'pub',
    id: '69a7ac4342983188264765b9',
    name: 'Flight Beer Garden',
    vibeScore: 51,
  },
  {
    category: 'rooftop',
    id: '69a7ac434298318826476549',
    name: 'Merchant & Trade',
    vibeScore: 12,
  },
  {
    category: 'rooftop',
    id: '69ab8b2db510b7120b53dacd',
    name: 'The Roxbury Nightclub',
    vibeScore: 0,
  },
  {
    category: 'bar',
    id: '69a7ac434298318826476551',
    name: 'Whiskey Warehouse',
    vibeScore: 68,
  },
  {
    category: 'cocktail_bar',
    id: '69a7ac434298318826476591',
    name: 'Dot Dot Dot',
    vibeScore: 94,
  },
];
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
const pc = premiumColors.dark;

const CATEGORY_LABEL: Record<string, string> = {
  bar: 'Bar',
  nightclub: 'Nightclub',
  lounge: 'Lounge',
  restaurant: 'Restaurant',
  pub: 'Pub',
  brewery: 'Brewery',
  wine_bar: 'Wine Bar',
  cocktail_bar: 'Cocktail Bar',
  sports_bar: 'Sports Bar',
  live_music: 'Live Music',
  karaoke: 'Karaoke',
  rooftop: 'Rooftop',
  other: 'Venue',
};
const VenueSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venues: VenueItem[] = route.params?.venues || data || [];

  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [votingVenueId, setVotingVenueId] = useState<string | null>(null);
  const [castVote, {isLoading}] = useCastVoteMutation();

  const handleSelectVenue = useCallback((venueId: string) => {
    setSelectedVenueId(venueId);
  }, []);

  const handleVote = useCallback(
    async (voteType: 'hot' | 'dead') => {
      if (!selectedVenueId) {
        Alert.alert(
          'Select a Venue',
          'Please tap the venue you are at before voting.',
        );
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
          const venueName =
            venues.find(v => v.id === selectedVenueId)?.name || 'Venue';
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


  const getVibeLabel = (score: number) => {
    if (score > 50) return '🔥 ON FIRE';
    if (score > 30) return '🔥 Hot';
    if (score > 0) return '😊 Warm';
    if (score === 0) return '🤷 No votes yet';
    if (score > -30) return '😐 Meh';
    return '💀 Dead';
  };

  const getInlineVibeLabel = (score: number) => {
    if (score > 50) return 'On fire';
    if (score > 30) return 'Hot';
    if (score > 0) return 'Warm';
    if (score === 0) return null;
    if (score > -30) return 'Meh';
    return 'Dead';
  };

  const getInlineVibeDotColor = (score: number) => {
    if (score > 30) return pc.hotPrimary;
    if (score > 0) return '#FFA500';
    if (score === 0) return pc.tertiaryText;
    return pc.accentPrimary;
  };

  const renderVenueItem = useCallback(
    ({item, index}: {item: VenueItem; index: number}) => {
      const isSelected = selectedVenueId === item.id;
      const isVoting = votingVenueId === item.id;
      const emoji = CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.other;
      const categoryLabel =
        CATEGORY_LABEL[item.category] || CATEGORY_LABEL.other;
      const rank = index + 1;
      const inlineVibe = getInlineVibeLabel(item.vibeScore);
      const vibeDotColor = getInlineVibeDotColor(item.vibeScore);

      return (
        <TouchableOpacity
          style={[styles.venueCard, isSelected && styles.venueCardSelected]}
          onPress={() => handleSelectVenue(item.id)}
          activeOpacity={0.7}
          >
          <View
            style={[styles.venueHeader, isSelected && styles.selectedHeader]}>
            <View
              style={[
                styles.rankContainer,
                isSelected && styles.selectedRankContainer,
              ]}>
              <Text
                style={[
                  styles.rankText,
                  isSelected && styles.rankTextSelected,
                ]}>
                {isSelected ? `#${rank}` : rank}
              </Text>
            </View>
            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
              <Text style={styles.venueEmoji}>{emoji}</Text>
            </View>
            <View style={styles.venueInfo}>
              <Text style={styles.venueName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.venueCategory}>{categoryLabel}</Text>
                {inlineVibe && !isSelected && (
                  <View style={styles.selectedCard}>
                    {/* <Text style={styles.subtitleDot}>·</Text> */}
                    <View
                      style={[styles.vibeDot, {backgroundColor: vibeDotColor}]}
                    />
                    <Text
                      style={[styles.inlineVibeText, {color: vibeDotColor}]}>
                      {inlineVibe}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.voteSection}>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
              <Text
                style={[
                  styles.vibeScore,
                  isSelected && {color: pc.accentPrimary},
                ]}>
                +{item.vibeScore}
              </Text>
            </View>
          </View>

          {isSelected && (
            <View style={styles.checkedInRow}>
              <View
                style={[
                  styles.selectedVibeBadge,
                  {backgroundColor: pc.hotSurface, borderColor: pc.hotBorder},
                ]}>
                <Text
                  style={[
                    styles.selectedVibeBadgeText,
                    {color: pc.hotPrimary},
                  ]}>
                  {getVibeLabel(item.vibeScore)}
                </Text>
              </View>
              <Text style={styles.checkedInText}>Checked in ✓</Text>
            </View>
          )}

          {isVoting && (
            <ActivityIndicator
              color={pc.accentPrimary}
              style={styles.loadingIndicator}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedVenueId, votingVenueId, handleSelectVenue],
  );

  const renderListFooter = () => {
    return (
      <View style={styles.listFooter}>
        {!selectedVenueId && (
          <Text style={styles.listFooterText}>
            That's all the venues near you!
          </Text>
        )}
        <Text style={styles.listFooterSubtext}>
          Not seeing your venue? Walk closer and we'll detect it.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.nearbyPill}>
            <View style={styles.nearbyDot} />
            <Text style={styles.nearbyText}>{venues.length} nearby</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Which venue{'\n'}are you at?</Text>
        <Text style={styles.headerSubtitle}>
          Tap to check in · Your vote counts live
        </Text>
      </View>

      <FlatList
        data={venues}
        keyExtractor={item => item.id}
        renderItem={renderVenueItem}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.voteContainer}>
        <Text style={styles.rateTheVibeLabel}>RATE THE VIBE</Text>
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              styles.deadButton,
              (!selectedVenueId || isLoading) && styles.disabledButton,
            ]}
            onPress={() => handleVote('dead')}
            disabled={!selectedVenueId || isLoading}>
            <Text style={styles.voteButtonEmoji}></Text>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pc.primaryBackground,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  selectedCard: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '30%',
    paddingVertical: 3,
    paddingLeft: 4,
    backgroundColor: pc.hotSurface,
    borderColor: pc.hotBorder,
    borderRadius: 50,
    marginLeft: 11,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: pc.accentBorder,
    borderWidth: 1,
    backgroundColor: pc.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: pc.primaryText,
    fontSize: 18,
    fontWeight: '600',
  },
  nearbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pc.primarySurface,
    borderColor: pc.accentBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  nearbyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: pc.successPrimary,
  },
  nearbyText: {
    color: pc.secondaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: pc.primaryText,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  headerSubtitle: {
    color: pc.tertiaryText,
    fontSize: 14,
    marginTop: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 180,
  },
  venueCard: {
    backgroundColor: pc.secondaryBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: pc.secondaryBorder,
  },
  venueCardSelected: {
    borderColor: pc.accentBorder,
    backgroundColor: pc.accentSubtle,
    // height: '34%',
  },
  venueHeader: {
    flexDirection: 'row',
  },
  selectedHeader: {
    borderBottomColor: pc.accentBorder,
    borderBottomWidth: 2,
    paddingBottom: 30,
  },
  rankText: {
    color: pc.tertiaryText,
    fontSize: 14,
    fontWeight: '500',
    width: 22,
  },
  selectedRankContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: pc.accentSurface,
    borderWidth: 1,
    borderColor: pc.accentBorder,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankContainer: {
    marginTop: 0,
    padding: 0,
  },
  rankTextSelected: {
    color: pc.accentPrimary,
    fontWeight: '700',
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: pc.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // opacity: 0.3,
  },
  selectedIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: pc.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueEmoji: {
    fontSize: 20,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    color: pc.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    height: 40,
  },
  venueCategory: {
    color: pc.secondaryText,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  subtitleDot: {
    color: pc.tertiaryText,
    fontSize: 13,
    marginHorizontal: 5,
  },
  voteSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
  },
  vibeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  inlineVibeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: pc.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  vibeScore: {
    fontSize: 18,
    fontWeight: '900',
    color: pc.secondaryText,
  },
  checkedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  selectedVibeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedVibeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkedInText: {
    color: pc.accentPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  voteContainer: {
    position: 'absolute',
    bottom: 0,
    // left: 0,
    // right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 5,
    paddingBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: pc.secondaryBorder,
    backgroundColor: pc.secondaryBackground,
    alignItems: 'center',
    width: '94%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  rateTheVibeLabel: {
    color: pc.tertiaryText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 16,
    gap: 8,
  },
  deadButton: {
    backgroundColor: pc.primarySurface,
  },
  hotButton: {
    backgroundColor: pc.primarySurface,
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
    fontWeight: '900',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 100,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  hintText: {
    color: pc.tertiaryText,
    fontSize: 13,
    textAlign: 'center',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  listFooterText: {
    color: pc.primaryText,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  listFooterSubtext: {
    color: pc.tertiaryText,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default VenueSelectionScreen;
