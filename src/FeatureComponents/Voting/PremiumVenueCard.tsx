import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions} from 'react-native';
import {GlobalColors} from '../../styles/GlobalColors';
import {VenueData} from '../../../features/voting/VotingApi';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface PremiumVenueCardProps {
  venue: VenueData;
  onClose: () => void;
  onViewVenue: (venueId: string) => void;
  onDirections?: (venueId: string) => void;
  translateY: Animated.AnimatedInterpolation<number>;
}

const PremiumVenueCard: React.FC<PremiumVenueCardProps> = ({
  venue,
  onClose,
  onViewVenue,
  onDirections,
  translateY,
}) => {
  const colors = GlobalColors.PremiumVenueCard;

  // Hardcoded placeholders as per requirements
  const rating = '4.9';
  const reviewsCount = '(312)';
  const distance = venue.distance ? `${venue.distance.toFixed(1)} mi` : '0.3 mi';
  const price = '$$$';

  return (
    <Animated.View style={[styles.container, {transform: [{translateY}]}]}>
      <View style={styles.card}>
        {/* Top Header Section */}
        <View style={styles.header}>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>EVENT VENUE</Text>
          </View>
          <View style={styles.iconContainer}>
            <Text style={styles.centerIcon}>🏛️</Text>
          </View>
          <View style={[styles.headerPill, styles.openPill]}>
            <View style={styles.greenDot} />
            <Text style={styles.openText}>Open</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Body Section */}
        <View style={styles.body}>
          <Text style={styles.venueName}>{venue.name}</Text>
          
          <View style={styles.locationRow}>
            <Text style={styles.pinIcon}>📍</Text>
            {/* We don't have address in VenueData currently, using category or a placeholder */}
            <Text style={styles.addressText} numberOfLines={1}>
              {venue.category?.replace(/_/g, ' ') || '142 West 36th St, New York'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.stars}>★★★★☆</Text>
            <Text style={styles.ratingText}>{rating}</Text>
            <Text style={styles.reviewsText}>{reviewsCount}</Text>
            <View style={styles.dotDivider} />
            <Text style={styles.statsText}>{distance}</Text>
            <View style={styles.dotDivider} />
            <Text style={styles.statsText}>{price}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.button, styles.directionsButton]}
            onPress={() => onDirections?.(venue.id)}>
            <Text style={styles.directionsText}>↱ Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.viewVenueButton]}
            onPress={() => onViewVenue(venue.id)}>
            <Text style={styles.viewVenueText}>View Venue 〉</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Map Callout Pointer */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
      </View>
    </Animated.View>
  );
};

const colors = GlobalColors.PremiumVenueCard;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20, // distance from bottom of screen
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.9,
    zIndex: 999,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerPill: {
    backgroundColor: colors.pillBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  headerPillText: {
    color: colors.pillText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.openPillBackground,
    borderColor: colors.openPillBorder,
    marginLeft: 'auto',
    marginRight: 10,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.openPillDot,
  },
  openText: {
    color: colors.openPillText,
    fontSize: 10,
    fontWeight: '600',
  },
  iconContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{translateX: -20}], // half of width to center
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.iconContainerBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.iconContainerBorder,
  },
  centerIcon: {
    fontSize: 18,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.closeButtonBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.closeButtonBorder,
  },
  closeIcon: {
    color: colors.closeIcon,
    fontSize: 14,
  },
  body: {
    marginBottom: 20,
  },
  venueName: {
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 6,
    color: colors.secondaryText,
  },
  addressText: {
    color: colors.secondaryText,
    fontSize: 13,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    color: '#FFB800',
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  reviewsText: {
    color: colors.tertiaryText,
    fontSize: 13,
  },
  dotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.tertiaryText,
    marginHorizontal: 8,
  },
  statsText: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsButton: {
    backgroundColor: colors.directionsButtonBg,
    borderWidth: 1,
    borderColor: colors.directionsButtonBorder,
  },
  directionsText: {
    color: colors.directionsText,
    fontSize: 14,
    fontWeight: '600',
  },
  viewVenueButton: {
    backgroundColor: colors.viewVenueButtonBg,
  },
  viewVenueText: {
    color: colors.viewVenueText,
    fontSize: 14,
    fontWeight: '600',
  },
  pointerContainer: {
    alignItems: 'center',
    marginTop: -1, // Overlap slightly to hide border gap
  },
  pointer: {
    width: 20,
    height: 10,
    borderTopWidth: 10,
    borderTopColor: colors.pointerBorderTop,
    borderLeftWidth: 10,
    borderLeftColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
});

export default PremiumVenueCard;
