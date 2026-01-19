import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth';
import { theme } from '../../theme';

interface MenuItemProps {
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ title, onPress, isDestructive = false }) => (
  <TouchableOpacity 
    style={[styles.menuButton, isDestructive && styles.menuButtonDestructive]} 
    onPress={onPress} 
    activeOpacity={0.8}
  >
    <Text style={[styles.menuButtonText, isDestructive && styles.menuButtonTextDestructive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  const handleMyTrips = () => {
    Alert.alert('My trips', 'Ride history coming soon');
  };

  const handleMyAccount = () => {
    Alert.alert('My account', 'Change name, password, email coming soon');
  };

  const handleMySaldo = () => {
    Alert.alert('My saldo', 'Balance management coming soon');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle} />
          </View>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          <MenuItem
            title="My trips"
            onPress={handleMyTrips}
          />
          
          <MenuItem
            title="My account"
            onPress={handleMyAccount}
          />
          
          <MenuItem
            title="My saldo"
            onPress={handleMySaldo}
          />
          
          <MenuItem
            title="Log out"
            onPress={handleLogout}
            isDestructive
          />
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
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  username: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    marginBottom: 4,
    fontWeight: '600',
  },
  email: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
  },
  menuList: {
    gap: theme.spacing.md,
  },
  menuButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.control,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  menuButtonDestructive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuButtonText: {
    ...theme.typography.bodyL,
    color: theme.colors.card,
    fontWeight: '600',
  },
  menuButtonTextDestructive: {
    color: theme.colors.danger,
  },
});
