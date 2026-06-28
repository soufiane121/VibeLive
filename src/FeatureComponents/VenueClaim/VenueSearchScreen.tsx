import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useLazySearchVenuesQuery, VenueSearchResult} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';
import useTranslation from '../../Hooks/useTranslation';

const C = GlobalColors.VenueClaim;

const DEBOUNCE_MS = 400;

export default function VenueSearchScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [trigger, {data, isFetching}] = useLazySearchVenuesQuery();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (text.length < 2) return;
      const timer = setTimeout(() => {
        trigger(text);
      }, DEBOUNCE_MS);
      setDebounceTimer(timer);
    },
    [debounceTimer, trigger],
  );

  const handleSelectVenue = (venue: VenueSearchResult) => {
    navigation.navigate('VenueClaimDetails', {venue});
  };

  const getStatusLabel = (status?: string): string | null => {
    if (!status || status === 'unclaimed') return null;
    if (status === 'approved') return t('venueClaim.alreadyClaimed');
    if (status === 'pending_verification' || status === 'manual_review') return t('venueClaim.claimInProgress');
    if (status === 'suspended') return t('venueClaim.suspended');
    return null;
  };

  const renderItem = ({item}: {item: VenueSearchResult}) => {
    const statusLabel = getStatusLabel(item.claim?.status);
    const isBlocked = ['approved', 'pending_verification', 'manual_review'].includes(
      item.claim?.status || '',
    );

    return (
      <TouchableOpacity
        style={[styles.resultItem, isBlocked && styles.resultItemDisabled]}
        onPress={() => !isBlocked && handleSelectVenue(item)}
        disabled={isBlocked}
        activeOpacity={0.7}>
        <View style={styles.resultMain}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultAddr}>
            {[item.address?.street, item.address?.city, item.address?.state]
              .filter(Boolean)
              .join(', ') || t('venueClaim.noAddress')}
          </Text>
          {item.category && (
            <Text style={styles.resultCategory}>
              {item.category.replace(/_/g, ' ')}
            </Text>
          )}
        </View>
        {statusLabel && (
          <View style={[styles.statusBadge, isBlocked && styles.statusBadgeBlocked]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.backArrow')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('venueClaim.claimYourVenue')}</Text>
      </View>

      <Text style={styles.subtitle}>
        {t('venueClaim.searchForYourVenue')}
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('venueClaim.searchVenueName')}
          placeholderTextColor={C.mutedGray}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
        />
        {isFetching && <ActivityIndicator color={C.primary} style={styles.spinner} />}
      </View>

      {query.length > 0 && query.length < 2 && (
        <Text style={styles.hint}>{t('venueClaim.typeAtLeastTwoChars')}</Text>
      )}

      <FlatList
        data={data?.venues || []}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.length >= 2 && !isFetching ? (
            <Text style={styles.emptyText}>{t('venueClaim.noVenuesFound')} "{query}"</Text>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    color: C.text,
    fontSize: 22,
  },
  title: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: C.lightTextGray,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: C.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  spinner: {
    marginLeft: 12,
  },
  hint: {
    color: C.textGray,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  resultItemDisabled: {
    opacity: 0.5,
  },
  resultMain: {
    flex: 1,
  },
  resultName: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultAddr: {
    color: C.textGray,
    fontSize: 13,
    marginBottom: 2,
  },
  resultCategory: {
    color: C.primary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  statusBadgeBlocked: {
    backgroundColor: 'rgba(231,76,60,0.15)',
  },
  statusText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: C.textGray,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
