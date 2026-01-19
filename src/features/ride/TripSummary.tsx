import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRide } from './RideProvider';
import { theme } from '../../theme';

export const TripSummary = () => {
  const { lastRide, clearLastRide } = useRide();

  if (!lastRide) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sek`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!lastRide}
      onRequestClose={clearLastRide}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.iconContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          
          <Text style={styles.title}>Resa avslutad!</Text>
          <Text style={styles.subtitle}>Hoppas du hade en trevlig tur.</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tid</Text>
              <Text style={styles.statValue}>{formatTime(lastRide.durationSeconds)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Kostnad</Text>
              <Text style={styles.statValue}>{lastRide.cost.toFixed(2)} kr</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={clearLastRide}
          >
            <Text style={styles.buttonText}>Betala och stäng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.brandMuted,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.brand,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  statLabel: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.brand,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
