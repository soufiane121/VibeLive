import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { GlobalColors } from '../styles/GlobalColors';
import { useGetTransactionHistoryQuery, TransactionItem } from '../../features/settings/SettingsSliceApi';

const colors = GlobalColors.Account;

const TransactionRow = ({ item }: { item: TransactionItem }) => {
  const isPurchase = item.type === 'purchase';
  const iconName = isPurchase ? 'arrow-down-circle' : 'clock';
  const iconColor = isPurchase ? colors.success : colors.gaugeActive;

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(item.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconBox, { backgroundColor: iconColor + '15' }]}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.txContent}>
        <Text style={styles.txTitle}>{item.title}</Text>
        <Text style={styles.txDesc}>{item.description}</Text>
        <Text style={styles.txDate}>
          {formattedDate} at {formattedTime}
        </Text>
      </View>
      <View style={styles.txRight}>
        {isPurchase ? (
          <>
            <Text style={styles.txAmount}>-${item.amount.toFixed(2)}</Text>
            <View style={[styles.txStatusBadge, { backgroundColor: colors.successSurface }]}>
              <Text style={[styles.txStatusText, { color: colors.success }]}>
                {item.status === 'completed' ? 'Completed' : item.status}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.txAmount, { color: colors.textMuted }]}>Free</Text>
            <View style={[styles.txStatusBadge, { backgroundColor: colors.accentSurface }]}>
              <Text style={[styles.txStatusText, { color: colors.accent }]}>Active</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Feather name="inbox" size={48} color={colors.textMuted} />
    <Text style={styles.emptyTitle}>No Transactions Yet</Text>
    <Text style={styles.emptyDesc}>
      Your purchase history and stream usage will appear here.
    </Text>
  </View>
);

const TransactionHistory = () => {
  const navigation = useNavigation<any>();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const userId = currentUser?._id;

  const { data, isLoading } = useGetTransactionHistoryQuery(userId, {
    skip: !userId,
  });

  const transactions = data?.data || [];

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

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.titleLabel}>MINUTES & BILLING</Text>
        <Text style={styles.titleText}>Transaction History</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryValue}>
                  $
                  {transactions
                    .filter(t => t.type === 'purchase')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Minutes Purchased</Text>
                <Text style={styles.summaryValue}>
                  {transactions
                    .filter(t => t.type === 'purchase')
                    .reduce((sum, t) => sum + (t.minutesAllowed || 0), 0)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{transactions.length}</Text>
              </View>
            </View>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionList}>
            {transactions.map((tx, idx) => (
              <React.Fragment key={tx.id}>
                <TransactionRow item={tx} />
                {idx < transactions.length - 1 && <View style={styles.txDivider} />}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default TransactionHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.separator,
  },

  // Transaction List
  transactionList: {
    marginHorizontal: 16,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  txDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  txStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  txDivider: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: 68,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
