import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, BanIcon, PersonIcon, CheckmarkIcon, InformationCircleIcon } from '../UIComponents/Icons';
import { useAnalytics } from '../Hooks/useAnalytics';
import {
  useGetBlockedUsersQuery,
  useUnblockUserMutation,
  BlockedUser,
} from '../../features/settings/SettingsSliceApi';

const BlockedUsers = () => {
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  
  const {data: blockedUsersData, isLoading: loading, refetch} = useGetBlockedUsersQuery();
  const [unblockUser, {isLoading: unblockLoading}] = useUnblockUserMutation();
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  
  const blockedUsers = blockedUsersData?.blockedUsers || [];

  useEffect(() => {
    trackEvent('blocked_users_opened', {
      screen_name: 'BlockedUsers',
      user_id: currentUser?._id,
    });
  }, []);

  const handleUnblockUser = (blockedUser: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${blockedUser.userId.firstName} ${blockedUser.userId.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: () => handleUnblock(blockedUser.userId._id),
        },
      ]
    );
  };

  const handleUnblock = async (userId: string) => {
    try {
      setUnblockingUserId(userId);
      const response = await unblockUser({userId}).unwrap();
      
      if (response.success) {
        Alert.alert('Success', 'User unblocked successfully');
        refetch(); // Refresh the blocked users list
        
        trackEvent('user_unblocked', {
          unblocked_user_id: userId,
          user_id: currentUser?._id,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user');
    } finally {
      setUnblockingUserId(null);
    }
  };

  const BlockedUserItem = ({ blockedUser }: { blockedUser: BlockedUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userLeft}>
        <View style={styles.avatarContainer}>
          {blockedUser.userId.profilePicture ? (
            <Image 
              source={{ uri: blockedUser.userId.profilePicture }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <PersonIcon size={24} color="#9ca3af" />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {blockedUser.userId.firstName} {blockedUser.userId.lastName}
          </Text>
          <Text style={styles.userHandle}>@{blockedUser.userId.userName}</Text>
          <Text style={styles.blockReason}>
            Blocked: {blockedUser.reason}
          </Text>
          <Text style={styles.blockDate}>
            {new Date(blockedUser.blockedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(blockedUser)}
        disabled={unblockingUserId === blockedUser.userId._id || unblockLoading}
      >
        {(unblockingUserId === blockedUser.userId._id || unblockLoading) ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <CheckmarkIcon size={16} color="#fff" />
            <Text style={styles.unblockText}>Unblock</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronBackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {blockedUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BanIcon size={64} color="#374151" />
              <Text style={styles.emptyTitle}>No Blocked Users</Text>
              <Text style={styles.emptyDescription}>
                You haven't blocked any users yet. When you block someone, they won't be able to see your profile or interact with you.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {blockedUsers.length} Blocked User{blockedUsers.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.sectionDescription}>
                  Blocked users can't see your profile, send you messages, or interact with your content.
                </Text>
              </View>

              {blockedUsers.map((blockedUser) => (
                <BlockedUserItem
                  key={blockedUser.userId._id}
                  blockedUser={blockedUser}
                />
              ))}

              <View style={styles.infoSection}>
                <InformationCircleIcon size={20} color="#8b5cf6" />
                <Text style={styles.infoText}>
                  When you unblock someone, they'll be able to see your profile and interact with you again. They won't be notified that you've unblocked them.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default BlockedUsers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 4,
  },
  blockReason: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  blockDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  unblockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 15,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});
