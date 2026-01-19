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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth';
import { theme } from '../../theme';
import { UserIcon } from '../../components/icons/UserIcon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logga ut',
      'Är du säker på att du vill logga ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logga ut',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  const handleMyTrips = () => {
    navigation.navigate('TripHistory');
  };

  const handleMyAccount = () => {
    navigation.navigate('Account');
  };

  const handleMySaldo = () => {
    navigation.navigate('Balance');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <UserIcon size={48} color={theme.colors.text} />
          </View>
          <Text style={styles.name}>{user?.username || 'Användare'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={handleMyTrips}
            activeOpacity={0.8}
          >
            <Text style={styles.menuButtonText}>Mina resor</Text>
          </TouchableOpacity>
          
          <MenuItem
            title="Mitt konto"
            onPress={handleMyAccount}
          />
          
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={handleMySaldo}
            activeOpacity={0.8}
          >
            <Text style={styles.menuButtonText}>Mitt saldo</Text>
          </TouchableOpacity>
          
          <MenuItem
            title="Logga ut"
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
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
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
  name: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    marginBottom: 4,
    fontWeight: '600',
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
  menuButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  menuButtonBadge: {
    ...theme.typography.bodyM,
    color: 'white',
    fontWeight: '700',
  },
  menuButtonDestructive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuButtonText: {
    ...theme.typography.bodyM,
    color: theme.colors.card,
    fontWeight: '600',
  },
  menuButtonTextDestructive: {
    color: theme.colors.danger,
  },
});
