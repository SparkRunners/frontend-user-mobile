import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth';
import { theme } from '../../theme';
import { UserIcon } from '../../components/icons/UserIcon';

export const AccountScreen = () => {
  const { user } = useAuth();

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <UserIcon size={80} color={theme.colors.brand} />
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontoinformation</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Användar-ID</Text>
            <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Användarnamn</Text>
            <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>E-post</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Roll</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.role || 'user'}
              </Text>
            </View>
          </View>
        </View>

        {/* Session Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessionsinformation</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Konto skapat</Text>
            <Text style={styles.infoValue}>
              {formatDate(user?.issuedAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session upphör</Text>
            <Text style={styles.infoValue}>
              {formatDate(user?.expiresAt)}
            </Text>
          </View>
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
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.brand,
    ...theme.shadows.medium,
  },
  section: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.card,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  sectionTitle: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...theme.typography.bodyM,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  roleBadge: {
    backgroundColor: theme.colors.brandMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
  },
  roleBadgeText: {
    ...theme.typography.bodyS,
    color: theme.colors.brandDark,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
