import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon } from '../UIComponents/Icons';
import { useAnalytics } from '../Hooks/useAnalytics';
import { AnalyticsEventType } from '../types/AnalyticsEnums';

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  thumbnail?: string;
  type: 'live' | 'highlight' | 'activity';
}

const Profile = () => {
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  console.log("from profile",{currentUser});
  
  
  // --- DATA INTEGRATION COMMENTS ---
  // Followers/Following: Uses currentUser.followers/following arrays. If these are not set by backend, will default to 0.
  // Highlights: Uses currentUser.highlights array. If not present, will default to 0 and empty activity feed.
  // To fully integrate, ensure backend and Redux state provide these arrays on user object.
  // If you want richer activity, update backend to include highlights/streams/history for the user.
  // ----------------------------------
  const userStats = {
    followers: Array.isArray(currentUser?.followers) ? currentUser.followers.length : 0,
    following: Array.isArray(currentUser?.following) ? currentUser.following.length : 0,
    highlights: Array.isArray(currentUser?.highlights) ? currentUser.highlights.length : 0, // <-- Needs backend support
  };

  // --- ACTIVITY FEED MOCK/INTEGRATION ---
  // This maps currentUser.highlights to activity items. If highlights is not set by backend, feed will be empty.
  // To integrate real activity, backend must populate highlights (or replace with a real activity/streams array).
  // If you want to show streams or other events, update this mapping and backend accordingly.
  const activityData: ActivityItem[] = Array.isArray(currentUser?.highlights)
    ? currentUser.highlights.map((h: any, idx: number) => ({
        id: h.id || idx.toString(),
        title: h.title || 'Untitled Highlight', // <-- Needs real data from backend
        subtitle: h.subtitle || '', // <-- Needs real data from backend
        timeAgo: h.timeAgo || '', // <-- Needs real data from backend
        thumbnail: h.thumbnail || undefined, // <-- Needs real data from backend
        type: h.type || 'highlight', // <-- Needs real data from backend
      }))
    : []; // <-- Will be empty if backend does not provide highlights

  const [activeTab, setActiveTab] = React.useState<'Activity' | 'Lives' | 'Highlights'>('Activity');

  React.useEffect(() => {
    trackEvent(AnalyticsEventType.PROFILE_VIEWED, {
      screen_name: 'Profile',
      user_id: currentUser?._id,
    });
  }, []);

  const handleGoLive = () => {
    trackEvent('profile_go_live_pressed', {
      user_id: currentUser?._id,
      username: currentUser?.userName,
    });
    // Navigate to go live screen
    navigation.navigate('Live' as never);
  };

  const handleTabPress = (tab: 'Activity' | 'Lives' | 'Highlights') => {
    setActiveTab(tab);
    trackEvent('profile_tab_changed', {
      tab_name: tab,
      user_id: currentUser?._id,
    });
  };

  const renderActivityItem = (item: ActivityItem) => (
    <TouchableOpacity key={item.id} style={styles.activityItem}>
      {item.thumbnail && (
        <Image source={{ uri: item.thumbnail }} style={styles.activityThumbnail} />
      )}
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.activityTime}>{item.timeAgo}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronBackIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: currentUser?.profileImage || 'https://via.placeholder.com/120x120/374151/ffffff?text=' + (currentUser?.firstName?.[0] || 'U'),
              }}
              style={styles.avatar}
            />
          </View>
          
          <Text style={styles.username}>
            {currentUser?.userName || 'username'}
          </Text>
          
          <TouchableOpacity style={styles.goLiveButton} onPress={handleGoLive}>
            <Text style={styles.goLiveText}>Go Live</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.highlights}</Text>
            <Text style={styles.statLabel}>Highlights</Text>
          </TouchableOpacity>
        </View>

        {/* Live Notification */}
        <View style={styles.liveNotification}>
          <Text style={styles.liveIcon}>🔥</Text>
          <Text style={styles.liveText}>Your followers are live now</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['Activity', 'Lives', 'Highlights'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => handleTabPress(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Feed */}
        <View style={styles.activitySection}>
          {activityData.length === 0 ? (
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>
              No highlights or activity yet.
            </Text>
          ) : (
            activityData.map(renderActivityItem)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#374151',
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  goLiveButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  goLiveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  liveNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  liveIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  liveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  activityThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  activityTime: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
});