import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { 
  ChevronBackIcon, 
  PlusIcon, 
  TrendingUpIcon, 
  EyeIcon, 
  MousePointerIcon,
  CalendarIcon,
  DollarSignIcon,
  EditIcon,
  PauseIcon,
  PlayIcon
} from '../../UIComponents/Icons';

interface AdData {
  id: string;
  title: string;
  type: 'map_marker' | 'story_carousel';
  status: 'active' | 'paused' | 'completed' | 'pending';
  mediaUri: string;
  mediaType: 'image' | 'video';
  totalCost: number;
  duration: number;
  daysRemaining: number;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  createdAt: string;
  targeting: {
    radius: number;
    categories: string[];
  };
}

const AdDashboard: React.FC = () => {
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const [ads, setAds] = useState<AdData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed'>('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Mock data - replace with real API calls
  const mockAds: AdData[] = [
    {
      id: 'ad_1',
      title: 'Rooftop Party Tonight',
      type: 'map_marker',
      status: 'active',
      mediaUri: 'https://example.com/image1.jpg',
      mediaType: 'image',
      totalCost: 75,
      duration: 3,
      daysRemaining: 2,
      views: 1247,
      clicks: 89,
      conversions: 12,
      ctr: 7.1,
      cpc: 0.84,
      createdAt: '2024-01-15',
      targeting: {
        radius: 5,
        categories: ['bars', 'clubs'],
      },
    },
    {
      id: 'ad_2',
      title: 'Underground Music Event',
      type: 'story_carousel',
      status: 'active',
      mediaUri: 'https://example.com/video1.mp4',
      mediaType: 'video',
      totalCost: 50,
      duration: 2,
      daysRemaining: 1,
      views: 892,
      clicks: 67,
      conversions: 8,
      ctr: 7.5,
      cpc: 0.75,
      createdAt: '2024-01-14',
      targeting: {
        radius: 10,
        categories: ['music', 'art'],
      },
    },
    {
      id: 'ad_3',
      title: 'Food Truck Festival',
      type: 'map_marker',
      status: 'completed',
      mediaUri: 'https://example.com/image2.jpg',
      mediaType: 'image',
      totalCost: 25,
      duration: 1,
      daysRemaining: 0,
      views: 567,
      clicks: 34,
      conversions: 5,
      ctr: 6.0,
      cpc: 0.74,
      createdAt: '2024-01-12',
      targeting: {
        radius: 3,
        categories: ['food', 'restaurants'],
      },
    },
  ];

  useEffect(() => {
    analytics.trackEvent('ad_dashboard_viewed', {
      timestamp: new Date().toISOString(),
    });

    setAds(mockAds);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleBack = () => {
    analytics.trackEvent('ad_dashboard_back');
    navigation.goBack();
  };

  const handleCreateAd = () => {
    analytics.trackEvent('ad_dashboard_create_new');
    navigation.navigate('CreateAdFlow' as never, {
      entryPoint: 'dashboard',
    } as never);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    analytics.trackEvent('ad_dashboard_refresh');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRefreshing(false);
  };

  const handleAdAction = (adId: string, action: 'pause' | 'resume' | 'edit' | 'view') => {
    analytics.trackEvent('ad_dashboard_action', {
      ad_id: adId,
      action: action,
    });

    switch (action) {
      case 'pause':
      case 'resume':
        setAds(prev => prev.map(ad => 
          ad.id === adId 
            ? { ...ad, status: action === 'pause' ? 'paused' : 'active' }
            : ad
        ));
        break;
      case 'edit':
        // Navigate to edit screen
        break;
      case 'view':
        navigation.navigate('AdDetails' as never, { adId } as never);
        break;
    }
  };

  const filteredAds = ads.filter(ad => {
    switch (selectedTab) {
      case 'active':
        return ad.status === 'active' || ad.status === 'paused';
      case 'completed':
        return ad.status === 'completed';
      default:
        return true;
    }
  });

  const totalStats = ads.reduce((acc, ad) => ({
    totalSpent: acc.totalSpent + ad.totalCost,
    totalViews: acc.totalViews + ad.views,
    totalClicks: acc.totalClicks + ad.clicks,
    totalConversions: acc.totalConversions + ad.conversions,
  }), { totalSpent: 0, totalViews: 0, totalClicks: 0, totalConversions: 0 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      case 'pending': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900';
      case 'paused': return 'bg-yellow-900';
      case 'completed': return 'bg-gray-900';
      case 'pending': return 'bg-blue-900';
      default: return 'bg-gray-900';
    }
  };

  return (
    <Animated.View style={[tw`flex-1 bg-black`, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>My Ads</Text>
        <TouchableOpacity onPress={handleCreateAd} style={tw`p-2`}>
          <PlusIcon size={24} color="#A855F7" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Stats */}
        <View style={tw`px-4 mb-6`}>
          <Text style={tw`text-white text-xl font-bold mb-4`}>Overview</Text>
          
          <View style={tw`flex-row flex-wrap`}>
            <View style={tw`bg-gray-900 rounded-xl p-4 mr-2 mb-2 flex-1 min-w-0`}>
              <Text style={tw`text-gray-400 text-xs`}>Total Spent</Text>
              <Text style={tw`text-white text-lg font-bold`}>
                ${totalStats.totalSpent}
              </Text>
            </View>
            
            <View style={tw`bg-gray-900 rounded-xl p-4 ml-2 mb-2 flex-1 min-w-0`}>
              <Text style={tw`text-gray-400 text-xs`}>Total Views</Text>
              <Text style={tw`text-white text-lg font-bold`}>
                {totalStats.totalViews.toLocaleString()}
              </Text>
            </View>
            
            <View style={tw`bg-gray-900 rounded-xl p-4 mr-2 flex-1 min-w-0`}>
              <Text style={tw`text-gray-400 text-xs`}>Total Clicks</Text>
              <Text style={tw`text-white text-lg font-bold`}>
                {totalStats.totalClicks}
              </Text>
            </View>
            
            <View style={tw`bg-gray-900 rounded-xl p-4 ml-2 flex-1 min-w-0`}>
              <Text style={tw`text-gray-400 text-xs`}>Conversions</Text>
              <Text style={tw`text-white text-lg font-bold`}>
                {totalStats.totalConversions}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={tw`px-4 mb-6`}>
          <View style={tw`flex-row bg-gray-900 rounded-xl p-1`}>
            {['all', 'active', 'completed'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab as any)}
                style={[
                  tw`flex-1 py-2 px-4 rounded-lg`,
                  selectedTab === tab ? tw`bg-purple-500` : tw`bg-transparent`,
                ]}
              >
                <Text
                  style={[
                    tw`text-center font-semibold capitalize`,
                    selectedTab === tab ? tw`text-white` : tw`text-gray-400`,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ads List */}
        <View style={tw`px-4`}>
          {filteredAds.length === 0 ? (
            <View style={tw`bg-gray-900 rounded-xl p-8 items-center`}>
              <Text style={tw`text-gray-400 text-lg mb-4`}>No ads found</Text>
              <TouchableOpacity
                onPress={handleCreateAd}
                style={tw`bg-purple-500 rounded-xl py-3 px-6`}
              >
                <Text style={tw`text-white font-bold`}>Create Your First Ad</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredAds.map((ad) => (
              <View key={ad.id} style={tw`bg-gray-900 rounded-xl p-4 mb-4`}>
                {/* Ad Header */}
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white text-lg font-bold`}>
                      {ad.title}
                    </Text>
                    <View style={tw`flex-row items-center mt-1`}>
                      <View style={[tw`px-2 py-1 rounded`, getStatusBg(ad.status)]}>
                        <Text style={[tw`text-xs font-bold`, getStatusColor(ad.status)]}>
                          {ad.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={tw`text-gray-400 text-xs ml-2`}>
                        {ad.type === 'map_marker' ? 'Map Marker' : 'Story Carousel'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={tw`flex-row`}>
                    {ad.status === 'active' && (
                      <TouchableOpacity
                        onPress={() => handleAdAction(ad.id, 'pause')}
                        style={tw`bg-yellow-500 rounded-full p-2 mr-2`}
                      >
                        <PauseIcon size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    
                    {ad.status === 'paused' && (
                      <TouchableOpacity
                        onPress={() => handleAdAction(ad.id, 'resume')}
                        style={tw`bg-green-500 rounded-full p-2 mr-2`}
                      >
                        <PlayIcon size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => handleAdAction(ad.id, 'view')}
                      style={tw`bg-purple-500 rounded-full p-2`}
                    >
                      <EyeIcon size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Performance Metrics */}
                <View style={tw`flex-row justify-between mb-3`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white text-lg font-bold`}>
                      {ad.views.toLocaleString()}
                    </Text>
                    <Text style={tw`text-gray-400 text-xs`}>Views</Text>
                  </View>
                  
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white text-lg font-bold`}>
                      {ad.clicks}
                    </Text>
                    <Text style={tw`text-gray-400 text-xs`}>Clicks</Text>
                  </View>
                  
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white text-lg font-bold`}>
                      {ad.ctr}%
                    </Text>
                    <Text style={tw`text-gray-400 text-xs`}>CTR</Text>
                  </View>
                  
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white text-lg font-bold`}>
                      ${ad.cpc}
                    </Text>
                    <Text style={tw`text-gray-400 text-xs`}>CPC</Text>
                  </View>
                </View>

                {/* Budget & Duration */}
                <View style={tw`flex-row justify-between items-center pt-3 border-t border-gray-700`}>
                  <View>
                    <Text style={tw`text-gray-400 text-xs`}>Budget</Text>
                    <Text style={tw`text-green-400 text-sm font-bold`}>
                      ${ad.totalCost}
                    </Text>
                  </View>
                  
                  <View>
                    <Text style={tw`text-gray-400 text-xs`}>Duration</Text>
                    <Text style={tw`text-white text-sm font-bold`}>
                      {ad.duration} day{ad.duration > 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  {ad.status === 'active' && (
                    <View>
                      <Text style={tw`text-gray-400 text-xs`}>Remaining</Text>
                      <Text style={tw`text-blue-400 text-sm font-bold`}>
                        {ad.daysRemaining} day{ad.daysRemaining > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Create New Ad CTA */}
        <View style={tw`px-4 py-8`}>
          <TouchableOpacity
            onPress={handleCreateAd}
            style={tw`bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl py-4 px-6 flex-row items-center justify-center`}
          >
            <PlusIcon size={20} color="#FFFFFF" />
            <Text style={tw`text-white font-bold text-lg ml-2`}>
              Create New Ad
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default AdDashboard;
