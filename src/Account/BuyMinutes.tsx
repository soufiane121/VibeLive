import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { GlobalColors } from '../styles/GlobalColors';
import { useAnalytics } from '../Hooks/useAnalytics';
import useTranslation from '../Hooks/useTranslation';
import { useGetAccountProfileQuery } from '../../features/settings/SettingsSliceApi';
import { useBoostStreamMutation } from '../../features/registrations/LoginSliceApi';

const colors = GlobalColors.Account;

// ---------- Tier definitions ----------
export interface MinutesTier {
  id: string;
  minutes: number;
  price: number;
  perMinute: string;
  badgeKey?: string;
  badgeColor?: string;
  savingsKey?: string;
}

export const MINUTES_TIERS: MinutesTier[] = [
  {
    id: 'basic',
    minutes: 30,
    price: 2.99,
    perMinute: '10.0¢',
  },
  // {
  //   id: 'premium',
  //   minutes: 60,
  //   price: 4.99,
  //   perMinute: '8.3¢',
  //   badgeKey: 'account.tierMostPopular',
  //   badgeColor: colors.gaugeActive,
  // },
  {
    id: 'ultimate',
    minutes: 120,
    price: 7.99,
    perMinute: '7¢',
    badgeKey: 'account.tierBestValue',
    badgeColor: colors.success,
    savingsKey: 'account.save25',
  },
  {
    id: 'power',
    minutes: 300,
    price: 14.99,
    perMinute: '5¢',
    badgeKey: 'account.tierPowerUser',
    badgeColor: colors.accent,
    savingsKey: 'account.save40',
  },
];

const BENEFIT_KEYS = [
  'account.benefitNeverExpire',
  'account.benefitAnyCategory',
  'account.benefitHdQuality',
  'account.benefitPrioritySupport',
];

// ---------- Props for reusability ----------
export interface BuyMinutesProps {
  /** If true, renders inline without SafeAreaView/header (for embedding in other screens) */
  embedded?: boolean;
  /** Called after successful purchase */
  onPurchaseComplete?: () => void;
  /** Override available balance display */
  balanceOverride?: number;
}

// ---------- Buy Minutes Component ----------
const BuyMinutesContent = ({ embedded, onPurchaseComplete, balanceOverride }: BuyMinutesProps) => {
  const navigation = useNavigation<any>();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const userId = currentUser?._id;

  const { data: profileData } = useGetAccountProfileQuery(userId, { skip: !userId });
  const [boostStream, { isLoading: isPurchasing }] = useBoostStreamMutation();

  const balance = balanceOverride ?? profileData?.data?.streamingMinutes?.balance ?? 0;
  const balanceHours = Math.floor(balance / 60);
  const balanceRemainder = balance % 60;
  const balanceLabel = balanceHours > 0
    ? t('account.minutesOfStreaming', { hours: balanceHours, minutes: balanceRemainder })
    : t('account.minutesOfStreamingShort', { count: balance });

  const [selectedTier, setSelectedTier] = useState<string>('premium');
  const currentTier = MINUTES_TIERS.find(tier => tier.id === selectedTier)!;

  const handlePurchase = async () => {
    trackEvent('boost_tier_selected', {
      tier: selectedTier,
      price: currentTier.price,
      user_id: userId,
    });

    try {
      const transactionId = `iap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await boostStream({
        transactionId,
        tier: selectedTier,
        duration: currentTier.minutes,
        price: currentTier.price,
        category: 'minutes_purchase',
        title: t('account.minutesPack', { minutes: currentTier.minutes }),
      }).unwrap();

      trackEvent('boost_purchased', {
        tier: selectedTier,
        price: currentTier.price,
        minutes: currentTier.minutes,
        user_id: userId,
      });

      Alert.alert(
        t('account.purchaseSuccessTitle'),
        t('account.purchaseSuccessMessage', { minutes: currentTier.minutes }),
        [{ text: t('common.ok'), onPress: () => onPurchaseComplete?.() || navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert(t('account.purchaseFailed'), t('account.purchaseFailedMessage'));
    }
  };

  return (
    <>
      {/* Title (only when not embedded) */}
      {!embedded && (
        <View style={styles.titleSection}>
          <Text style={styles.titleLabel}>{t('account.topUpYourBalance')}</Text>
          <Text style={styles.titleText}>{t('account.buyMinutesTitle')}</Text>
        </View>
      )}

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Feather name="clock" size={20} color={colors.gaugeActive} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.balanceNumber}>{t('account.minutesLabel', { count: balance })}</Text>
          <Text style={styles.balanceSubtext}>{balanceLabel}</Text>
        </View>
      </View>

      {/* Tier Cards */}
      <View style={styles.tiersContainer}>
        {MINUTES_TIERS.map(tier => {
          const isSelected = selectedTier === tier.id;
          return (
            <TouchableOpacity
              key={tier.id}
              style={[styles.tierCard, isSelected && styles.tierCardSelected]}
              onPress={() => setSelectedTier(tier.id)}
              activeOpacity={0.7}
            >
              {/* Radio */}
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>

              {/* Content */}
              <View style={styles.tierContent}>
                <View style={styles.tierRow}>
                  <Text style={[styles.tierMinutes, isSelected && styles.tierMinutesSelected]}>
                    {tier.minutes} {t('account.minAbbrev')}
                  </Text>
                  {tier.badgeKey && (
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: tier.badgeColor + '20', borderColor: tier.badgeColor + '40' },
                      ]}
                    >
                      <Text style={[styles.tierBadgeText, { color: tier.badgeColor }]}>
                        {t(tier.badgeKey)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tierPerMinute}>{tier.perMinute} {t('account.perMin')}</Text>
                {tier.savingsKey && (
                  <Text style={[styles.tierSavings, { color: tier.badgeColor }]}>
                    {t(tier.savingsKey)}
                  </Text>
                )}
              </View>

              {/* Price */}
              <Text style={[styles.tierPrice, isSelected && styles.tierPriceSelected]}>
                ${tier.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsLabel}>{t('account.includedWithEveryPack')}</Text>
        {BENEFIT_KEYS.map((key, idx) => (
          <View key={idx} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginRight: 10 }} />
            <Text style={styles.benefitText}>{t(key)}</Text>
          </View>
        ))}
      </View>

      {/* Purchase Button */}
      <View style={styles.purchaseSection}>
        <TouchableOpacity
          style={[styles.purchaseBtn, isPurchasing && { opacity: 0.6 }]}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.purchaseBtnText}>
              {t('account.buyButtonLabel', { minutes: currentTier.minutes, price: currentTier.price.toFixed(2) })}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

// ---------- Full Screen Wrapper ----------
const BuyMinutes = (props: BuyMinutesProps) => {
  const navigation = useNavigation<any>();

  if (props.embedded) {
    return <BuyMinutesContent {...props} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <BuyMinutesContent {...props} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BuyMinutes;

// Also export the content component for reuse in boost stream flow
export { BuyMinutesContent };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollView: {
    flex: 1,
  },

  // Title
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: 16,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
  },
  balanceNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  balanceSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Tier Cards
  tiersContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 28,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  tierCardSelected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSubtle,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  tierContent: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierMinutes: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  tierMinutesSelected: {
    color: colors.accent,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tierPerMinute: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tierSavings: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tierPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  tierPriceSelected: {
    color: colors.accent,
  },

  // Benefits
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  benefitsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Purchase Button
  purchaseSection: {
    paddingHorizontal: 16,
  },
  purchaseBtn: {
    backgroundColor: colors.primaryButton,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryButtonText,
  },
});
