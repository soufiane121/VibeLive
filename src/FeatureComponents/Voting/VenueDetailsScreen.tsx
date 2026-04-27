import React, {useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {GlobalColors} from '../../styles/GlobalColors';
import {useGetVenueDetailQuery} from '../../../features/voting/VotingApi';

const VenueDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {venueId} = route.params || {};

  const {data, isLoading, error} = useGetVenueDetailQuery(venueId, {
    skip: !venueId,
  });

  const colors = GlobalColors.VenueDetailsScreen;

  if (isLoading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  if (error || !data?.venue) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={styles.errorText}>Failed to load venue details.</Text>
        <TouchableOpacity style={styles.backButtonCenter} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {venue} = data;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Venue Details</Text>
        <View style={styles.placeholderSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Venue Info Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.centerIcon}>🏛️</Text>
          </View>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.categoryText}>{venue.category?.replace(/_/g, ' ')}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{venue.currentVibeScore}</Text>
              <Text style={styles.statLabel}>Vibe Score</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>🔥 {venue.hotVotes}</Text>
              <Text style={styles.statLabel}>Hot</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>💀 {venue.deadVotes}</Text>
              <Text style={styles.statLabel}>Dead</Text>
            </View>
          </View>
        </View>

        {/* Additional sections can go here in the future */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60, // approximate status bar height
    paddingBottom: 16,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backButtonBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.backButtonBorder,
  },
  backIcon: {
    color: colors.primaryText,
    fontSize: 20,
  },
  headerTitle: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderSpace: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.iconContainerBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.iconContainerBorder,
    marginBottom: 16,
  },
  centerIcon: {
    fontSize: 28,
  },
  venueName: {
    color: colors.primaryText,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryText: {
    color: colors.secondaryText,
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.statsBorder,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.secondaryText,
    fontSize: 12,
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
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VenueDetailsScreen;
