import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  useGetVenueDashboardQuery,
  usePurchaseVenueBoostMutation,
} from '../../../features/voting/VotingApi';

const VenueOwnerDashboard = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venueId: string = route.params?.venueId;

  const {data, isLoading, refetch} = useGetVenueDashboardQuery(venueId, {
    skip: !venueId,
    pollingInterval: 30000,
  });
  const [purchaseBoost, {isLoading: isPurchasing}] =
    usePurchaseVenueBoostMutation();

  const vibeColor = useMemo(() => {
    const score = data?.venue?.currentVibeScore || 0;
    if (score > 50) return '#FF4500';
    if (score > 20) return '#FFA500';
    if (score > 0) return '#00FFFF';
    if (score === 0) return '#888';
    return '#4169E1';
  }, [data?.venue?.currentVibeScore]);

  const handlePurchaseBoost = (tier: string) => {
    Alert.alert(
      'Purchase Boost',
      `Activate ${tier} boost for this venue?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              await purchaseBoost({
                venueId,
                tier,
                durationHours: tier === 'basic' ? 2 : tier === 'premium' ? 6 : 12,
              }).unwrap();
              Alert.alert('Boost Activated!', 'Your venue is now boosted.');
              refetch();
            } catch (err) {
              Alert.alert('Error', 'Failed to purchase boost.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00FFFF" size="large" style={{marginTop: 100}} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Unable to load dashboard data.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {venue, tonight, weeklyStats, vibeShifts} = data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>{venue.name}</Text>
          <Text style={styles.headerSub}>Owner Dashboard</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vibe Score Hero */}
        <View style={[styles.heroCard, {borderColor: vibeColor}]}>
          <Text style={styles.heroLabel}>Current Vibe Score</Text>
          <Text style={[styles.heroScore, {color: vibeColor}]}>
            {venue.currentVibeScore > 0 ? '+' : ''}{venue.currentVibeScore}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>🔥 {venue.hotVotes}</Text>
              <Text style={styles.heroStatLabel}>Hot</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>💀 {venue.deadVotes}</Text>
              <Text style={styles.heroStatLabel}>Dead</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>📊 {venue.totalVotesTonight}</Text>
              <Text style={styles.heroStatLabel}>Tonight</Text>
            </View>
          </View>
        </View>

        {/* Vote Velocity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vote Velocity (Last 30 min)</Text>
          <View style={styles.velocityRow}>
            <View style={styles.velocityStat}>
              <Text style={styles.velocityValue}>{tonight.velocity.rate.toFixed(1)}</Text>
              <Text style={styles.velocityLabel}>votes/min</Text>
            </View>
            <View style={[styles.trendBadge, {
              backgroundColor: tonight.velocity.trend === 'heating_up' ? '#FF450020' :
                tonight.velocity.trend === 'cooling_down' ? '#4169E120' : '#88888820',
            }]}>
              <Text style={[styles.trendText, {
                color: tonight.velocity.trend === 'heating_up' ? '#FF4500' :
                  tonight.velocity.trend === 'cooling_down' ? '#4169E1' : '#888',
              }]}>
                {tonight.velocity.trend === 'heating_up' ? '📈 Heating Up' :
                  tonight.velocity.trend === 'cooling_down' ? '📉 Cooling Down' :
                  tonight.velocity.trend === 'warm' ? '🌡️ Warm' : '➡️ Stable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Hourly Breakdown */}
        {tonight.hourlyBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tonight's Hourly Breakdown</Text>
            {tonight.hourlyBreakdown.map((hour) => {
              const total = hour.hot + hour.dead;
              const hotPct = total > 0 ? (hour.hot / total) * 100 : 50;
              return (
                <View key={hour._id} style={styles.hourRow}>
                  <Text style={styles.hourLabel}>
                    {hour._id > 12 ? hour._id - 12 : hour._id}
                    {hour._id >= 12 ? 'PM' : 'AM'}
                  </Text>
                  <View style={styles.hourBar}>
                    <View style={[styles.hourBarHot, {width: `${hotPct}%`}]} />
                    <View style={[styles.hourBarDead, {width: `${100 - hotPct}%`}]} />
                  </View>
                  <Text style={styles.hourCount}>{total}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Weekly Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Stats</Text>
          <View style={styles.weeklyRow}>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyValue}>{weeklyStats.totalVotes}</Text>
              <Text style={styles.weeklyLabel}>Total Votes</Text>
            </View>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyValue}>{venue.totalLifetimeVotes}</Text>
              <Text style={styles.weeklyLabel}>All Time</Text>
            </View>
          </View>
        </View>

        {/* Vibe Shifts */}
        {vibeShifts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Vibe Shifts</Text>
            {vibeShifts.slice(0, 5).map((shift: any, idx: number) => (
              <View key={idx} style={styles.shiftRow}>
                <Text style={styles.shiftText}>
                  {shift.from} → {shift.to}
                </Text>
                <Text style={styles.shiftConfidence}>
                  {(shift.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Promotion Boost */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promotion Boost</Text>
          {venue.promotionBoost?.isActive ? (
            <View style={styles.boostActive}>
              <Text style={styles.boostActiveText}>
                ⚡ {venue.promotionBoost.boostTier.toUpperCase()} boost active
              </Text>
              <Text style={styles.boostExpiry}>
                {venue.promotionBoost.boostMultiplier}x visibility
              </Text>
            </View>
          ) : (
            <View style={styles.boostOptions}>
              {[
                {tier: 'basic', label: 'Basic', price: '$9.99', mult: '2x', color: '#00FFFF'},
                {tier: 'premium', label: 'Premium', price: '$24.99', mult: '5x', color: '#FF69B4'},
                {tier: 'featured', label: 'Featured', price: '$49.99', mult: '10x', color: '#FFD700'},
              ].map(opt => (
                <TouchableOpacity
                  key={opt.tier}
                  style={[styles.boostBtn, {borderColor: opt.color}]}
                  onPress={() => handlePurchaseBoost(opt.tier)}
                  disabled={isPurchasing}>
                  <Text style={[styles.boostBtnLabel, {color: opt.color}]}>{opt.label}</Text>
                  <Text style={styles.boostBtnMult}>{opt.mult}</Text>
                  <Text style={styles.boostBtnPrice}>{opt.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0D0D0D'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backText: {color: '#FFF', fontSize: 20},
  headerTitle: {color: '#FFF', fontSize: 18, fontWeight: '700'},
  headerSub: {color: '#888', fontSize: 12, marginTop: 1},
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshText: {color: '#00FFFF', fontSize: 20},
  scrollContent: {padding: 16},
  heroCard: {
    backgroundColor: '#1A1A2E', borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 2, marginBottom: 16,
  },
  heroLabel: {color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1},
  heroScore: {fontSize: 56, fontWeight: '800', marginVertical: 8},
  heroRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  heroStat: {alignItems: 'center', flex: 1},
  heroStatValue: {color: '#FFF', fontSize: 16, fontWeight: '600'},
  heroStatLabel: {color: '#888', fontSize: 11, marginTop: 4},
  heroDivider: {width: 1, height: 30, backgroundColor: '#333'},
  card: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardTitle: {color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 12},
  velocityRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  velocityStat: {alignItems: 'center'},
  velocityValue: {color: '#FFF', fontSize: 28, fontWeight: '800'},
  velocityLabel: {color: '#888', fontSize: 12, marginTop: 2},
  trendBadge: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12},
  trendText: {fontSize: 13, fontWeight: '600'},
  hourRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  hourLabel: {color: '#888', fontSize: 12, width: 45},
  hourBar: {flex: 1, flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginHorizontal: 8},
  hourBarHot: {backgroundColor: '#FF4500', height: '100%'},
  hourBarDead: {backgroundColor: '#4169E1', height: '100%'},
  hourCount: {color: '#888', fontSize: 12, width: 30, textAlign: 'right'},
  weeklyRow: {flexDirection: 'row'},
  weeklyStat: {flex: 1, alignItems: 'center'},
  weeklyValue: {color: '#FFF', fontSize: 28, fontWeight: '800'},
  weeklyLabel: {color: '#888', fontSize: 12, marginTop: 4},
  shiftRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  shiftText: {color: '#CCC', fontSize: 14, flex: 1},
  shiftConfidence: {color: '#00FFFF', fontSize: 13, fontWeight: '600'},
  boostActive: {
    backgroundColor: '#FFD70015', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  boostActiveText: {color: '#FFD700', fontSize: 16, fontWeight: '700'},
  boostExpiry: {color: '#888', fontSize: 13, marginTop: 4},
  boostOptions: {flexDirection: 'row', gap: 8},
  boostBtn: {
    flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center',
  },
  boostBtnLabel: {fontSize: 13, fontWeight: '700'},
  boostBtnMult: {color: '#FFF', fontSize: 20, fontWeight: '800', marginVertical: 4},
  boostBtnPrice: {color: '#888', fontSize: 12},
  emptyState: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {color: '#888', fontSize: 15},
  retryBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#1A1A2E', borderRadius: 12,
  },
  retryText: {color: '#00FFFF', fontSize: 14, fontWeight: '600'},
});

export default VenueOwnerDashboard;
