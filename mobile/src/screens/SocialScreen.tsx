import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { formatDistanceToNow } from 'date-fns';

interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  likes: number;
  comments_count: number;
  created_at: string;
  profile?: Profile;
}

export function SocialScreen() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('social_posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setPosts(data.map((post: any) => ({
        ...post,
        profile: post.profiles,
      })));
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>Community Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>
                  {(item.profile?.display_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>{item.profile?.display_name || 'Anonymous'}</Text>
                <Text style={styles.postTime}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
            <Text style={styles.postContent}>{item.content}</Text>
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>{item.likes} Likes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>{item.comments_count} Comments</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading feed...' : 'No posts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              The community feed will show posts from users you follow
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading1,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  postAvatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    ...typography.body,
    fontWeight: '600',
  },
  postTime: {
    ...typography.caption,
  },
  postContent: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  postActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
