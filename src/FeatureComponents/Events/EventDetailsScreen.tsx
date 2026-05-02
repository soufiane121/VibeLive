import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format, isThisWeek, isToday, isTomorrow } from 'date-fns';
import { useGetEventByIdQuery, useRemoveRSVPMutation, useRsvpEventMutation } from '../../../features/Events/EventsApi';
import { ChevronBackIcon, CommonMaterialCommunityIcons, CommonMaterialIcons } from '../../UIComponents/Icons';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { GlobalColors, ColorUtils } from '../../styles/GlobalColors';
import { Linking } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../Hooks/useTranslation';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const colors = GlobalColors.EventDetailsScreen;


const EventDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { eventId, fromEventCreation } = route.params as { eventId: string; fromEventCreation?: boolean };
  
  const { data: eventResponse, isLoading, error, refetch } = useGetEventByIdQuery(eventId);
  const [rsvpEvent, { isLoading: isRsvping }] = useRsvpEventMutation();
  const [removeRSVP, { isLoading: isRemovingRsvp }] = useRemoveRSVPMutation();
  
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const { t } = useTranslation();
  
  const [selectedRsvpStatus, setSelectedRsvpStatus] = useState<'interested' | 'going'>('interested');

  const event = eventResponse?.data;
  // TODO:: WE USED TO LISTEN TO hasUserRSVP FROM THE API BUT SOMEHOW IT'S TOPPED AND SWITCH TO LOCAL STATE TO ITTERRATE OVER THE RSVPS ARRAY
  // EXAMPLE OF BEFORE: event.hasUserRSVP
  console.log({event});
  const currentUserRSVP = event?.rsvps?.find((rsvp: any) => rsvp?.user?._id === currentUser?._id || rsvp?.user === currentUser?._id);
  const hasUserRSVP = !!currentUserRSVP;
  const userRSVPStatus = currentUserRSVP?.status;

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE, MMMM d');
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatEventTime = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'h:mm a');
    const end = format(new Date(endDate), 'h:mm a');
    return `${start} - ${end}`;
  };

  const handleRSVP = async (status: 'interested' | 'going') => {
    if (!event) return;

    setSelectedRsvpStatus(status);
    
    try {
      await rsvpEvent({ eventId: event._id, status }).unwrap();
      refetch();
    } catch (error: any) {
      console.log("error 11111111",error);
      
      Alert.alert('Error', error?.data?.message || error?.message || 'Failed to RSVP to event');
    }
  };

  const handleRemoveRSVP = async () => {
    if (!event) return;

    try {
      await removeRSVP(event._id).unwrap();
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to remove RSVP');
    }
  };

  // const handleShare = async () => {
  //   if (!event) return;

  //   try {
  //     await Share.share({
  //       message: `Check out this event: ${event.title}\n${event.description}\n\nWhen: ${formatEventDate(event.startDate)} at ${formatEventTime(event.startDate, event.endDate)}\nWhere: ${event.location.address}`,
  //       title: event.title,
  //     });
  //   } catch (error) {
  //     console.error('Error sharing event:', error);
  //   }
  // };

  const handleGetDirections = () => {
    if (!event) return;

    const [lng, lat] = event.location.coordinates;
    const url = Platform.OS === 'ios' 
      ? `maps:0,0?q=${lat},${lng}`
      : `geo:0,0?q=${lat},${lng}`;
    
    Linking.openURL(url);
  };

  const handleBuyTickets = () => {
    if (!event?.ticketing.ticketLink) return;
    
    Linking.openURL(event.ticketing.ticketLink);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <CommonMaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorText}>This event may have been removed or doesn't exist.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
   console.log(event) 


  return (
    <View style={styles.container}>
      {/* Header Floating */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => {
            if (fromEventCreation) {
              navigation.navigate('EventDetails', {eventId: event._id});
            } else {
              navigation.goBack();
            }
          }}>
          <CommonMaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.headerIconText}
          />
        </TouchableOpacity>
        {/* TODO:: Add share functionality */}
        {/* <TouchableOpacity style={styles.headerIconButton} onPress={handleShare}>
          <CommonMaterialCommunityIcons name="share-variant" size={22} color={colors.headerIconText} />
        </TouchableOpacity> */}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Event Banner */}
        {!event.banner?.url && !event?.coverImageUrl ? (
          <LinearGradient
            colors={[colors.secondaryBackground, colors.background]}
            style={styles.gradientBanner}
          />
        ) : (
          <Image
            source={{uri: event?.banner?.url || event?.coverImageUrl}}
            style={styles.banner}
          />
        )}

        {/* Event Info */}
        <View style={styles.eventInfo}>
          {/* Event Type Badge */}
          <View style={styles.eventTypeBadge}>
            <CommonMaterialCommunityIcons
              name="music-note"
              size={16}
              color={ColorUtils.getEventTypeColor(event.eventType)}
            />
            <Text
              style={[
                styles.eventTypeText,
                {color: ColorUtils.getEventTypeColor(event.eventType)},
              ]}>
              {event.eventType.toUpperCase()}
            </Text>
          </View>

          {/* Promotion Badge */}
          {(event.promotionStatus === 'top' ||
            event.promotionStatus === 'both') && (
            <View style={styles.promotionBadge}>
              <CommonMaterialCommunityIcons
                name="star"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.promotionText}>FEATURED</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Creator */}
          <View style={styles.creatorContainer}>
            <Text style={styles.creatorLabel}>Hosted by</Text>
            <Text style={styles.creatorName}>
              {event.creator?.displayName || event.creator?.username}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Date & Time */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons
                name="calendar-blank-outline"
                size={20}
                color={colors.iconColor}
              />
              <Text style={styles.detailTitle}>Date & time</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardPrimaryText}>
                {formatEventDate(event.startDate)}
              </Text>
              <Text style={styles.cardSecondaryText}>
                {formatEventTime(event.startDate, event.endDate)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color={colors.iconColor}
              />
              <Text style={styles.detailTitle}>Location</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardPrimaryText}>
                {event.location.address}
              </Text>

              <TouchableOpacity
                style={styles.openInMapsButton}
                onPress={handleGetDirections}>
                <Text style={styles.openInMapsText}>Open in maps ↗</Text>
              </TouchableOpacity>

              {/* Mini Map (Hidden in screenshot, can be enabled later if needed) */}
            </View>
          </View>

          {/* Description */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons
                name="format-list-bulleted"
                size={20}
                color={colors.iconColor}
              />
              <Text style={styles.detailTitle}>About</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          </View>

          {/* Ticketing */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons
                name="ticket-outline"
                size={20}
                color={colors.iconColor}
              />
              <Text style={styles.detailTitle}>Tickets</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.ticketRow}>
                {event.ticketing.isFree ? (
                  <View style={styles.freeTicketBadge}>
                    <Text style={styles.freeTicketText}>Free</Text>
                  </View>
                ) : (
                  <Text style={styles.priceText}>
                    ${event.ticketing.price} {event.ticketing.currency}
                  </Text>
                )}

                {event.ticketing.isFree ? (
                  <Text style={styles.noRegistrationText}>
                    No registration needed
                  </Text>
                ) : event.ticketing.ticketLink ? (
                  <TouchableOpacity
                    style={styles.buyTicketsButton}
                    onPress={handleBuyTickets}>
                    <Text style={styles.buyTicketsText}>Buy Tickets</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          {/* Attendees */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons
                name="account-group-outline"
                size={20}
                color={colors.iconColor}
              />
              <Text style={styles.detailTitle}>Attendees</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.attendeesRow}>
                <Text style={styles.attendeesCountText}>
                  {event.rsvpCount} people interested
                </Text>
                {event.rsvpCount === 0 && (
                  <TouchableOpacity
                    style={styles.beFirstButton}
                    onPress={() => handleRSVP('interested')}>
                    <Text style={styles.beFirstText}>
                      {event.rsvpCount > 0 ? 'View all' : 'Be first'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {event.rsvps.length > 0 && (
                <View style={styles.attendeesList}>
                  {event.rsvps.slice(0, 5).map((rsvp, index) => {
                    return (
                      <View key={index} style={styles.attendeeItem}>
                        <View style={styles.attendeeAvatar}>
                          <Text style={styles.attendeeInitial}>
                            {(rsvp?.user?.displayName || rsvp?.user?.username)
                              ?.charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.attendeeInfo}>
                          <Text style={styles.attendeeName}>
                            {rsvp.user.displayName || rsvp.user.username}
                          </Text>
                          <Text style={styles.attendeeStatus}>
                            {rsvp.status === 'going' ? 'Going' : 'Interested'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {event.rsvps.length > 5 && (
                    <Text style={styles.moreAttendees}>
                      +{event.rsvps.length - 5} more
                    </Text>
                  )}
                </View>
              )}

            </View>

            {/* Rejection reason or community tip */}
            {event.reviewStatus === 'rejected' && event.rejectionReason ? (
              <View style={styles.rejectionBadge}>
                <CommonMaterialCommunityIcons
                  name="close-circle-outline"
                  size={14}
                  color={colors.error}
                  style={{marginRight: 6}}
                />
                <Text style={styles.rejectionText}>
                  {event.rejectionReason}
                </Text>
              </View>
            ) : !event.venue && (
              <View style={styles.communityTipBadge}>
                <CommonMaterialCommunityIcons
                  name="information-outline"
                  size={14}
                  color={colors.warningText}
                  style={{marginRight: 6}}
                />
                <Text style={styles.communityTipText}>
                  {t('eventDetailsScreen.communityTipLabel')}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {hasUserRSVP ? (
          <View style={styles.rsvpContainer}>
            <View style={styles.currentRsvpStatus}>
              <CommonMaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.currentRsvpText}>
                You're {userRSVPStatus === 'going' ? 'going' : 'interested'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeRsvpButton}
              onPress={handleRemoveRSVP}
              disabled={isRemovingRsvp}>
              {isRemovingRsvp ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.removeRsvpText}>Remove</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rsvpButtons}>
            <TouchableOpacity
              style={[
                styles.rsvpOutlineButton,
                // selectedRsvpStatus === 'interested' && styles.rsvpOutlineButtonActive //if you want to have colorful backrfound with text
              ]}
              onPress={() => handleRSVP('interested')}
              disabled={isRsvping}>
              {isRsvping && selectedRsvpStatus === 'interested' ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <CommonMaterialCommunityIcons
                    name={
                      selectedRsvpStatus === 'interested'
                        ? 'heart'
                        : 'heart-outline'
                    }
                    size={18}
                    color={colors.iconColor}
                  />
                  <Text style={[styles.rsvpOutlineButtonText]}>Interested</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpOutlineButton,
                // selectedRsvpStatus === 'going' && styles.rsvpOutlineButtonActive
              ]}
              onPress={() => handleRSVP('going')}
              disabled={isRsvping}>
              {isRsvping && selectedRsvpStatus === 'going' ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <CommonMaterialCommunityIcons
                    name="check"
                    size={18}
                    color={
                      // selectedRsvpStatus === 'going' ? colors.accentPrimary : colors.iconColor
                      colors.iconColor
                    }
                  />
                  <Text
                    style={[
                      styles.rsvpOutlineButtonText,
                      // selectedRsvpStatus === 'going' && { color: colors.accentPrimary }
                    ]}>
                    Going
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.headerIconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  banner: { width: '100%', height: 300, backgroundColor: colors.surfaceVariant },
  gradientBanner: {
    width: '100%',
    height: 300,
    position: 'absolute',
    top: 0,
  },
  eventInfo: { padding: 20, paddingTop: 100 },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  promotionBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promotionText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 34,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorLabel: { fontSize: 14, color: colors.textSecondary, marginRight: 4 },
  creatorName: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginBottom: 24,
  },
  detailSection: { marginBottom: 24 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    // Add shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPrimaryText: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  cardSecondaryText: { fontSize: 14, color: colors.textSecondary },
  
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  
  openInMapsButton: {
    marginTop: 8,
  },
  openInMapsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },

  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeTicketBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successSurface,
  },
  freeTicketText: { fontSize: 14, fontWeight: 'bold', color: colors.success },
  noRegistrationText: { fontSize: 14, color: colors.textSecondary },
  priceText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  buyTicketsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buyTicketsText: { fontSize: 14, fontWeight: 'bold', color: colors.surface },
  
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesCountText: { fontSize: 15, color: colors.textSecondary },
  beFirstButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
  },
  beFirstText: { fontSize: 14, fontWeight: 'bold', color: colors.primary },

  attendeesList: { marginTop: 16 },
  attendeeItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeInitial: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  attendeeInfo: { flex: 1 },
  attendeeName: { fontSize: 14, fontWeight: '600', color: colors.text },
  attendeeStatus: { fontSize: 12, color: colors.textSecondary },
  moreAttendees: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 12, color: colors.textSecondary },

  communityTipBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  communityTipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.warningText,
    lineHeight: 18,
  },
  rejectionBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    lineHeight: 18,
  },
  
  bottomBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  rsvpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentRsvpStatus: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  currentRsvpText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  removeRsvpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.removeBorder,
  },
  removeRsvpText: { fontSize: 14, fontWeight: '700', color: colors.removeText },
  
  rsvpButtons: { flexDirection: 'row', gap: 12 },
  rsvpOutlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  rsvpOutlineButtonActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
  },
  rsvpOutlineButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default EventDetailsScreen;
