import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Product, Order } from '../types/database';
import { formatDistanceToNow } from 'date-fns';

export function SellerDashboardScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [productsRes, ordersRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data as Product[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', product.id);

    if (error) {
      Alert.alert('Error', 'Failed to update product status');
    } else {
      fetchData();
    }
  };

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);

  const pendingOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <View style={styles.container}>
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingOrders.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.productPrice}>${item.price_usdc.toFixed(2)} USDC</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.statusToggle,
                  item.status === 'active' ? styles.statusActive : styles.statusPaused,
                ]}
                onPress={() => toggleProductStatus(item)}
              >
                <Text style={styles.statusToggleText}>
                  {item.status === 'active' ? 'Active' : 'Paused'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products listed yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.orderAmount}>${item.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.orderMeta}>
                <Text style={styles.orderStatus}>{item.status.replace(/_/g, ' ')}</Text>
                <Text style={styles.orderTime}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsSection: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
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
    ...typography.heading3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  list: {
    padding: spacing.lg,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  statusToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusActive: {
    backgroundColor: colors.successMuted,
  },
  statusPaused: {
    backgroundColor: colors.warningMuted,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  orderItem: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderStatus: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  orderTime: {
    ...typography.caption,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
