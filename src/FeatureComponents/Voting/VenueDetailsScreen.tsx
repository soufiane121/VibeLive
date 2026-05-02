import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GlobalColors} from '../../styles/GlobalColors';
import {useGetVenueDetailQuery, VenueData} from '../../../features/voting/VotingApi';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const VenueDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Destructure venueId and venue object passed from MapContainer
  const {venueId, venue: paramsVenue} = route.params || {};

  // We only fetch if venue wasn't provided in params
  const {data: apiData, isLoading} = useGetVenueDetailQuery(venueId, {
    skip: !!paramsVenue || !venueId,
  });
  
  const venue: VenueData | undefined = paramsVenue || apiData?.venue;

  const colors = GlobalColors.VenueDetailsScreen;

  const handleGoBack = () => {
    navigation.goBack();
  };

  // to open the venue in maps
  const handleOpenMaps = () => {
    if (!venue || !venue.coordinates) return;
    const [longitude, latitude] = venue.coordinates;
    const label = encodeURIComponent(venue.name || 'Venue');
    
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(browserUrl);
        }
      });
    }
  };

  const handlePhone = () => {
    if (venue?.phone) {
      Linking.openURL(`tel:${venue.phone}`);
    }
  };

  const handleWebsite = () => {
    if (venue?.website) {
      const url = venue.website.startsWith('http') ? venue.website : `https://${venue.website}`;
      Linking.openURL(url);
    }
  };

  if (!venue) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={styles.errorText}>Loading venue details...</Text>
        <TouchableOpacity style={styles.backButtonCenter} onPress={handleGoBack}>
          <Text style={styles.backButtonCenterText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rating = venue.googleRating != null ? venue.googleRating.toFixed(1) : null;
  const reviewCount = venue.googleReviewCount != null ? String(venue.googleReviewCount) : null;
  const distance = venue.distance ? `${venue.distance.toFixed(1)} mi` : null;
  const price = venue.priceLevel ? '$'.repeat(venue.priceLevel) : null;

  const fullAddress = venue.address
    ? [venue.address.street, venue.address.city, venue.address.state, venue.address.zip]
        .filter(Boolean)
        .join(', ')
    : null;

  const websiteDisplay = venue.website
    ? venue.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;

  return (
    <View style={styles.container}>
      {/* Background Gradient / Dark Top Area */}
      <View style={styles.topBackground} />

      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={[styles.headerIconButton, {marginRight: 12}]}>
            <Ionicons name="heart-outline" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="share-outline" size={24} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Open Pill */}
        <View style={styles.openPillContainer}>
          <View style={styles.openPill}>
            <View style={styles.greenDot} />
            <Text style={styles.openText}>Open · Closes 2am</Text>
          </View>
        </View>

        {/* Venue Icon & Image placeholders */}
        <View style={styles.mediaContainer}>
          <View style={styles.mainIconContainer}>
            <Text style={styles.mainIcon}>🏛️</Text>
          </View>
          <View style={styles.imageThumbnails}>
            <View style={[styles.thumbnail, {backgroundColor: '#2F3C59'}]} />
            <View style={[styles.thumbnail, {backgroundColor: '#3E2F59'}]} />
            <View style={[styles.thumbnail, {backgroundColor: '#2F5937'}]} />
            <View style={[styles.thumbnail, {backgroundColor: '#593B2F'}]} />
            <View style={[styles.thumbnail, styles.moreThumbnail]}>
              <Text style={styles.moreThumbnailText}>+1 more</Text>
            </View>
          </View>
        </View>

        {/* Category Label */}
        <Text style={styles.categoryLabel}>{venue.category?.replace(/_/g, ' ')?.toUpperCase() || 'EVENT VENUE'}</Text>

        {/* Venue Name & Tagline */}
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.tagline}>Where unforgettable events are born</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {rating && (
            <View style={styles.statItem}>
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.ratingText}>{rating}</Text>
              {reviewCount && <Text style={styles.reviewCountText}>({reviewCount})</Text>}
            </View>
          )}
          {distance && (
            <>
              {rating && <View style={styles.dotDivider} />}
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={14} color={colors.secondaryText} style={styles.statIcon} />
                <Text style={styles.statText}>{distance}</Text>
              </View>
            </>
          )}
          {price && (
            <>
              <View style={styles.dotDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statText}>{price}</Text>
              </View>
            </>
          )}
        </View>

        {/* Pricing Card */}
        {/* <View style={styles.pricingCard}>
          <View style={styles.pricingLeft}>
            <Text style={styles.pricingLabel}>Starting from</Text>
            <Text style={styles.pricingAmount}>From $800 / evening</Text>
            <Text style={styles.pricingCapacity}>50–500 guests</Text>
          </View>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now →</Text>
          </TouchableOpacity>
        </View> */}

        {/* About Section */}
        {venue.venueDescription ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this venue</Text>
            <Text style={styles.aboutText}>
              {venue.venueDescription}
            </Text>
          </View>
        ) : null}

        {/* Contact & Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>
          <View style={styles.contactCard}>
            {/* Address */}
            {fullAddress && (
              <View style={styles.contactRow}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="location-outline" size={20} color={colors.secondaryText} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Address</Text>
                  <Text style={styles.contactValue}>{fullAddress}</Text>
                </View>
              </View>
            )}

            {fullAddress && (venue.phone || venue.website) && <View style={styles.contactDivider} />}

            {/* Phone */}
            {venue.phone && (
              <TouchableOpacity style={styles.contactRow} onPress={handlePhone}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="call-outline" size={20} color={colors.secondaryText} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactLink}>{venue.phone}</Text>
                </View>
              </TouchableOpacity>
            )}

            {venue.phone && venue.website && <View style={styles.contactDivider} />}

            {/* Website */}
            {venue.website && (
              <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="globe-outline" size={20} color={colors.secondaryText} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Website</Text>
                  <Text style={styles.contactLink}>{websiteDisplay}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Open in Maps Card */}
        {/* <TouchableOpacity style={styles.mapCard} onPress={handleOpenMaps}>
          <View style={styles.mapGridBackground}>
            <View style={styles.gridOverlay} />
            <View style={styles.mapPinContainer}>
              <Ionicons name="location-outline" size={24} color={colors.accentPrimary} />
            </View>
            <Text style={styles.openInMapsText}>Open in Maps</Text>
          </View>
        </TouchableOpacity> */}

        {/* Reviews Section — only show when rating data exists */}
        {rating && (
          <View style={styles.section}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.reviewsSummaryContainer}>
                <Text style={styles.starIconSmall}>★</Text>
                <Text style={styles.reviewsSummaryRating}>{rating}</Text>
                {reviewCount && <Text style={styles.reviewsSummaryCount}>· {reviewCount} total</Text>}
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const colors = GlobalColors.VenueDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: '#1C2130', // Deep dark blue placeholder for the gradient background
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  openPillContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.openPillBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.openPillBorder,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.openPillDot,
    marginRight: 6,
  },
  openText: {
    color: colors.openPillText,
    fontSize: 12,
    fontWeight: '600',
  },
  mediaContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  mainIcon: {
    fontSize: 40,
  },
  imageThumbnails: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moreThumbnail: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 'auto',
    paddingHorizontal: 12,
  },
  moreThumbnailText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryLabel: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  venueName: {
    color: colors.primaryText,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  tagline: {
    color: colors.secondaryText,
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    color: colors.starRating,
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  reviewCountText: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  dotDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.secondaryBorder,
    marginHorizontal: 12,
  },
  pricingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  pricingLeft: {
    flex: 1,
  },
  pricingLabel: {
    color: colors.secondaryText,
    fontSize: 12,
    marginBottom: 4,
  },
  pricingAmount: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  pricingCapacity: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  bookButton: {
    backgroundColor: colors.actionButtonBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    color: colors.actionButtonText,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  aboutText: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    color: colors.secondaryText,
    fontSize: 12,
    marginBottom: 4,
  },
  contactValue: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  contactLink: {
    color: colors.linkText,
    fontSize: 15,
    fontWeight: '500',
  },
  contactDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: 56, // Align with text
  },
  mapCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 32,
  },
  mapGridBackground: {
    flex: 1,
    backgroundColor: '#1C2130',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    // Note: React Native doesn't support repeating linear gradients natively easily without svg
    // We use a simple border to simulate the map
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 16,
  },
  mapPinContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(79, 126, 232, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 126, 232, 0.3)',
    marginBottom: 8,
  },
  openInMapsText: {
    color: colors.secondaryText,
    fontSize: 13,
    fontWeight: '500',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIconSmall: {
    color: colors.starRating,
    fontSize: 12,
    marginRight: 4,
  },
  reviewsSummaryRating: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  reviewsSummaryCount: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewerStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    color: colors.secondaryText,
    fontSize: 12,
    marginLeft: 4,
  },
  reviewText: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 22,
  },
  seeAllReviewsButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  seeAllReviewsText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.primaryText,
    fontSize: 16,
    marginBottom: 16,
  },
  backButtonCenter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.backButtonCenterBg,
    borderRadius: 8,
  },
  backButtonCenterText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VenueDetailsScreen;
