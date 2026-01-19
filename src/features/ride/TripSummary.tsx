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
            <Text style={styles.icon}>🎉</Text>
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
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.brandMuted,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyM,
    color: theme.colors.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  statLabel: {
    ...theme.typography.bodyM,
    color: theme.colors.textMuted,
  },
  statValue: {
    ...theme.typography.titleM,
    color: theme.colors.text,
  },
  button: {
    width: '100%',
    backgroundColor: theme.colors.brand,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    ...theme.typography.bodyM,
    color: 'white',
    fontWeight: 'bold',
  },
});
