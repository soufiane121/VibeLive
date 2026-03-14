import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useGetNearbyOnboardedVenuesQuery, NearbyVenue} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';

const C = GlobalColors.VenueClaim;

export default function VenueTaggingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const lat: number = route.params?.lat;
  const lng: number = route.params?.lng;
  const onSelect: ((venue: NearbyVenue | null) => void) | undefined = route.params?.onSelect;

  const {data, isLoading, error} = useGetNearbyOnboardedVenuesQuery(
    {lat, lng},
    {skip: !lat || !lng},
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (venue: NearbyVenue) => {
    setSelectedId(venue._id === selectedId ? null : venue._id);
  };

  const handleConfirm = () => {
    const selected = data?.venues?.find(v => v._id === selectedId) || null;
    if (onSelect) {
      onSelect(selected);
    }
    navigation.goBack();
  };

  const handleSkip = () => {
    if (onSelect) {
      onSelect(null);
    }
    navigation.goBack();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const renderItem = ({item}: {item: NearbyVenue}) => (
    <TouchableOpacity
      style={[styles.venueItem, selectedId === item._id && styles.venueItemSelected]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}>
      <View style={styles.venueMain}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueDistance}>{formatDistance(item.distance)}</Text>
        {item.venueTypes && item.venueTypes.length > 0 && (
          <View style={styles.tagsRow}>
            {item.venueTypes.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.radioOuter}>
        {selectedId === item._id && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tag a Venue</Text>
      </View>

      <Text style={styles.subtitle}>
        Are you streaming from a claimed venue? Tag it so viewers can discover the spot.
      </Text>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={styles.loadingText}>Finding nearby venues...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load nearby venues.</Text>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          data={data?.venues || []}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No onboarded venues nearby.</Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedId && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedId}
          activeOpacity={0.8}>
          <Text style={styles.confirmBtnText}>Tag Venue</Text>
        </TouchableOpacity>
      </View>
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
  backBtn: {padding: 8, marginRight: 8},
  backText: {color: C.text, fontSize: 22},
  title: {color: C.text, fontSize: 20, fontWeight: '700'},
  subtitle: {
    color: C.lightTextGray,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {color: C.lightTextGray, fontSize: 14, marginTop: 12},
  errorText: {color: C.error, fontSize: 14},
  emptyText: {color: C.textGray, fontSize: 14},
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: C.borderLight,
  },
  venueItemSelected: {
    borderColor: C.primary,
    backgroundColor: C.primaryMuted,
  },
  venueMain: {flex: 1},
  venueName: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  venueDistance: {
    color: C.textGray,
    fontSize: 13,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: C.lightTextGray,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    gap: 10,
  },
  skipBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  skipBtnText: {
    color: C.lightTextGray,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: '#0A0A0C',
    fontSize: 15,
    fontWeight: '700',
  },
});
