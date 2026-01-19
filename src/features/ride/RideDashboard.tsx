import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRide } from './RideProvider';
import { useRideZoneRules } from './useZoneRules';
import { LocationTestPanel } from './LocationTestPanel';
import { theme } from '../../theme';

export const RideDashboard = () => {
  const [showTestPanel, setShowTestPanel] = useState(false);
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

  return (
    <View style={styles.container}>
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

      {__DEV__ && (
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowTestPanel(true)}
        >
          <Text style={styles.testButtonText}>🧪 Test GPS</Text>
        </TouchableOpacity>
      )}

      <LocationTestPanel
        visible={showTestPanel}
        onClose={() => setShowTestPanel(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  zoneBanner: {
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  zoneBannerDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: theme.colors.danger,
    borderWidth: 1,
  },
  zoneBannerWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FBBF24',
    borderWidth: 1,
  },
  zoneBannerNeutral: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  zoneBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  zoneBannerTitle: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.text,
  },
  zoneBannerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  zoneBannerMessage: {
    ...theme.typography.bodyM,
    color: theme.colors.text,
    marginBottom: 4,
  },
  zoneBannerDetail: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  zoneBannerAction: {
    ...theme.typography.caption,
    color: theme.colors.brand,
    marginTop: 6,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  endButton: {
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.control,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  endButtonText: {
    ...theme.typography.bodyM,
    color: 'white',
    fontWeight: '600',
  },
  testButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#FFF3CD',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.control,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  testButtonText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
});
