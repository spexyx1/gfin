import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../config/theme';

interface CartItem {
  id: string;
  title: string;
  price_usdc: number;
  quantity: number;
  seller_id: string;
}

export function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const total = cartItems.reduce((sum, item) => sum + item.price_usdc * item.quantity, 0);

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Add products to your cart to checkout');
      return;
    }
    Alert.alert('Checkout', `Total: $${total.toFixed(2)} USDC. Proceed with escrow payment?`);
  };

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>B</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse the marketplace to find products
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemPrice}>${item.price_usdc.toFixed(2)} USDC</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(item.id)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)} USDC</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Checkout with Escrow</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemPrice: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  removeText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    ...typography.heading3,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  checkoutText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
