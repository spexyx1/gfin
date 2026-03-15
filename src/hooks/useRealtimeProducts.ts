import { useEffect, useState } from 'react';
import { realtimeService, ProductChangePayload } from '../services/realtimeService';
import { Product } from '../types';

interface UseRealtimeProductsOptions {
  sellerId?: string;
  category?: string;
  onProductAdded?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
  onProductDeleted?: (product: Product) => void;
}

export function useRealtimeProducts(options: UseRealtimeProductsOptions = {}) {
  const [realtimeProducts, setRealtimeProducts] = useState<Product[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleProductChange = (payload: ProductChangePayload) => {
      setLastUpdate(new Date());

      switch (payload.event) {
        case 'INSERT':
          setRealtimeProducts((prev) => [...prev, payload.product]);
          options.onProductAdded?.(payload.product);
          break;

        case 'UPDATE':
          setRealtimeProducts((prev) =>
            prev.map((p) => (p.id === payload.product.id ? payload.product : p))
          );
          options.onProductUpdated?.(payload.product);
          break;

        case 'DELETE':
          setRealtimeProducts((prev) => prev.filter((p) => p.id !== payload.product.id));
          options.onProductDeleted?.(payload.product);
          break;
      }
    };

    const subscription = realtimeService.subscribeToProducts(handleProductChange, {
      sellerId: options.sellerId,
      category: options.category,
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [options.sellerId, options.category]);

  return {
    realtimeProducts,
    lastUpdate,
  };
}
