import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useGetEventByIdQuery,
  useRsvpEventMutation,
  useRemoveRSVPMutation,
} from '../../../features/Events/EventsApi';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { CommonMaterialCommunityIcons } from '../../UIComponents/Icons';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
  primary: '#4f46e5',
  primaryVariant: '#6366f1',
  accent: '#f59e0b',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  border: '#374151',
  borderLight: '#4b5563',
};

const eventTypeColors: { [key: string]: string } = {
  music: '#ec4899',
  sports: '#10b981',
  nightlife: '#8b5cf6',
  festival: '#f59e0b',
  conference: '#3b82f6',
  comedy: '#f97316',
  theater: '#ef4444',
  art: '#06b6d4',
  food: '#84cc16',
  other: '#6b7280',
};

const EventDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { eventId } = route.params as { eventId: string };
  
  const { data: eventResponse, isLoading, error, refetch } = useGetEventByIdQuery(eventId);
  const [rsvpEvent, { isLoading: isRsvping }] = useRsvpEventMutation();
  const [removeRSVP, { isLoading: isRemovingRsvp }] = useRemoveRSVPMutation();
  
  const [selectedRsvpStatus, setSelectedRsvpStatus] = useState<'interested' | 'going'>('interested');

  const event = eventResponse?.data;

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

  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n${event.description}\n\nWhen: ${formatEventDate(event.startDate)} at ${formatEventTime(event.startDate, event.endDate)}\nWhere: ${event.location.address}`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CommonMaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <CommonMaterialCommunityIcons name="share-variant" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Banner */}
        {event.banner?.url && (
          <Image source={{ uri: event.banner.url }} style={styles.banner} />
        )}

        {/* Event Info */}
        <View style={styles.eventInfo}>
          {/* Event Type Badge */}
          <View style={styles.eventTypeBadge}>
            <View style={[styles.eventTypeIcon, { backgroundColor: eventTypeColors[event.eventType] || eventTypeColors.other }]}>
              <CommonMaterialCommunityIcons name="music-note" size={16} color="#ffffff" />
            </View>
            <Text style={styles.eventTypeText}>{event.eventType.toUpperCase()}</Text>
          </View>

          {/* Promotion Badge */}
          {(event.promotionStatus === 'top' || event.promotionStatus === 'both') && (
            <View style={styles.promotionBadge}>
              <CommonMaterialCommunityIcons name="star" size={16} color={colors.accent} />
              <Text style={styles.promotionText}>FEATURED</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Creator */}
          <View style={styles.creatorContainer}>
            <Text style={styles.creatorLabel}>Hosted by</Text>
            <Text style={styles.creatorName}>{event.creator?.displayName || event.creator?.username}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons name="calendar" size={24} color={colors.primary} />
              <Text style={styles.detailTitle}>Date & Time</Text>
            </View>
            <Text style={styles.detailText}>{formatEventDate(event.startDate)}</Text>
            <Text style={styles.detailSubtext}>{formatEventTime(event.startDate, event.endDate)}</Text>
          </View>

          {/* Location */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
              <Text style={styles.detailTitle}>Location</Text>
            </View>
            <Text style={styles.detailText}>{event.location.address}</Text>
            
            {/* Mini Map */}
            <View style={styles.mapContainer}>
              {/* <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={{
                  latitude: event.location.coordinates[1],
                  longitude: event.location.coordinates[0],
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: event.location.coordinates[1],
                    longitude: event.location.coordinates[0],
                  }}
                />
              </MapView> */}
              <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
                <CommonMaterialCommunityIcons name="directions" size={20} color={colors.primary} />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons name="text" size={24} color={colors.primary} />
              <Text style={styles.detailTitle}>About</Text>
            </View>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Ticketing */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons name="ticket" size={24} color={colors.primary} />
              <Text style={styles.detailTitle}>Tickets</Text>
            </View>
            {event.ticketing.isFree ? (
              <Text style={[styles.priceText, { color: colors.success }]}>FREE</Text>
            ) : (
              <View style={styles.ticketInfo}>
                <Text style={styles.priceText}>
                  ${event.ticketing.price} {event.ticketing.currency}
                </Text>
                {event.ticketing.ticketLink && (
                  <TouchableOpacity style={styles.buyTicketsButton} onPress={handleBuyTickets}>
                    <Text style={styles.buyTicketsText}>Buy Tickets</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Attendees */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <CommonMaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
              <Text style={styles.detailTitle}>Attendees</Text>
            </View>
            <Text style={styles.detailText}>{event.rsvpCount} people interested</Text>
            
            {event.rsvps.length > 0 && (
              <View style={styles.attendeesList}>
                {event.rsvps.slice(0, 5).map((rsvp, index) => {
                  console.log({rsvp});
                  
                  return (
                  <View key={index} style={styles.attendeeItem}>
                    <View style={styles.attendeeAvatar}>
                      <Text style={styles.attendeeInitial}>
                        {(rsvp?.user?.displayName || rsvp?.user?.username)?.charAt(0).toUpperCase()}
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
                )})}
                {event.rsvps.length > 5 && (
                  <Text style={styles.moreAttendees}>
                    +{event.rsvps.length - 5} more
                  </Text>
                )}
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
        {event.hasUserRSVP ? (
          <View style={styles.rsvpContainer}>
            <View style={styles.currentRsvpStatus}>
              <CommonMaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
              <Text style={styles.currentRsvpText}>
                You're {event.userRSVPStatus === 'going' ? 'going' : 'interested'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeRsvpButton}
              onPress={handleRemoveRSVP}
              disabled={isRemovingRsvp}
            >
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
              style={[styles.rsvpButton, styles.interestedButton]}
              onPress={() => handleRSVP('interested')}
              disabled={isRsvping}
            >
              {isRsvping && selectedRsvpStatus === 'interested' ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <CommonMaterialCommunityIcons name="heart-outline" size={20} color={colors.text} />
                  <Text style={styles.rsvpButtonText}>Interested</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.rsvpButton, styles.goingButton]}
              onPress={() => handleRSVP('going')}
              disabled={isRsvping}
            >
              {isRsvping && selectedRsvpStatus === 'going' ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <CommonMaterialCommunityIcons name="check" size={20} color={colors.text} />
                  <Text style={styles.rsvpButtonText}>Going</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, backgroundColor: colors.background },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  backButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  content: { flex: 1 },
  banner: { width: '100%', height: 200, backgroundColor: colors.surfaceVariant },
  eventInfo: { padding: 20 },
  eventTypeBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eventTypeIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  eventTypeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5 },
  promotionBadge: {
    position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accent + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  promotionText: { marginLeft: 4, fontSize: 10, fontWeight: 'bold', color: colors.accent },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 12, lineHeight: 36 },
  creatorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  creatorLabel: { fontSize: 14, color: colors.textMuted, marginRight: 4 },
  creatorName: { fontSize: 14, fontWeight: '600', color: colors.primary },
  detailSection: { marginBottom: 24 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 12 },
  detailText: { fontSize: 16, color: colors.text, marginBottom: 4 },
  detailSubtext: { fontSize: 14, color: colors.textMuted },
  description: { fontSize: 16, color: colors.textSecondary, lineHeight: 24 },
  mapContainer: { marginTop: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  map: { height: 150 },
  directionsButton: {
    position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  directionsText: { marginLeft: 4, fontSize: 12, fontWeight: '600', color: colors.primary },
  priceText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  ticketInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buyTicketsButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buyTicketsText: { fontSize: 14, fontWeight: '600', color: colors.text },
  attendeesList: { marginTop: 12 },
  attendeeItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  attendeeAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  attendeeInitial: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  attendeeInfo: { flex: 1 },
  attendeeName: { fontSize: 14, fontWeight: '600', color: colors.text },
  attendeeStatus: { fontSize: 12, color: colors.textMuted },
  moreAttendees: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { backgroundColor: colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 12, color: colors.textSecondary },
  bottomBar: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  rsvpContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentRsvpStatus: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  currentRsvpText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: colors.success },
  removeRsvpButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceVariant },
  removeRsvpText: { fontSize: 14, fontWeight: '600', color: colors.text },
  rsvpButtons: { flexDirection: 'row', gap: 12 },
  rsvpButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  interestedButton: { backgroundColor: colors.surfaceVariant },
  goingButton: { backgroundColor: colors.primary },
  rsvpButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: colors.text },
});

export default EventDetailsScreen;
