import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Ride } from '../ride';
import { useRideHistory } from './useRideHistory';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} min ${remainingSeconds}s`;
};

const formatCurrency = (amount: number) => `${amount.toFixed(0)} kr`;

const RideHistoryItem = ({ ride }: { ride: Ride }) => (
  <View style={styles.historyItem}>
    <View style={styles.historyHeader}>
      <Text style={styles.historyTitle}>{formatDateTime(ride.startTime)}</Text>
      <Text style={styles.historyCost}>{formatCurrency(ride.cost)}</Text>
    </View>
    <View style={styles.historyMetaRow}>
      <Text style={styles.historyLabel}>Scooter</Text>
      <Text style={styles.historyValue}>{ride.scooterId}</Text>
    </View>
    <View style={styles.historyMetaRow}>
      <Text style={styles.historyLabel}>Varaktighet</Text>
      <Text style={styles.historyValue}>{formatDuration(ride.durationSeconds)}</Text>
    </View>
    <View style={styles.historyStatusRow}>
      <Text style={styles.statusBadge}>{ride.status === 'completed' ? 'Avslutad' : ride.status}</Text>
    </View>
  </View>
);

export const ProfileScreen = () => {
  const { rides, isLoading, error, refetch } = useRideHistory();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Min sida</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Trips</Text>
            <TouchableOpacity onPress={refetch} disabled={isLoading} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>{isLoading ? 'Laddar...' : 'Uppdatera'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Dina senaste resor listas här. När backend-API:et är klart kommer samma hook att hämtas från servern istället för mock-data.
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {isLoading && rides.length === 0 ? (
            <ActivityIndicator
              color={theme.colors.brand}
              style={styles.loader}
              testID="ride-history-loader"
            />
          ) : null}
          {!isLoading && rides.length === 0 ? (
            <Text style={styles.emptyState} testID="ride-history-empty">
              Du har inga resor ännu.
            </Text>
          ) : null}
          {rides.map(ride => (
            <RideHistoryItem ride={ride} key={ride.id} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vad fungerar nu?</Text>
          <Text style={styles.sectionDescription}>
            - Pågående resor styrs från kartan.
            {'\n'}- Du kan avsluta en resa och se summeringen.
            {'\n'}- Historiken ovan använder ett mock-API och kan kopplas mot backend så snart end-points finns.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: theme.colors.text,
  },
  section: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  sectionDescription: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 12,
  },
  emptyState: {
    color: theme.colors.textMuted,
    marginTop: 12,
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: 8,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  historyCost: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyLabel: {
    color: theme.colors.textMuted,
  },
  historyValue: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  historyStatusRow: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.badges.success.background,
    color: theme.badges.success.foreground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
});
