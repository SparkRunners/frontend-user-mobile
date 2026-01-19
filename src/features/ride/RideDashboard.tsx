import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { useRide } from './RideProvider';
import { useRideZoneRules } from './useZoneRules';
import { LocationTestPanel } from './LocationTestPanel';
import { theme } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100; // 下滑超过100px就关闭

export const RideDashboard = () => {
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const translateY = useSharedValue(0);
  const { durationSeconds, currentCost, endRide, isLoading, isRiding } = useRide();
  const {
    rule: zoneRule,
    nearestParking,
    isChecking,
    error: zoneError,
    lastUpdated,
    forceRefresh,
  } = useRideZoneRules(Boolean(isRiding));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const zoneSeverity = zoneRule?.type === 'no-go'
    ? 'danger'
    : zoneRule?.type === 'slow-speed'
      ? 'warning'
      : 'neutral';

  const zoneTitle = zoneRule?.type === 'no-go'
    ? 'Förbjuden zon'
    : zoneRule?.type === 'slow-speed'
      ? 'Låg hastighet'
      : 'Zonstatus';

  const zoneMessage = (() => {
    if (zoneError) {
      return zoneError;
    }
    if (!zoneRule) {
      return 'Inga aktiva zonbegränsningar just nu.';
    }
    if (zoneRule.message) {
      return zoneRule.message;
    }
    if (zoneRule.type === 'no-go') {
      return 'Du är i en förbjuden zon. Flytta skotern innan du avslutar resan.';
    }
    if (zoneRule.type === 'slow-speed') {
      return 'Du är i en låg-hastighetszon.';
    }
    return 'Zonstatus uppdaterad.';
  })();

  const speedLimitLabel = zoneRule?.type === 'slow-speed' && zoneRule.speedLimitKmh
    ? `Max ${zoneRule.speedLimitKmh} km/h`
    : null;

  const parkingLabel = nearestParking
    ? `Närmaste parkering: ${nearestParking.name ?? nearestParking.id}${nearestParking.distanceMeters ? ` · ${Math.round(nearestParking.distanceMeters)} m` : ''}`
    : null;

  const lastUpdatedLabel = lastUpdated
    ? `Uppdaterad ${new Date(lastUpdated).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
    : null;

  const buildAlertMessage = () => {
    const rows = ['Är du säker på att du vill avsluta resan?'];
    if (zoneRule?.type === 'no-go') {
      rows.push('Du befinner dig i en förbjuden zon. Flytta skotern tillåten plats innan avslut.');
    } else if (zoneRule?.type === 'slow-speed') {
      rows.push('Du är i en låg-hastighetszon. Se till att följa begränsningen.');
    }
    if (nearestParking) {
      const label = nearestParking.name ?? nearestParking.id;
      const distance = nearestParking.distanceMeters
        ? `${Math.round(nearestParking.distanceMeters)} m`
        : undefined;
      rows.push(
        `Närmaste rekommenderade parkering: ${label}${distance ? ` (${distance})` : ''}`,
      );
    }
    return rows.join('\n\n');
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // 只允许向下滑动
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        // 滑动超过阈值，最小化面板
        translateY.value = withSpring(SCREEN_HEIGHT * 0.5, {}, () => {
          runOnJS(setIsMinimized)(true);
        });
      } else {
        // 回弹
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleExpand = () => {
    setIsMinimized(false);
    translateY.value = withSpring(0);
  };

  const handleEndRide = () => {
    Alert.alert(
      'Avsluta resa',
      buildAlertMessage(),
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Avsluta', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await endRide();
            } catch (error) {
              console.error('Failed to end ride', error);
              const message = error instanceof Error
                ? error.message
                : 'Kunde inte avsluta resan. Försök igen.';
              Alert.alert('Fel', message);
            }
          }
        }
      ]
    );
  };

  if (isMinimized) {
    return (
      <TouchableOpacity 
        style={styles.minimizedContainer}
        onPress={handleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.minimizedHandle} />
        <Text style={styles.minimizedText}>Pågående resa - {formatTime(durationSeconds)}</Text>
        <Text style={styles.minimizedCost}>{currentCost.toFixed(2)} kr</Text>
      </TouchableOpacity>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.dragHandle} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
        <TouchableOpacity
          testID="zone-status-banner"
          style={[
            styles.zoneBanner,
            zoneSeverity === 'danger' && styles.zoneBannerDanger,
            zoneSeverity === 'warning' && styles.zoneBannerWarning,
            zoneSeverity === 'neutral' && styles.zoneBannerNeutral,
          ]}
          onPress={forceRefresh}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
        <View style={styles.zoneBannerHeader}>
          <Text style={styles.zoneBannerTitle}>{zoneTitle}</Text>
          {isChecking ? (
            <ActivityIndicator size="small" color={theme.colors.text} />
          ) : lastUpdatedLabel ? (
            <Text style={styles.zoneBannerMeta}>{lastUpdatedLabel}</Text>
          ) : null}
        </View>
        <Text style={styles.zoneBannerMessage}>{zoneMessage}</Text>
        {speedLimitLabel ? (
          <Text style={styles.zoneBannerDetail}>{speedLimitLabel}</Text>
        ) : null}
        {parkingLabel ? (
          <Text style={styles.zoneBannerDetail}>{parkingLabel}</Text>
        ) : null}
        {zoneError ? (
          <Text style={styles.zoneBannerAction}>Tryck för att uppdatera zonstatus</Text>
        ) : null}
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tid</Text>
          <Text style={styles.statValue}>{formatTime(durationSeconds)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Kostnad</Text>
          <Text style={styles.statValue}>{currentCost.toFixed(2)} kr</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.endButton, isLoading && styles.buttonDisabled]} 
        onPress={handleEndRide}
        disabled={isLoading}
      >
        <Text style={styles.endButtonText}>
          {isLoading ? 'Avslutar...' : 'Avsluta resa'}
        </Text>
      </TouchableOpacity>
      </ScrollView>

      {__DEV__ && (
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowTestPanel(true)}
        >
          <Text style={styles.testButtonText}>Test GPS</Text>
        </TouchableOpacity>
      )}

      <LocationTestPanel
        visible={showTestPanel}
        onClose={() => setShowTestPanel(false)}
      />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    maxHeight: '60%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    ...theme.shadows.soft,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  minimizedContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.soft,
  },
  minimizedHandle: {
    width: 4,
    height: 40,
    backgroundColor: theme.colors.brand,
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  minimizedText: {
    flex: 1,
    ...theme.typography.bodyM,
    color: theme.colors.text,
    fontWeight: '600',
  },
  minimizedCost: {
    ...theme.typography.titleM,
    color: theme.colors.brand,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  zoneBanner: {
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
  },
  zoneBannerDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  zoneBannerWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  zoneBannerNeutral: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderColor: theme.colors.border,
  },
  zoneBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  zoneBannerTitle: {
    ...theme.typography.titleM,
    color: theme.colors.text,
    marginBottom: 2,
  },
  zoneBannerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  zoneBannerMessage: {
    ...theme.typography.bodyS,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  zoneBannerDetail: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  zoneBannerAction: {
    ...theme.typography.caption,
    color: theme.colors.brand,
    marginTop: 8,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    alignSelf: 'stretch',
  },
  endButton: {
    backgroundColor: theme.colors.danger,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  endButtonText: {
    ...theme.typography.bodyM,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  testButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
