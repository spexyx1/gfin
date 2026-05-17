import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { Order } from '../types/database';
import { RootStackParamList } from '../navigation/types';
import { formatDistanceToNow } from 'date-fns';

type RouteProps = RouteProp<RootStackParamList, 'OrderDetail'>;

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

export function OrderDetailScreen() {
  const route = useRoute<RouteProps>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder(payload.new as Order);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (data) {
      setOrder(data as Order);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
            {order.status.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>${order.amount.toFixed(2)} {order.currency || 'USDC'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{order.description}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {order.tracking_number && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tracking</Text>
            <Text style={styles.detailValue}>{order.tracking_number}</Text>
          </View>
          {order.carrier && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Carrier</Text>
              <Text style={styles.detailValue}>{order.carrier}</Text>
            </View>
          )}
          {order.estimated_delivery && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Delivery</Text>
              <Text style={styles.detailValue}>{order.estimated_delivery}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Escrow Protection</Text>
        <View style={styles.escrowInfo}>
          <Text style={styles.escrowText}>
            Funds are held in escrow until delivery is confirmed. Both parties are protected.
          </Text>
        </View>
        {order.funds_release_deadline && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Release Deadline</Text>
            <Text style={styles.detailValue}>
              {formatDistanceToNow(new Date(order.funds_release_deadline), { addSuffix: true })}
            </Text>
          </View>
        )}
      </View>

      {order.status === 'delivered' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.disputeButton}>
            <Text style={styles.disputeButtonText}>Open Dispute</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.button,
    fontSize: 13,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  escrowInfo: {
    backgroundColor: colors.accentMuted,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  escrowText: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  disputeButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  disputeButtonText: {
    ...typography.button,
    color: colors.error,
  },
});
