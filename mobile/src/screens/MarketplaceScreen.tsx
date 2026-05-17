import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types/database';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['all', 'electronics', 'clothing', 'services', 'digital', 'collectibles', 'other'];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productImageText}>{product.category.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.productCategory}>{product.category}</Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>${product.price_usdc.toFixed(2)}</Text>
          <Text style={styles.productCurrency}>USDC</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function MarketplaceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { products, loading, refetch } = useProducts();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.logoText}>GHETTO FINANCE</Text>
            <Text style={styles.subtitle}>P2P Marketplace</Text>
          </View>
          <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
            <View style={styles.cartIcon}>
              <Text style={styles.cartIconText}>B</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => handleProductPress(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading...' : 'No products found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {loading ? 'Fetching latest listings' : 'Try a different search or category'}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.caption,
    letterSpacing: 1,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
  },
  categoryList: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: colors.primary,
  },
  productList: {
    padding: spacing.lg,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  productImagePlaceholder: {
    height: 120,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textMuted,
  },
  productInfo: {
    padding: spacing.md,
  },
  productTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productCategory: {
    ...typography.caption,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  productCurrency: {
    ...typography.caption,
    color: colors.accentDim,
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
  },
});
