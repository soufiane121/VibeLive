import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {VenueSearchResult} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';

const C = GlobalColors.VenueClaim;

export default function VenueClaimDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venue: VenueSearchResult = route.params?.venue;

  if (!venue) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Venue data not found.</Text>
      </SafeAreaView>
    );
  }

  const address = [venue.address?.street, venue.address?.city, venue.address?.state]
    .filter(Boolean)
    .join(', ');

  const canResubmit =
    venue.claim?.status === 'rejected' &&
    (venue.claim?.resubmissionCount || 0) < 3;

  const handleContinue = () => {
    navigation.navigate('VenueClaimPathSelection', {venue});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Venue Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.venueName}>{venue.name}</Text>
          {address ? <Text style={styles.venueAddr}>{address}</Text> : null}
          {venue.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {venue.category.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
          {venue.googlePlaceId && (
            <Text style={styles.placeId}>
              Google Place ID: {venue.googlePlaceId.slice(0, 20)}...
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>What happens next?</Text>

        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose verification method</Text>
            <Text style={styles.stepDesc}>
              Google Business, social media, or business license upload.
            </Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Verify your identity</Text>
            <Text style={styles.stepDesc}>
              Confirm you represent this venue through the chosen method.
            </Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select your plan</Text>
            <Text style={styles.stepDesc}>
              Choose a tier — analytics, notifications, or premium.
            </Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Admin review</Text>
            <Text style={styles.stepDesc}>
              Our team reviews and approves your claim. You'll get a 30-day free trial.
            </Text>
          </View>
        </View>

        {canResubmit && (
          <View style={styles.resubmitBanner}>
            <Text style={styles.resubmitText}>
              Your previous claim was rejected. You can resubmit with updated information.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>
            {canResubmit ? 'Resubmit Claim' : 'Start Claiming'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: {paddingHorizontal: 20, paddingBottom: 40},
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  venueName: {
    color: C.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  venueAddr: {
    color: C.lightTextGray,
    fontSize: 14,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  placeId: {
    color: C.textGray,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNum: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stepContent: {flex: 1},
  stepTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDesc: {
    color: C.textGray,
    fontSize: 13,
    lineHeight: 18,
  },
  resubmitBanner: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  resubmitText: {
    color: '#f59e0b',
    fontSize: 13,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  continueBtnText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: C.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 60,
  },
});
