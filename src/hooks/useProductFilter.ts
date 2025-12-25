import { useMemo } from 'react';
import { Product } from '../types';
import { SearchFilters } from '../components/AdvancedSearch';

export function useProductFilter(
  products: Product[],
  searchTerm: string,
  searchFilters: SearchFilters
) {
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesBasicSearch = searchTerm === '' ||
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAdvancedSearch = searchFilters.query === '' ||
        product.title.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        product.description.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchFilters.query.toLowerCase()));

      const matchesCategory = searchFilters.category === 'all' || product.category === searchFilters.category;
      const matchesPrice = product.price >= searchFilters.priceMin && product.price <= searchFilters.priceMax;
      const matchesSeller = searchFilters.seller === '' || product.seller.name === searchFilters.seller;
      const matchesVerified = !searchFilters.verifiedOnly || product.seller.verified;
      const matchesStock = !searchFilters.inStockOnly || product.inStock;
      const matchesTags = searchFilters.tags.length === 0 ||
        searchFilters.tags.some(tag => product.tags.includes(tag));

      return matchesBasicSearch && matchesAdvancedSearch && matchesCategory &&
             matchesPrice && matchesSeller && matchesVerified && matchesStock && matchesTags;
    });

    switch (searchFilters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.seller.rating - a.seller.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchTerm, searchFilters]);

  return filteredProducts;
}
