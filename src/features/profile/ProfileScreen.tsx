import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { theme } from '../../theme';
import { Ride } from '../ride';
import { useRideHistory } from './useRideHistory';
import { useBalance } from './useBalance';

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
  const { balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance, fillup } = useBalance();
  const [fillupAmount, setFillupAmount] = useState('');
  const [isFilling, setIsFilling] = useState(false);

  const handleFillup = async () => {
    const amount = parseFloat(fillupAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Ogiltigt belopp', 'Ange ett giltigt belopp större än 0');
      return;
    }

    setIsFilling(true);
    try {
      await fillup(amount);
      setFillupAmount('');
      Toast.show({
        type: 'success',
        text1: 'Påfyllning lyckades',
        text2: `${amount} kr har lagts till på ditt konto`,
        position: 'bottom',
      });
    } catch (err) {
      Alert.alert('Fel', err instanceof Error ? err.message : 'Kunde inte fylla på saldo');
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Min sida</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saldo</Text>
            <TouchableOpacity onPress={refetchBalance} disabled={balanceLoading} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>{balanceLoading ? 'Laddar...' : 'Uppdatera'}</Text>
            </TouchableOpacity>
          </View>
          {balanceError ? <Text style={styles.errorText}>{balanceError}</Text> : null}
          {balanceLoading && balance === null ? (
            <ActivityIndicator color={theme.colors.brand} style={styles.loader} testID="balance-loader" />
          ) : (
            <Text style={styles.balanceAmount} testID="balance-amount">
              {balance !== null ? `${balance.toFixed(2)} kr` : 'Ej tillgängligt'}
            </Text>
          )}
          
          <View style={styles.fillupContainer}>
            <TextInput
              style={styles.fillupInput}
              placeholder="Belopp att fylla på"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={fillupAmount}
              onChangeText={setFillupAmount}
              editable={!isFilling}
              testID="fillup-input"
            />
            <TouchableOpacity
              style={[styles.fillupButton, (isFilling || !fillupAmount) && styles.fillupButtonDisabled]}
              onPress={handleFillup}
              disabled={isFilling || !fillupAmount}
              testID="fillup-button"
            >
              <Text style={styles.fillupButtonText}>{isFilling ? 'Fyller på...' : 'Fyll på'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Trips</Text>
            <TouchableOpacity onPress={refetch} disabled={isLoading} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>{isLoading ? 'Laddar...' : 'Uppdatera'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Dina senaste resor listas här.
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
          {rides.map((ride, index) => (
            <RideHistoryItem ride={ride} key={ride.id || `ride-${index}`} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vad fungerar nu?</Text>
          <Text style={styles.sectionDescription}>
            - Pågående resor styrs från kartan.
            {'\n'}- Du kan avsluta en resa och se summeringen.
            {'\n'}- Saldo och påfyllning kopplas nu mot backend API.
            {'\n'}- Historiken hämtas från servern.
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
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.brand,
    marginVertical: 8,
  },
  fillupContainer: {
    marginTop: 16,
    gap: 12,
  },
  fillupInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  fillupButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  fillupButtonDisabled: {
    opacity: 0.5,
  },
  fillupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
