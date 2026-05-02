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
import useTranslation from '../../Hooks/useTranslation';

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
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const squadCode = (route.params as any)?.squad_code || '';

  // Local state
  const [displayName, setDisplayName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timingPreference, setTimingPreference] = useState('anytime');
  const [conviction, setConviction] = useState<'important_to_me' | 'flexible' | null>(null);
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
      Alert.alert(t('squad.nameRequired'), t('squad.nameRequiredDesc'));
      return;
    }
    if (selectedTags.length === 0) {
      Alert.alert(t('squad.pickYourVibe'), t('squad.pickYourVibeDesc'));
      return;
    }

    try {
      const result = await joinSquad({
        squad_code: squadCode,
        display_name: displayName.trim(),
        venue_type_tags: selectedTags,
        timing_preference: timingPreference,
        conviction: conviction,
      }).unwrap();

      // Navigate to the squad tab with the joined squad data
      Alert.alert(t('squad.youreIn'), t('squad.joinedSquad', { creator: result.creator_display_name }), [
        {
          text: t('common.continue'),
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
      Alert.alert(t('common.error'), err?.data?.error || t('squad.failedJoin'));
    }
  }, [squadCode, displayName, selectedTags, timingPreference, conviction, joinSquad, navigation]);

  // ── Loading State ───────────────────────────────────────────────────
  if (isLoadingInvite) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('squad.loadingInvite')}</Text>
      </View>
    );
  }

  // ── Error / Invalid Squad ───────────────────────────────────────────
  if (isInviteError || !inviteData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SquadIcon size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>{t('squad.squadNotFound')}</Text>
        <Text style={styles.errorSubtitle}>
          {t('squad.squadNotFoundDesc')}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t('squad.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Inactive Squad ──────────────────────────────────────────────────
  if (!inviteData.is_active) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SquadIcon size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>{t('squad.squadEnded')}</Text>
        <Text style={styles.errorSubtitle}>
          {t('squad.squadEndedDesc', { creator: inviteData.creator_name })}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t('squad.goBack')}</Text>
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
            {t('squad.creatorSquad', { creator: inviteData.creator_name })}
          </Text>
          <Text style={styles.previewSubtitle}>
            {t('squad.peopleInSquad', { 
              count: inviteData.member_count,
              location: inviteData.area.neighborhood || inviteData.area.city || ''
            })}
          </Text>
        </View>

        {/* Info cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>{t('squad.whatIsSquad')}</Text>
          <Text style={styles.infoCardText}>
            {t('squad.whatIsSquadDesc')}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>{t('squad.noAppNeeded')}</Text>
          <Text style={styles.infoCardText}>
            {t('squad.noAppNeededDesc')}
          </Text>
        </View>

        {/* Join button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep('preferences')}
          activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>{t('squad.joinSquad')}</Text>
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

      <Text style={styles.stepTitle}>{t('squad.pickYourVibeTitle')}</Text>
      <Text style={styles.stepSubtitle}>
        {t('squad.pickYourVibeSubtitle')}
      </Text>

      {/* Display Name */}
      <Text style={styles.fieldLabel}>{t('squad.yourName')}</Text>
      <TextInput
        style={styles.nameInput}
        placeholder={t('squad.yourNamePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={30}
        autoCapitalize="words"
      />

      {/* Venue Tags */}
      <Text style={styles.fieldLabel}>{t('squad.whatIntoTonight')}</Text>
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
                {t(`squad.venue.${tag.id}`, { defaultValue: tag.label })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timing Preference */}
      <Text style={styles.fieldLabel}>{t('squad.whenGoingOut')}</Text>
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
                {t(`squad.timing.${option.id}`, { defaultValue: option.label })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dealbreaker / Conviction Question */}
      {selectedTags.length > 0 && (
        <>
          <Text style={styles.fieldLabel}>{t('squad.howImportant')}</Text>
          <Text style={styles.convictionHint}>
            {t('squad.howImportantHint')}
          </Text>
          <View style={styles.convictionRow}>
            <TouchableOpacity
              style={[
                styles.convictionChip,
                conviction === 'important_to_me' && styles.convictionChipImportant,
              ]}
              onPress={() => setConviction(conviction === 'important_to_me' ? null : 'important_to_me')}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.convictionChipText,
                  conviction === 'important_to_me' && styles.convictionChipTextImportant,
                ]}>
                {t('squad.dealbreakers')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.convictionChip,
                conviction === 'flexible' && styles.convictionChipFlexible,
              ]}
              onPress={() => setConviction(conviction === 'flexible' ? null : 'flexible')}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.convictionChipText,
                  conviction === 'flexible' && styles.convictionChipTextFlexible,
                ]}>
                {t('squad.imFlexible')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

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
          <Text style={styles.primaryButtonText}>{t('squad.joinTheSquad')}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        {t('squad.noAccountHint')}
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
  // Conviction / Dealbreaker
  convictionHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: -4,
  },
  convictionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  convictionChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.tagUnselected,
    borderWidth: 1,
    borderColor: colors.tagBorder,
    alignItems: 'center',
  },
  convictionChipImportant: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: '#FF3B30',
  },
  convictionChipFlexible: {
    backgroundColor: colors.goldMuted,
    borderColor: colors.gold,
  },
  convictionChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  convictionChipTextImportant: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  convictionChipTextFlexible: {
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
