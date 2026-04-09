import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useGetUpcomingEventsQuery} from '../../../features/Events/EventsApi';
import {Event} from '../../../features/Events/EventsApi';
import {format, isToday, isTomorrow, isThisWeek} from 'date-fns';
import useGetLocation from '../../CustomHooks/useGetLocation';
import {
  CommonMaterialCommunityIcons,
  CommonMaterialIcons,
} from '../../UIComponents/Icons';
import { GlobalColors, ColorUtils } from '../../styles/GlobalColors';

const colors = GlobalColors.EventsListScreen;

const eventTypeIcons: {[key: string]: string} = {
  music: 'music-note',
  sports: 'basketball',
  nightlife: 'glass-cocktail',
  festival: 'tent',
  conference: 'domain',
  comedy: 'drama-masks',
  theater: 'theater',
  art: 'palette',
  food: 'silverware-fork-knife',
  other: 'clock-time-four-outline', // Used "clock" for OTHER badge loosely matching the screenshot
};

interface EventItemProps {
  event: Event;
  onPress: () => void;
}

const EventItem: React.FC<EventItemProps> = ({event, onPress}) => {
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE');
  };

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const isMusic = event.eventType === 'music';

  return (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.eventHeader}>
        <View
          style={[
            styles.eventTypeBadge,
            isMusic ? styles.eventTypeBadgeMusic : null,
          ]}>
          <CommonMaterialCommunityIcons
            name={
              (eventTypeIcons[event.eventType] || eventTypeIcons.other) as any
            }
            size={12}
            color={isMusic ? colors.primary : colors.textSecondary}
            style={{marginRight: 6}}
          />
          <Text
            style={[
              styles.eventTypeText,
              {color: isMusic ? colors.primary : colors.textSecondary},
            ]}>
            {event?.eventType ? event.eventType.toUpperCase() : 'OTHER'}
          </Text>
        </View>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.eventDate}>
            {formatEventDate(event.startDate)}
          </Text>
          <Text style={styles.eventTime}>
            {formatEventTime(event.startDate)}
          </Text>
        </View>
      </View>

      <View style={styles.eventContent}>
        <View style={styles.eventImageContainer}>
          {event.banner?.url || event?.coverImageUrl ? (
            <Image
              source={{uri: event?.banner?.url || event?.coverImageUrl}}
              style={styles.eventImage}
            />
          ) : (
            <CommonMaterialCommunityIcons
              name={(eventTypeIcons[event.eventType] || 'music-note') as any}
              size={24}
              color={colors.textMuted}
            />
          )}
        </View>

        <View style={styles.eventInfo}>
          <View>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>

            <View style={styles.locationContainer}>
              <CommonMaterialIcons
                name="location-on"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.eventLocation} numberOfLines={1}>
                {event.location.address}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            {event.ticketing?.isFree ? (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>Free</Text>
              </View>
            ) : (
              <Text style={styles.paidPriceText}>
                ${event.ticketing?.price || 0}{' '}
                {event.ticketing?.currency || 'USD'}
              </Text>
            )}

            <View style={styles.rsvpInfo}>
              <View style={styles.interestedCircle} />
              <Text style={styles.rsvpCount}>
                {event.rsvpCount || 0} interested
              </Text>
            </View>

            <TouchableOpacity style={styles.bookmarkButton}>
              <CommonMaterialCommunityIcons
                name="bookmark-outline"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
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
  const {coordinates} = useGetLocation();

  const {
    data: eventsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUpcomingEventsQuery({
    days: 7,
    limit: 50,
    eventType: selectedFilter === 'all' ? 'all' : selectedFilter,
    useDB: false,
    coordinates: coordinates?.join(','),
    radius: 100,
  });

  const events = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];

  interface FilterItem {
    key: string;
    label: string;
    icon: string;
  }

  const eventFilters: FilterItem[] = [
    {key: 'all', label: 'All Events', icon: 'animation-play'},
    {key: 'music', label: 'Music', icon: 'music-note'},
    {key: 'sports', label: 'Sports', icon: 'basketball'},
    {key: 'nightlife', label: 'Nightlife', icon: 'glass-cocktail'},
    {key: 'festival', label: 'Festivals', icon: 'tent'},
    {key: 'other', label: 'Other', icon: 'dots-horizontal'},
  ];

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      // Sort by start date first instead of promotion status to keep dates chronological
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', {eventId: event._id});
  };

  const handleCreateEvent = () => {
    navigation.navigate('EventCreationFlow');
  };

  const renderEventItem = ({item, index}: {item: Event, index: number}) => {
    if (!item || !item._id) return null;

    let showSeparator = false;
    let separatorDate = new Date(item.startDate);
    
    if (index === 0) {
      showSeparator = true;
    } else {
      const prevItem = sortedEvents[index - 1];
      const prevDate = new Date(prevItem.startDate);
      if (
        separatorDate.getFullYear() !== prevDate.getFullYear() ||
        separatorDate.getMonth() !== prevDate.getMonth() ||
        separatorDate.getDate() !== prevDate.getDate()
      ) {
        showSeparator = true;
      }
    }

    return (
      <View>
        {showSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>
              {format(separatorDate, 'EEEE · MMM d').toUpperCase()}
            </Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        <EventItem event={item} onPress={() => handleEventPress(item)} />
      </View>
    );
  };

  const renderFilterItem = ({item}: {item: (typeof eventFilters)[0]}) => {
    const isActive = selectedFilter === item.key;
    const iconColor = isActive ? colors.filterActiveText : colors.textSecondary;

    return (
      <TouchableOpacity
        style={[
          styles.filterItem,
          isActive && styles.filterItemActive,
        ]}
        onPress={() => setSelectedFilter(item.key)}>
        <CommonMaterialCommunityIcons
          name={item.icon as any}
          size={16}
          color={iconColor}
          style={{marginRight: 6}}
        />
        <Text
          style={[
            styles.filterText,
            isActive && styles.filterTextActive,
          ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <CommonMaterialCommunityIcons
        name="calendar-blank"
        size={64}
        color={colors.textMuted}
      />
      <Text style={styles.emptyStateTitle}>No Events Found</Text>
      <Text style={styles.emptyStateText}>
        {selectedFilter === 'all'
          ? 'There are no upcoming events in your area.'
          : `No ${selectedFilter} events found.`}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <CommonMaterialCommunityIcons
        name="alert-circle"
        size={64}
        color={colors.error}
      />
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
        <View>
          {/* <Text style={styles.headerSubtitle}>CHARLOTTE, NC</Text> */}
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateEvent}>
          <CommonMaterialCommunityIcons
            name="plus"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <FlatList
          data={eventFilters}
          renderItem={renderFilterItem}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Events List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          renderItem={renderEventItem}
          keyExtractor={item => item._id}
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
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:2,
    borderColor: colors.border
  },
  filtersWrapper: {
    height: 50,
    marginBottom: 8,
  },
  filtersContainer: {
    backgroundColor: 'transparent',
  },
  filtersContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: colors.filterBackground,
    borderWidth: 1,
    borderColor: colors.filterBorder,
    height: 38,
  },
  filterItemActive: {
    backgroundColor: colors.filterActive,
    borderColor: colors.filterActiveBorder,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.filterActiveText,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.separator,
  },
  dateSeparatorText: {
    marginHorizontal: 16,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  eventItem: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.filterBackground,
    borderWidth: 1,
    borderColor: colors.filterBorder,
  },
  eventTypeBadgeMusic: {
    backgroundColor: colors.primarySurface, // Light blue tinted background
    borderColor: colors.primaryBorder,     // Light blue tinted border
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  eventTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  eventContent: {
    flexDirection: 'row',
  },
  eventImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight, // Very subtle border matching the grey outline
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // reduced margin to fit all components nicely
  },
  eventLocation: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.successSurface,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginRight: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  paidPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 12,
  },
  rsvpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  interestedCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    marginRight: 6,
  },
  rsvpCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default EventsListScreen;
