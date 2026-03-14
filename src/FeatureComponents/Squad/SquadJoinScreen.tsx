import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GlobalColors} from '../../styles/GlobalColors';
import {SquadIcon, ChevronBackIcon} from '../../UIComponents/Icons';
import {
  useGetInviteMetadataQuery,
  useJoinSquadMutation,
} from '../../../features/squad/SquadApi';

const colors = GlobalColors.SquadMode;

// Venue tag options for the joiner
const VENUE_TAG_OPTIONS = [
  {id: 'nightclub', label: 'Nightclub'},
  {id: 'cocktail_bar', label: 'Cocktail Bar'},
  {id: 'dive_bar', label: 'Dive Bar'},
  {id: 'rooftop_bar', label: 'Rooftop'},
  {id: 'lounge', label: 'Lounge'},
  {id: 'live_music_venue', label: 'Live Music'},
  {id: 'sports_bar', label: 'Sports Bar'},
  {id: 'wine_bar', label: 'Wine Bar'},
  {id: 'brewery_taproom', label: 'Brewery'},
  {id: 'karaoke', label: 'Karaoke'},
  {id: 'hookah_lounge', label: 'Hookah'},
  {id: 'restaurant_bar', label: 'Restaurant Bar'},
];

const TIMING_OPTIONS = [
  {id: 'early', label: 'Early (before 10pm)'},
  {id: 'peak', label: 'Peak (10pm–1am)'},
  {id: 'late', label: 'Late (after 1am)'},
  {id: 'anytime', label: 'Anytime'},
];

const SquadJoinScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const squadCode = (route.params as any)?.squad_code || '';

  // Local state
  const [displayName, setDisplayName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timingPreference, setTimingPreference] = useState('anytime');
  const [step, setStep] = useState<'preview' | 'preferences'>('preview');

  // RTK Query
  const {
    data: inviteData,
    isLoading: isLoadingInvite,
    isError: isInviteError,
  } = useGetInviteMetadataQuery(squadCode, {skip: !squadCode});

  const [joinSquad, {isLoading: isJoining}] = useJoinSquadMutation();

  // ── Toggle tag ──────────────────────────────────────────────────────
  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId],
    );
  }, []);

  // ── Handle Join ─────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Enter a display name so your squad knows who you are.');
      return;
    }
    if (selectedTags.length === 0) {
      Alert.alert('Pick Your Vibe', 'Select at least one venue type you\'re into tonight.');
      return;
    }

    try {
      const result = await joinSquad({
        squad_code: squadCode,
        display_name: displayName.trim(),
        venue_type_tags: selectedTags,
        timing_preference: timingPreference,
      }).unwrap();

      // Navigate to the squad tab with the joined squad data
      Alert.alert('You\'re In!', `Joined ${result.creator_display_name}'s squad`, [
        {
          text: 'Continue',
          onPress: () => {
            (navigation as any).navigate('Bottom', {
              screen: 'Squad',
              params: {
                joined_squad_code: result.squad_code,
                joined_squad_id: result.squad_id,
                joined_guest_token: result.guest_token,
              },
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.error || 'Failed to join squad');
    }
  }, [squadCode, displayName, selectedTags, timingPreference, joinSquad, navigation]);

  // ── Loading State ───────────────────────────────────────────────────
  if (isLoadingInvite) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading squad info...</Text>
      </View>
    );
  }

  // ── Error / Invalid Squad ───────────────────────────────────────────
  if (isInviteError || !inviteData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SquadIcon size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Squad Not Found</Text>
        <Text style={styles.errorSubtitle}>
          This squad link may have expired or been cancelled.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Inactive Squad ──────────────────────────────────────────────────
  if (!inviteData.is_active) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SquadIcon size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Squad Has Ended</Text>
        <Text style={styles.errorSubtitle}>
          {inviteData.creator_name}'s squad has already wrapped up.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Preview Step ────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity
          style={styles.navBack}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <ChevronBackIcon size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Invite Preview */}
        <View style={styles.previewHeader}>
          <View style={styles.iconCircle}>
            <SquadIcon size={40} color={colors.primary} />
          </View>
          <Text style={styles.previewTitle}>
            {inviteData.creator_name}'s Squad
          </Text>
          <Text style={styles.previewSubtitle}>
            {inviteData.member_count}{' '}
            {inviteData.member_count === 1 ? 'person' : 'people'} already in
            {inviteData.area.neighborhood
              ? ` — ${inviteData.area.neighborhood}`
              : inviteData.area.city
                ? ` — ${inviteData.area.city}`
                : ''}
          </Text>
        </View>

        {/* Info cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>What is Squad Mode?</Text>
          <Text style={styles.infoCardText}>
            Everyone picks their vibe, and we find the one spot that works for
            the whole group. Takes 20 seconds.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>No app needed</Text>
          <Text style={styles.infoCardText}>
            Join right here — no download, no account. Just pick your preferences.
          </Text>
        </View>

        {/* Join button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('preferences')}
          activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Join Squad</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Preferences Step ────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity
        style={styles.navBack}
        onPress={() => setStep('preview')}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <ChevronBackIcon size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Pick Your Vibe</Text>
      <Text style={styles.stepSubtitle}>
        This helps us find the right spot for everyone
      </Text>

      {/* Display Name */}
      <Text style={styles.fieldLabel}>Your Name</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="What should the squad call you?"
        placeholderTextColor={colors.textMuted}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={30}
        autoCapitalize="words"
      />

      {/* Venue Tags */}
      <Text style={styles.fieldLabel}>What are you into tonight?</Text>
      <View style={styles.tagGrid}>
        {VENUE_TAG_OPTIONS.map(tag => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <TouchableOpacity
              key={tag.id}
              style={[styles.tagChip, isSelected && styles.tagChipSelected]}
              onPress={() => toggleTag(tag.id)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.tagChipText,
                  isSelected && styles.tagChipTextSelected,
                ]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timing Preference */}
      <Text style={styles.fieldLabel}>When are you going out?</Text>
      <View style={styles.timingRow}>
        {TIMING_OPTIONS.map(option => {
          const isSelected = timingPreference === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.timingChip,
                isSelected && styles.timingChipSelected,
              ]}
              onPress={() => setTimingPreference(option.id)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.timingChipText,
                  isSelected && styles.timingChipTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (isJoining || !displayName.trim() || selectedTags.length === 0) &&
            styles.primaryButtonDisabled,
        ]}
        onPress={handleJoin}
        disabled={isJoining || !displayName.trim() || selectedTags.length === 0}
        activeOpacity={0.8}>
        {isJoining ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.primaryButtonText}>Join the Squad</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        No account created. Your preferences are only used for tonight.
      </Text>
    </ScrollView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  // Loading / Error
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Nav
  navBack: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  // Preview
  previewHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  // Preferences
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.tagUnselected,
    borderWidth: 1,
    borderColor: colors.tagBorder,
  },
  tagChipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.tagSelected,
  },
  tagChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: colors.tagSelected,
    fontWeight: '600',
  },
  timingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  timingChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.tagUnselected,
    borderWidth: 1,
    borderColor: colors.tagBorder,
  },
  timingChipSelected: {
    backgroundColor: colors.goldMuted,
    borderColor: colors.gold,
  },
  timingChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  timingChipTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SquadJoinScreen;
