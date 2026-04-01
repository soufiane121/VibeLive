import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAnalyticsContext } from '../Providers/AnalyticsProvider';
import AnalyticsService from '../Services/AnalyticsService';

interface DashboardData {
  userSummary: {
    totalEvents: number;
    sessionCount: number;
    totalWatchTime: number;
    averageSessionDuration: number;
    favoriteCategories: Array<{ category: string; count: number; watchTime: number }>;
    socialInteractions: number;
    streamsWatched: number;
    boostsPurchased: number;
    totalSpent: number;
  };
  recentActivity: Array<{
    eventType: string;
    timestamp: string;
    details: any;
  }>;
  engagementMetrics: {
    dailyActiveTime: number;
    weeklyActiveTime: number;
    monthlyActiveTime: number;
    streakDays: number;
    lastActiveDate: string;
  };
  streamingStats: {
    totalStreamsWatched: number;
    averageWatchDuration: number;
    favoriteStreamers: Array<{ streamerId: string; username: string; watchTime: number }>;
    peakViewingHours: Array<{ hour: number; count: number }>;
  };
  socialStats: {
    messagesSent: number;
    reactionsSent: number;
    followersGained: number;
    profileViews: number;
  };
  monetizationStats: {
    totalBoostsPurchased: number;
    totalAmountSpent: number;
    averageBoostTier: string;
    conversionRate: number;
  };
}

interface AnalyticsDashboardProps {
  userId?: string;
  timeRange?: 'day' | 'week' | 'month' | 'all';
  showDetailedMetrics?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  timeRange = 'week',
  showDetailedMetrics = true
}) => {
  const { isInitialized, sessionId } = useAnalyticsContext();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyticsService = AnalyticsService.getInstance();

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch user summary
      const userSummary = await analyticsService.getUserSummary(userId, timeRange);
      
      // Fetch recent activity
      const recentActivity = await analyticsService.getRecentActivity(userId, 10);
      
      // Fetch engagement metrics
      const engagementMetrics = await analyticsService.getEngagementMetrics(userId, timeRange);
      
      // Fetch streaming stats
      const streamingStats = await analyticsService.getStreamingStats(userId, timeRange);
      
      // Fetch social stats
      const socialStats = await analyticsService.getSocialStats(userId, timeRange);
      
      // Fetch monetization stats
      const monetizationStats = await analyticsService.getMonetizationStats(userId, timeRange);

      const dashboardData: DashboardData = {
        userSummary,
        recentActivity,
        engagementMetrics,
        streamingStats,
        socialStats,
        monetizationStats
      };

      setDashboardData(dashboardData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      fetchDashboardData();
    }
  }, [isInitialized, userId, timeRange]);

  const onRefresh = () => {
    fetchDashboardData(true);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  if (!isInitialized) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Analytics not initialized</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Overview
        </Text>
      </View>

      {/* User Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.userSummary.totalEvents}</Text>
            <Text style={styles.metricLabel}>Total Events</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.userSummary.sessionCount}</Text>
            <Text style={styles.metricLabel}>Sessions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {formatTime(dashboardData.userSummary.totalWatchTime)}
            </Text>
            <Text style={styles.metricLabel}>Watch Time</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {formatTime(dashboardData.userSummary.averageSessionDuration)}
            </Text>
            <Text style={styles.metricLabel}>Avg Session</Text>
          </View>
        </View>
      </View>

      {/* Engagement Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engagement</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.engagementMetrics.streakDays}</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {formatTime(dashboardData.engagementMetrics.dailyActiveTime)}
            </Text>
            <Text style={styles.metricLabel}>Daily Active</Text>
          </View>
        </View>
      </View>

      {/* Streaming Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaming Activity</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.streamingStats.totalStreamsWatched}</Text>
            <Text style={styles.metricLabel}>Streams Watched</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {formatTime(dashboardData.streamingStats.averageWatchDuration)}
            </Text>
            <Text style={styles.metricLabel}>Avg Duration</Text>
          </View>
        </View>
      </View>

      {/* Social Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Activity</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.socialStats.messagesSent}</Text>
            <Text style={styles.metricLabel}>Messages</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.socialStats.reactionsSent}</Text>
            <Text style={styles.metricLabel}>Reactions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.socialStats.followersGained}</Text>
            <Text style={styles.metricLabel}>New Followers</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.socialStats.profileViews}</Text>
            <Text style={styles.metricLabel}>Profile Views</Text>
          </View>
        </View>
      </View>

      {/* Monetization Stats */}
      {dashboardData.monetizationStats.totalBoostsPurchased > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boost Activity</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{dashboardData.monetizationStats.totalBoostsPurchased}</Text>
              <Text style={styles.metricLabel}>Boosts Purchased</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatCurrency(dashboardData.monetizationStats.totalAmountSpent)}
              </Text>
              <Text style={styles.metricLabel}>Total Spent</Text>
            </View>
          </View>
        </View>
      )}

      {/* Favorite Categories */}
      {showDetailedMetrics && dashboardData.userSummary.favoriteCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Categories</Text>
          {dashboardData.userSummary.favoriteCategories.slice(0, 5).map((category, index) => (
            <View key={category.category} style={styles.categoryItem}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <Text style={styles.categoryStats}>
                {category.count} streams • {formatTime(category.watchTime)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activity */}
      {showDetailedMetrics && dashboardData.recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {dashboardData.recentActivity.slice(0, 10).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityType}>{activity.eventType.replace(/_/g, ' ')}</Text>
              <Text style={styles.activityTime}>
                {new Date(activity.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCard: {
    alignItems: 'center',
    padding: 10,
    minWidth: '22%',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  categoryStats: {
    fontSize: 14,
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  activityType: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
});

export default AnalyticsDashboard;
