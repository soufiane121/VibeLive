import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetUpcomingEventsQuery } from '../../../features/Events/EventsApi';
import { Event } from '../../../features/Events/EventsApi';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import useGetLocation from '../../CustomHooks/useGetLocation';

// StubHub-inspired dark theme colors
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

const eventTypeIcons: { [key: string]: string } = {
  music: 'music-note',
  sports: 'sports-football',
  nightlife: 'local-bar',
  festival: 'celebration',
  conference: 'business',
  comedy: 'theater-comedy',
  theater: 'theater-masks',
  art: 'palette',
  food: 'restaurant',
  other: 'event',
};

interface EventItemProps {
  event: Event;
  onPress: () => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onPress }) => {
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM dd');
  };

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getPromotionBadge = () => {
    if (event.promotionStatus === 'top' || event.promotionStatus === 'both') {
      return (
        <View style={styles.promotionBadge}>
          <MaterialCommunityIcons name="star" size={12} color={colors.accent} />
          <Text style={styles.promotionText}>FEATURED</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableOpacity style={styles.eventItem} onPress={onPress} activeOpacity={0.8}>
      {getPromotionBadge()}
      
      <View style={styles.eventHeader}>
        <View style={styles.eventTypeContainer}>
          <View style={[styles.eventTypeIcon, { backgroundColor: eventTypeColors[event.eventType] || eventTypeColors.other }]}>
            <MaterialCommunityIcons 
              name={(eventTypeIcons[event.eventType] || eventTypeIcons.other) as any} 
              size={16} 
              color="#ffffff" 
            />
          </View>
          <Text style={styles.eventType}>{event.eventType.toUpperCase()}</Text>
        </View>
        
        <View style={styles.dateTimeContainer}>
          <Text style={styles.eventDate}>{formatEventDate(event.startDate)}</Text>
          <Text style={styles.eventTime}>{formatEventTime(event.startDate)}</Text>
        </View>
      </View>

      <View style={styles.eventContent}>
        {event.banner?.url && (
          <Image source={{ uri: event.banner.url }} style={styles.eventImage} />
        )}
        
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          
          <View style={styles.locationContainer}>
            <Icon name="location-on" size={14} color={colors.textMuted} />
            <Text style={styles.eventLocation} numberOfLines={1}>
              {event.location.address}
            </Text>
          </View>

          <View style={styles.eventFooter}>
            <View style={styles.ticketingInfo}>
              {event.ticketing.isFree ? (
                <Text style={[styles.priceText, { color: colors.success }]}>FREE</Text>
              ) : (
                <Text style={styles.priceText}>
                  ${event.ticketing.price} {event.ticketing.currency}
                </Text>
              )}
            </View>

            <View style={styles.rsvpInfo}>
              <MaterialCommunityIcons name="account-group" size={14} color={colors.textMuted} />
              <Text style={styles.rsvpCount}>{event.rsvpCount} interested</Text>
              {event.hasUserRSVP && (
                <View style={styles.userRsvpIndicator}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EventsListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { coordinates } = useGetLocation();
console.log("from event list screen",{coordinates});

  const {
    data: eventsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUpcomingEventsQuery({
    days: 7,
    limit: 50,
    eventType: selectedFilter === 'all' ? "all" : selectedFilter,
    useDB: false, // Use database first for debugging
    coordinates: coordinates?.join(','),
    radius: 100,
  });

  const events = eventsResponse?.data || [];
  // console.log('EventsListScreen Debug:', {
  //   eventsResponse,
  //   events,
  //   isLoading,
  //   isError,
  //   error,
  //   selectedFilter
  // });
  

  const eventFilters = [
    { key: 'all', label: 'All Events', icon: 'event' },
    { key: 'music', label: 'Music', icon: 'music-note' },
    { key: 'sports', label: 'Sports', icon: 'sports-football' },
    { key: 'nightlife', label: 'Nightlife', icon: 'local-bar' },
    { key: 'festival', label: 'Festivals', icon: 'celebration' },
    { key: 'other', label: 'Other', icon: 'more-horiz' },
  ];

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      // Featured events first
      if (a.promotionStatus === 'top' || a.promotionStatus === 'both') return -1;
      if (b.promotionStatus === 'top' || b.promotionStatus === 'both') return 1;
      
      // Then by start date
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event._id });
  };

  const handleCreateEvent = () => {
    navigation.navigate('EventCreationFlow');
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventItem event={item} onPress={() => handleEventPress(item)} />
  );

  const renderFilterItem = ({ item }: { item: typeof eventFilters[0] }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        selectedFilter === item.key && styles.filterItemActive,
      ]}
      onPress={() => setSelectedFilter(item.key)}
    >
      <MaterialCommunityIcons
        name={item.icon as any}
        size={16}
        color={selectedFilter === item.key ? colors.primary : colors.textMuted}
      />
      <Text
        style={[
          styles.filterText,
          selectedFilter === item.key && styles.filterTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="calendar-blank" size={64} color={colors.textMuted} />
      <Text style={styles.emptyStateTitle}>No Events Found</Text>
      <Text style={styles.emptyStateText}>
        {selectedFilter === 'all' 
          ? 'There are no upcoming events in your area.' 
          : `No ${selectedFilter} events found.`}
      </Text>
      <TouchableOpacity style={styles.createEventButton} onPress={handleCreateEvent}>
        <Text style={styles.createEventButtonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
      <Text style={styles.errorTitle}>Unable to Load Events</Text>
      <Text style={styles.errorText}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (isError) {
    return <View style={styles.container}>{renderError()}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <FlatList
        data={eventFilters}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      />

      {/* Events List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.eventsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterItemActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.primary,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  eventItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  promotionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  promotionText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  eventTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  eventContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.surfaceVariant,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventLocation: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketingInfo: {
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  rsvpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rsvpCount: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  userRsvpIndicator: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createEventButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default EventsListScreen;
