import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { GlobalColors } from '../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

interface EmptyMapStateProps {
  isVisible: boolean;
}

const EmptyMapState: React.FC<EmptyMapStateProps> = ({ isVisible }) => {
  const colors = GlobalColors.EmptyMapState;
  
  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const blinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();

      // Animated.loop(
      //   Animated.timing(pulseAnim, {
      //     toValue: 1,
      //     duration: 2500,
      //     easing: Easing.out(Easing.ease),
      //     useNativeDriver: true,
      //   })
      // ).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // pulseAnim.stopAnimation();
      blinkAnim.stopAnimation();
    }
    return(()=>(
      blinkAnim.stopAnimation()
    ))
  }, [isVisible]);

  // We don't return null so the exit animation can run, but we can return null if totally off screen
  // For simplicity, we just rely on translateY moving it off screen.

  // const pulseScale1 = pulseAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [1, 2.2]
  // });
  
  // const pulseOpacity1 = pulseAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0.6, 0]
  // });

  // const pulseScale2 = pulseAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [1, 3.5]
  // });
  
  // const pulseOpacity2 = pulseAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0.3, 0]
  // });
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY: slideAnim}],
          borderColor: colors.border,
          borderWidth: 2,
          borderRadius: 25,
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}>
      <View style={[styles.content, {backgroundColor: colors.background}]}>
        {/* Top Header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.blinkDot,
              {backgroundColor: colors.blinkDot, opacity: blinkAnim},
            ]}
          />
          <Text style={[styles.headerText, {color: colors.blinkDot}]}>
            SCANNING THE AREA...
          </Text>
        </View>

        {/* Center Graphic and Main Text container */}
        <View style={styles.middleSection}>
          {/* <View style={styles.centerGraphic}>
            <Animated.View 
              style={[
                styles.pulseCircle, 
                { 
                  borderColor: colors.circleBorder,
                  transform: [{ scale: pulseScale2 }], 
                  opacity: pulseOpacity2 
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.pulseCircle, 
                { 
                  borderColor: colors.circleBorder,
                  transform: [{ scale: pulseScale1 }], 
                  opacity: pulseOpacity1 
                }
              ]} 
            />
            <View style={[styles.innerCircle, { borderColor: colors.circleBorder }]}>
              <Icon name="radio" size={24} color={colors.accentBlue} style={styles.radioIcon} />
            </View>
          </View> */}

          {/* Main Text */}
          <Text style={[styles.mainText, {color: colors.textPrimary}]}>
            Quiet near you {'\n'} right now
          </Text>
        </View>
        <View
          style={{
            width: '100%',
            borderWidth: 0.3,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        />
        <View style={{display: 'flex', flexDirection: 'row', marginBottom: 10}}>
          <Text
            style={{
              color: colors.textSecondary,
              opacity: .8,
              marginRight: 3,
              fontWeight: '500',
            }}>
            When the city moves,
          </Text>
          <Text style={{color: colors.textSecondary, fontWeight: '500'}}>
            the map moves with it
          </Text>
        </View>

        {/* Bottom Features */}
        <View style={styles.footer}>
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureDot,
                {backgroundColor: colors.accentOrange},
              ]}
            />
            <Text style={[styles.featureText, {color: colors.textSecondary}]}>
              Real people
            </Text>
          </View>
          <View style={styles.featureSeparator} />
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureDot,
                {backgroundColor: colors.accentOrange},
              ]}
            />
            <Text style={[styles.featureText, {color: colors.textSecondary}]}>
              Real signals
            </Text>
          </View>
          <View style={styles.featureSeparator} />
          {/* <View style={styles.featureItem}> */}
          {/* <View
              style={[styles.featureDot, {backgroundColor: colors.accentBlue}]}
            />
            <Text style={[styles.featureText, {color: colors.textSecondary}]}>
              Nothing fake
            </Text>
          </View> */}

          <View style={styles.featureItem}>
            <View
              style={[styles.featureDot, {backgroundColor: colors.accentBlue}]}
            />
            <Text style={[styles.featureText, {color: colors.textSecondary}]}>
              Nothing old
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    paddingTop: 40,
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -5},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  blinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 19,
    paddingRight: 20,
  },
  centerGraphic: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  radioIcon: {
    opacity: 0.8,
  },
  mainText: {
    fontSize: 34,
    fontWeight: '700',
    // lineHeight: 42,
    // letterSpacing: -0.5,
    // flex: 1,
    // fontStyle: 'italic',
    // marginLeft: 30,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: -5
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  featureSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
});

export default React.memo(EmptyMapState);
