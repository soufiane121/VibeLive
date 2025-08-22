import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CommonMaterialCommunityIcons } from '../../../UIComponents/Icons';

const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
  primary: '#4f46e5',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  error: '#ef4444',
  border: '#374151',
};

interface EventPromotionProps {
  formData: {
    promotion: {
      isPromoted: boolean;
      type: 'none' | 'map' | 'list' | 'both';
      duration: number;
      totalCost: number;
    };
  };
  onPromotionChange: (type: 'none' | 'map' | 'list' | 'both', duration?: number) => void;
  calculatePromotionCost: (type: string, duration: number) => number;
}

const EventPromotion: React.FC<EventPromotionProps> = ({
  formData,
  onPromotionChange,
  calculatePromotionCost,
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Promote Your Event</Text>
      <Text style={styles.stepSubtitle}>Boost visibility and reach more attendees</Text>
      
      <View style={styles.promotionOptions}>
        <TouchableOpacity
          style={[styles.promotionOption, formData.promotion.type === 'none' && styles.promotionOptionActive]}
          onPress={() => onPromotionChange('none')}
        >
          <CommonMaterialCommunityIcons
            name="cancel"
            size={24}
            color={formData.promotion.type === 'none' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.promotionOptionTitle, formData.promotion.type === 'none' && styles.promotionOptionTitleActive]}>
            No Promotion
          </Text>
          <Text style={styles.promotionOptionPrice}>Free</Text>
          <Text style={styles.promotionOptionDescription}>Standard visibility</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.promotionOption, formData.promotion.type === 'map' && styles.promotionOptionActive]}
          onPress={() => onPromotionChange('map')}
        >
          <CommonMaterialCommunityIcons
            name="map-marker"
            size={24}
            color={formData.promotion.type === 'map' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.promotionOptionTitle, formData.promotion.type === 'map' && styles.promotionOptionTitleActive]}>
            Map Promotion
          </Text>
          <Text style={styles.promotionOptionPrice}>$10/day</Text>
          <Text style={styles.promotionOptionDescription}>Featured on map view</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.promotionOption, formData.promotion.type === 'list' && styles.promotionOptionActive]}
          onPress={() => onPromotionChange('list')}
        >
          <CommonMaterialCommunityIcons
            name="format-list-bulleted"
            size={24}
            color={formData.promotion.type === 'list' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.promotionOptionTitle, formData.promotion.type === 'list' && styles.promotionOptionTitleActive]}>
            List Promotion
          </Text>
          <Text style={styles.promotionOptionPrice}>$7/day</Text>
          <Text style={styles.promotionOptionDescription}>Top of events list</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.promotionOption, formData.promotion.type === 'both' && styles.promotionOptionActive]}
          onPress={() => onPromotionChange('both')}
        >
          <CommonMaterialCommunityIcons
            name="star"
            size={24}
            color={formData.promotion.type === 'both' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.promotionOptionTitle, formData.promotion.type === 'both' && styles.promotionOptionTitleActive]}>
            Premium Promotion
          </Text>
          <Text style={styles.promotionOptionPrice}>$15/day</Text>
          <Text style={styles.promotionOptionDescription}>Map + List featured</Text>
        </TouchableOpacity>
      </View>

      {formData.promotion.isPromoted && (
        <View style={styles.durationSection}>
          <Text style={styles.label}>Promotion Duration</Text>
          <View style={styles.durationOptions}>
            {[1, 3, 7, 14].map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.durationOption, formData.promotion.duration === days && styles.durationOptionActive]}
                onPress={() => onPromotionChange(formData.promotion.type, days)}
              >
                <Text style={[styles.durationOptionText, formData.promotion.duration === days && styles.durationOptionTextActive]}>
                  {days} {days === 1 ? 'Day' : 'Days'}
                </Text>
                <Text style={[styles.durationOptionPrice, formData.promotion.duration === days && styles.durationOptionPriceActive]}>
                  ${calculatePromotionCost(formData.promotion.type, days)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.promotionSummary}>
            <Text style={styles.promotionSummaryText}>
              Total Cost: <Text style={styles.promotionSummaryPrice}>${formData.promotion.totalCost}</Text>
            </Text>
            <Text style={styles.promotionSummaryDescription}>
              Your event will be promoted for {formData.promotion.duration} {formData.promotion.duration === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  stepSubtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  promotionOptions: { marginBottom: 24 },
  promotionOption: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center',
  },
  promotionOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  promotionOptionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
  promotionOptionTitleActive: { color: colors.primary },
  promotionOptionPrice: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  promotionOptionDescription: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  durationSection: { marginTop: 24 },
  durationOptions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  durationOption: {
    width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 16, marginBottom: 12, marginRight: '2%', alignItems: 'center',
  },
  durationOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  durationOptionText: { fontSize: 16, fontWeight: '600', color: colors.text },
  durationOptionTextActive: { color: colors.primary },
  durationOptionPrice: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  durationOptionPriceActive: { color: colors.primary },
  promotionSummary: {
    backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  promotionSummaryText: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  promotionSummaryPrice: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  promotionSummaryDescription: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});

export default EventPromotion;
