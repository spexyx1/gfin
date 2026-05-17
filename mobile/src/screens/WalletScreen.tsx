import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Order } from '../types/database';
import { RootStackParamList } from '../navigation/types';
import { formatDistanceToNow } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, string> = {
  created: colors.textMuted,
  funded: colors.warning,
  shipped: colors.primary,
  delivered: colors.accent,
  awaiting_release: colors.warning,
  funds_released: colors.accent,
  completed: colors.success,
  disputed: colors.error,
  cancelled: colors.error,
};

export function WalletScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const totalEscrow = activeOrders
    .filter(o => ['funded', 'shipped', 'delivered', 'awaiting_release'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>In Escrow</Text>
          <Text style={styles.balanceAmount}>${totalEscrow.toFixed(2)}</Text>
          <Text style={styles.balanceCurrency}>USDC</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'disputed').length}</Text>
            <Text style={styles.statLabel}>Disputed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          {activeOrders.length === 0 ? (
            <Text style={styles.emptyText}>No active orders</Text>
          ) : (
            activeOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderDesc} numberOfLines={1}>{order.description}</Text>
                  <Text style={styles.orderAmount}>${order.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.orderFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] || colors.textMuted) + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || colors.textMuted }]}>
                      {order.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text style={styles.orderTime}>
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {completedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History</Text>
            {completedOrders.slice(0, 10).map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderDesc} numberOfLines={1}>{order.description}</Text>
                  <Text style={styles.orderAmount}>${order.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.orderFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] || colors.textMuted) + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || colors.textMuted }]}>
                      {order.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text style={styles.orderTime}>
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  title: {
    ...typography.heading1,
  },
  balanceCard: {
    margin: spacing.lg,
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.accent,
  },
  balanceCurrency: {
    ...typography.body,
    color: colors.accentDim,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.heading2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderDesc: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.md,
  },
  orderAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.accent,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderTime: {
    ...typography.caption,
  },
});
