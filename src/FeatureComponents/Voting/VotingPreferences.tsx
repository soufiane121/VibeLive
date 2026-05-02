import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  useGetVotingPreferencesQuery,
  useUpdateVotingPreferencesMutation,
} from '../../../features/voting/VotingApi';
import useTranslation from '../../Hooks/useTranslation';

const RADIUS_OPTIONS = [3, 5, 10, 15, 25, 50];
const FREQUENCY_OPTIONS = [1, 2, 3, 5, 10];
const COOLDOWN_OPTIONS = [10, 15, 30, 45, 60, 120];

const VotingPreferences = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const {data, isLoading} = useGetVotingPreferencesQuery();
  const [updatePrefs, {isLoading: isUpdating}] =
    useUpdateVotingPreferencesMutation();

  const [enabled, setEnabled] = useState(true);
  const [radius, setRadius] = useState(5);
  const [maxPerNight, setMaxPerNight] = useState(3);
  const [cooldown, setCooldown] = useState(30);
  const [quietStart, setQuietStart] = useState('04:00');
  const [quietEnd, setQuietEnd] = useState('18:00');
  const [optOut, setOptOut] = useState(false);

  useEffect(() => {
    if (data?.preferences) {
      const p = data.preferences;
      setEnabled(p.enabled);
      setRadius(p.notificationRadius);
      setMaxPerNight(p.maxNotificationsPerNight);
      setCooldown(p.cooldownMinutes);
      setQuietStart(p.quietHoursStart);
      setQuietEnd(p.quietHoursEnd);
      setOptOut(p.permanentOptOut);
    }
  }, [data]);

  const handleSave = useCallback(async () => {
    try {
      await updatePrefs({
        enabled,
        notificationRadius: radius,
        maxNotificationsPerNight: maxPerNight,
        cooldownMinutes: cooldown,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
        permanentOptOut: optOut,
      }).unwrap();

      Alert.alert(t('common.saved'), t('voting.preferencesUpdated'));
    } catch (err) {
      Alert.alert(t('common.error'), t('voting.failedUpdatePreferences'));
    }
  }, [enabled, radius, maxPerNight, cooldown, quietStart, quietEnd, optOut, updatePrefs]);

  const handleOptOut = useCallback(() => {
    if (!optOut) {
      Alert.alert(
        t('voting.permanentOptOut'),
        t('voting.permanentOptOutDesc'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('voting.optOut'),
            style: 'destructive',
            onPress: () => {
              setOptOut(true);
              setEnabled(false);
            },
          },
        ],
      );
    } else {
      setOptOut(false);
      setEnabled(true);
    }
  }, [optOut]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00FFFF" size="large" style={{marginTop: 100}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('voting.votingPreferences')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isUpdating}
          style={styles.saveBtn}>
          {isUpdating ? (
            <ActivityIndicator color="#00FFFF" size="small" />
          ) : (
            <Text style={styles.saveText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable/Disable */}
        <View style={styles.row}>
          <View style={{flex: 1}}>
            <Text style={styles.rowTitle}>{t('voting.venueNotifications')}</Text>
            <Text style={styles.rowSub}>{t('voting.venueNotificationsDesc')}</Text>
          </View>
          <Switch
            value={enabled && !optOut}
            onValueChange={val => {
              setEnabled(val);
              if (val) setOptOut(false);
            }}
            trackColor={{false: '#333', true: '#00FFFF50'}}
            thumbColor={enabled && !optOut ? '#00FFFF' : '#666'}
          />
        </View>

        {/* Radius */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voting.detectionRadius')}</Text>
          <Text style={styles.sectionSub}>
            {t('voting.detectionRadiusDesc', { radius })}
          </Text>
          <View style={styles.optionRow}>
            {RADIUS_OPTIONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.optionBtn, radius === r && styles.optionBtnActive]}
                onPress={() => setRadius(r)}>
                <Text
                  style={[
                    styles.optionText,
                    radius === r && styles.optionTextActive,
                  ]}>
                  {r}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max per night */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voting.maxNotifications')}</Text>
          <Text style={styles.sectionSub}>
            {t('voting.maxNotificationsDesc', { count: maxPerNight })}
          </Text>
          <View style={styles.optionRow}>
            {FREQUENCY_OPTIONS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.optionBtn, maxPerNight === f && styles.optionBtnActive]}
                onPress={() => setMaxPerNight(f)}>
                <Text
                  style={[
                    styles.optionText,
                    maxPerNight === f && styles.optionTextActive,
                  ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cooldown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voting.cooldown')}</Text>
          <Text style={styles.sectionSub}>
            {t('voting.cooldownDesc', { minutes: cooldown })}
          </Text>
          <View style={styles.optionRow}>
            {COOLDOWN_OPTIONS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.optionBtn, cooldown === c && styles.optionBtnActive]}
                onPress={() => setCooldown(c)}>
                <Text
                  style={[
                    styles.optionText,
                    cooldown === c && styles.optionTextActive,
                  ]}>
                  {c >= 60 ? `${c / 60}h` : `${c}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voting.quietHours')}</Text>
          <Text style={styles.sectionSub}>
            {t('voting.quietHoursDesc', { start: quietStart, end: quietEnd })}
          </Text>
          <View style={styles.quietRow}>
            <View style={styles.quietInput}>
              <Text style={styles.quietLabel}>{t('voting.start')}</Text>
              <TouchableOpacity
                style={styles.quietBtn}
                onPress={() => {
                  const hours = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];
                  const currentIdx = hours.indexOf(quietStart);
                  const nextIdx = (currentIdx + 1) % hours.length;
                  setQuietStart(hours[nextIdx]);
                }}>
                <Text style={styles.quietBtnText}>{quietStart}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.quietDash}>—</Text>
            <View style={styles.quietInput}>
              <Text style={styles.quietLabel}>{t('voting.end')}</Text>
              <TouchableOpacity
                style={styles.quietBtn}
                onPress={() => {
                  const hours = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
                  const currentIdx = hours.indexOf(quietEnd);
                  const nextIdx = (currentIdx + 1) % hours.length;
                  setQuietEnd(hours[nextIdx]);
                }}>
                <Text style={styles.quietBtnText}>{quietEnd}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Opt Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.optOutBtn} onPress={handleOptOut}>
            <Text style={[styles.optOutText, optOut && {color: '#FF4500'}]}>
              {optOut ? t('voting.optedOut') : t('voting.permanentlyOptOut')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.optOutSub}>
            {optOut
              ? t('voting.optedOutDesc')
              : t('voting.permanentlyOptOutDesc')}
          </Text>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0D0D0D'},
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backText: {color: '#FFF', fontSize: 20},
  headerTitle: {flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700'},
  saveBtn: {paddingHorizontal: 16, paddingVertical: 8},
  saveText: {color: '#00FFFF', fontSize: 15, fontWeight: '700'},
  content: {padding: 16},
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E',
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  rowTitle: {color: '#FFF', fontSize: 16, fontWeight: '600'},
  rowSub: {color: '#888', fontSize: 12, marginTop: 2},
  section: {marginBottom: 20},
  sectionTitle: {color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 4},
  sectionSub: {color: '#888', fontSize: 12, marginBottom: 12},
  optionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: 'transparent',
  },
  optionBtnActive: {borderColor: '#00FFFF', backgroundColor: '#00FFFF15'},
  optionText: {color: '#888', fontSize: 14, fontWeight: '600'},
  optionTextActive: {color: '#00FFFF'},
  quietRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  quietInput: {flex: 1},
  quietLabel: {color: '#888', fontSize: 12, marginBottom: 6},
  quietBtn: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  quietBtnText: {color: '#FFF', fontSize: 16, fontWeight: '600'},
  quietDash: {color: '#888', fontSize: 20, marginTop: 18},
  optOutBtn: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  optOutText: {color: '#888', fontSize: 14, fontWeight: '600'},
  optOutSub: {color: '#666', fontSize: 12, textAlign: 'center', marginTop: 8},
});

export default VotingPreferences;
