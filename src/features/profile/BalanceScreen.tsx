import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useBalance } from './useBalance';

export const BalanceScreen = () => {
  const { balance, isLoading, error, refetch, fillup } = useBalance();
  const [fillupAmount, setFillupAmount] = useState('');
  const [isFilling, setIsFilling] = useState(false);

  const handleFillup = async () => {
    const amount = parseFloat(fillupAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Ogiltigt belopp', 'Vänligen ange ett giltigt belopp större än 0');
      return;
    }

    setIsFilling(true);
    try {
      await fillup(amount);
      Alert.alert('Lyckades', `${amount.toFixed(2)} kr har lagts till på ditt saldo`);
      setFillupAmount('');
      await refetch();
    } catch {
      Alert.alert('Fel', 'Misslyckades lägga till saldo. Försök igen.');
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mitt saldo</Text>
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

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Aktuellt saldo</Text>
          {isLoading ? (
            <ActivityIndicator 
              color={theme.colors.brand} 
              size="large" 
              style={styles.loader}
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.balanceAmount}>
              {balance !== null ? `${balance.toFixed(2)} kr` : 'Ej tillgängligt'}
            </Text>
          )}
        </View>

        <View style={styles.fillupCard}>
          <Text style={styles.sectionTitle}>Lägg till saldo</Text>
          <Text style={styles.sectionDescription}>
            Ange det belopp du vill lägga till på ditt saldo
          </Text>

          <View style={styles.fillupContainer}>
            <TextInput
              style={styles.fillupInput}
              placeholder="Belopp (kr)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={fillupAmount}
              onChangeText={setFillupAmount}
              editable={!isFilling}
              testID="fillup-input"
            />
            <TouchableOpacity
              style={[
                styles.fillupButton,
                (isFilling || !fillupAmount) && styles.fillupButtonDisabled,
              ]}
              onPress={handleFillup}
              disabled={isFilling || !fillupAmount}
              testID="fillup-button"
            >
              {isFilling ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.fillupButtonText}>Lägg till saldo</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.quickAmounts}>
            <Text style={styles.quickAmountsLabel}>Snabbbelopp:</Text>
            <View style={styles.quickAmountsButtons}>
              {[50, 100, 200, 500].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setFillupAmount(amount.toString())}
                  disabled={isFilling}
                >
                  <Text style={styles.quickAmountText}>{amount} kr</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • Your balance is used to pay for rides automatically
            {'\n'}• Add balance anytime using the form above
            {'\n'}• Minimum top-up amount is 1 kr
            {'\n'}• Your balance never expires
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
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
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
  balanceCard: {
    backgroundColor: theme.colors.brand,
    padding: theme.spacing.xxl,
    borderRadius: theme.radii.card,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  balanceLabel: {
    ...theme.typography.bodyM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.sm,
  },
  balanceAmount: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
  loader: {
    marginVertical: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.bodyM,
    color: theme.colors.danger,
  },
  fillupCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.card,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  sectionTitle: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  fillupContainer: {
    gap: theme.spacing.md,
  },
  fillupInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.control,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.typography.bodyM,
    color: theme.colors.text,
  },
  fillupButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...theme.shadows.small,
  },
  fillupButtonDisabled: {
    opacity: 0.5,
  },
  fillupButtonText: {
    ...theme.typography.bodyM,
    color: 'white',
    fontWeight: '600',
  },
  quickAmounts: {
    marginTop: theme.spacing.lg,
  },
  quickAmountsLabel: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  quickAmountsButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  quickAmountButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.control,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickAmountText: {
    ...theme.typography.bodyM,
    color: theme.colors.text,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    ...theme.typography.titleM,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
});
