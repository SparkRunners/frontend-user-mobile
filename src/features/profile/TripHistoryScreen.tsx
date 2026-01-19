import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useRideHistory } from './useRideHistory';
import type { Ride } from '../ride/types';

interface RideHistoryItemProps {
  ride: Ride;
}

const RideHistoryItem: React.FC<RideHistoryItemProps> = ({ ride }) => {
  const formatDate = (timestamp: string | number) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          {ride.scooterId ? `Scooter #${ride.scooterId}` : 'Scooter'}
        </Text>
        <Text style={styles.historyCost}>{ride.cost?.toFixed(2)} kr</Text>
      </View>
      
      <View style={styles.historyMetaRow}>
        <Text style={styles.historyLabel}>Startad</Text>
        <Text style={styles.historyValue}>
          {formatDate(ride.startTime)}
        </Text>
      </View>
      
      {ride.endTime && (
        <View style={styles.historyMetaRow}>
          <Text style={styles.historyLabel}>Avslutad</Text>
          <Text style={styles.historyValue}>
            {formatDate(ride.endTime)}
          </Text>
        </View>
      )}
      
      {ride.durationSeconds !== undefined && (
        <View style={styles.historyMetaRow}>
          <Text style={styles.historyLabel}>Varaktighet</Text>
          <Text style={styles.historyValue}>
            {formatDuration(ride.durationSeconds)}
          </Text>
        </View>
      )}
      
      <View style={styles.historyStatusRow}>
        <Text style={styles.statusBadge}>
          {ride.status === 'completed' ? 'avslutad' : ride.status === 'active' ? 'aktiv' : ride.status}
        </Text>
      </View>
    </View>
  );
};

export const TripHistoryScreen = () => {
  const { rides, isLoading, error, refetch } = useRideHistory();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mina resor</Text>
          <TouchableOpacity 
            onPress={refetch} 
            disabled={isLoading} 
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Laddar...' : 'Uppdatera'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>
          Dina senaste resor listas här.
        </Text>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {isLoading && rides.length === 0 ? (
          <ActivityIndicator
            color={theme.colors.brand}
            style={styles.loader}
            testID="ride-history-loader"
          />
        ) : null}

        {!isLoading && rides.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Du har inga resor ännu.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Skanna en scooter på kartan för att starta din första resa!
            </Text>
          </View>
        ) : null}

        {rides.map((ride, index) => (
          <RideHistoryItem ride={ride} key={ride.id || `ride-${index}`} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.titleXL,
    color: theme.colors.text,
  },
  refreshButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.control,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  refreshButtonText: {
    ...theme.typography.bodyM,
    color: theme.colors.brand,
    fontWeight: '600',
  },
  description: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  loader: {
    marginVertical: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyStateText: {
    ...theme.typography.titleM,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    ...theme.typography.bodyM,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    ...theme.typography.bodyM,
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.danger}15`,
    borderRadius: theme.radii.control,
  },
  historyItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.card,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  historyTitle: {
    ...theme.typography.titleM,
    color: theme.colors.text,
  },
  historyCost: {
    ...theme.typography.titleM,
    color: theme.colors.brand,
    fontWeight: '700',
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  historyLabel: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
  },
  historyValue: {
    ...theme.typography.bodyM,
    color: theme.colors.text,
    fontWeight: '500',
  },
  historyStatusRow: {
    marginTop: theme.spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.badges.success.background,
    color: theme.badges.success.foreground,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
