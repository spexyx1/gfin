import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{profile?.display_name || 'User'}</Text>
          <Text style={styles.handle}>@{profile?.handle || 'unknown'}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile?.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile?.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SellerDashboard')}
          >
            <Text style={styles.menuItemText}>Seller Dashboard</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Security Settings</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Language</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Help & FAQ</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GHETTO FINANCE v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: spacing.xl,
  },
  title: {
    ...typography.heading1,
  },
  profileCard: {
    margin: spacing.lg,
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 32,
  },
  displayName: {
    ...typography.heading2,
    marginBottom: spacing.xs,
  },
  handle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  statValue: {
    ...typography.heading3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  menuSection: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    ...typography.body,
  },
  menuArrow: {
    color: colors.textMuted,
    fontSize: 16,
  },
  signOutButton: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.errorMuted,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    ...typography.button,
    color: colors.error,
  },
  version: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
