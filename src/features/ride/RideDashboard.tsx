import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRide } from './RideProvider';
import { theme } from '../../theme';

export const RideDashboard = () => {
  const { durationSeconds, currentCost, endRide, isLoading } = useRide();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndRide = () => {
    Alert.alert(
      'Avsluta resa',
      'Är du säker på att du vill avsluta resan?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Avsluta', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await endRide();
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte avsluta resan. Försök igen.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
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
});
