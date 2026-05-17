import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { Product, Profile } from '../types/database';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen() {
  const route = useRoute<RouteProps>();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (data) {
      setProduct(data as Product);
      fetchSeller(data.seller_id);
    }
    setLoading(false);
  };

  const fetchSeller = async (sellerId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sellerId)
      .maybeSingle();

    if (data) {
      setSeller(data as Profile);
    }
  };

  const handleBuyNow = () => {
    Alert.alert(
      'Confirm Purchase',
      `Buy "${product?.title}" for $${product?.price_usdc.toFixed(2)} USDC?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Now', onPress: () => processPurchase() },
      ]
    );
  };

  const processPurchase = async () => {
    Alert.alert('Success', 'Order created. The seller will be notified.');
  };

  const handleMakeOffer = () => {
    Alert.alert('Make Offer', 'Offer functionality - enter your offer amount');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageSection}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>{product.category.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.detailSection}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{product.category}</Text>
        </View>

        <Text style={styles.title}>{product.title}</Text>

        <View style={styles.priceSection}>
          <Text style={styles.price}>${product.price_usdc.toFixed(2)}</Text>
          <Text style={styles.currency}>USDC</Text>
        </View>

        <Text style={styles.description}>{product.description}</Text>

        {product.tags && product.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {product.tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {seller && (
          <View style={styles.sellerSection}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {seller.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.sellerName}>{seller.display_name}</Text>
              <Text style={styles.sellerHandle}>@{seller.handle}</Text>
            </View>
            {seller.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: product.in_stock ? colors.success : colors.error }]} />
          <Text style={styles.statusText}>
            {product.in_stock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.buyButton, !product.in_stock && styles.buttonDisabled]}
          onPress={handleBuyNow}
          disabled={!product.in_stock}
        >
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.offerButton}
          onPress={handleMakeOffer}
        >
          <Text style={styles.offerButtonText}>Make Offer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  imageSection: {
    height: 280,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  imageText: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.textMuted,
  },
  detailSection: {
    padding: spacing.xl,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.md,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
  },
  currency: {
    ...typography.body,
    color: colors.accentDim,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  sellerName: {
    ...typography.body,
    fontWeight: '600',
  },
  sellerHandle: {
    ...typography.caption,
  },
  verifiedBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.bodySmall,
  },
  actions: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  buyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buyButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  offerButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  offerButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
