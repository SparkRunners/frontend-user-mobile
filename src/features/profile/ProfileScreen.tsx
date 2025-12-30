import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

export const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Min sida</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kommer snart</Text>
        <Text style={styles.sectionDescription}>
          Här kommer "My Trips" och saldo-information visas så fort backend-stödet är på plats.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vad fungerar nu?</Text>
        <Text style={styles.sectionDescription}>
          - Pågående resor styrs från kartan.
          {'\n'}- Du kan avsluta en resa och se summeringen.
          {'\n'}- Det här vyn är en placeholder tills den riktiga menyn byggs.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
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
});
