import { useState, useEffect } from 'react';
import { TradeOrder, ExchangeRate } from '../types';
import { fetchTokenPrice, getExchangeRate } from '../services/priceService';
import { logger } from '../utils/logger';

export function useExchange() {
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRates = async () => {
      const tokens = ['BTC', 'ETH', 'SOL', 'USDC', 'MATIC', 'BNB'];
      const ratesList: ExchangeRate[] = [];

      for (const token of tokens) {
        const price = await fetchTokenPrice(token);
        if (price) {
          ratesList.push({
            from: token,
            to: 'USD',
            rate: price.usd,
            timestamp: new Date(price.last_updated_at * 1000)
          });
        }
      }

      setRates(ratesList);
    };

    loadRates();
    const interval = setInterval(loadRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRate = async (from: string, to: string): Promise<number> => {
    if (from === to) return 1;

    const rate = await getExchangeRate(from, to);
    return rate || 0;
  };

  const placeBuyOrder = async (
    pair: string,
    amount: number,
    orderType: 'market' | 'limit',
    price?: number
  ) => {
    setIsLoading(true);
    try {
      const newOrder: TradeOrder = {
        id: `order_${Date.now()}`,
        type: 'buy',
        orderType,
        pair,
        amount,
        price,
        filled: orderType === 'market' ? amount : 0,
        status: orderType === 'market' ? 'filled' : 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setOrders(prev => [newOrder, ...prev]);
      return newOrder.id;
    } catch (error) {
      logger.error('Buy order failed', 'useExchange', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const placeSellOrder = async (
    pair: string,
    amount: number,
    orderType: 'market' | 'limit',
    price?: number
  ) => {
    setIsLoading(true);
    try {
      const newOrder: TradeOrder = {
        id: `order_${Date.now()}`,
        type: 'sell',
        orderType,
        pair,
        amount,
        price,
        filled: orderType === 'market' ? amount : 0,
        status: orderType === 'market' ? 'filled' : 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setOrders(prev => [newOrder, ...prev]);
      return newOrder.id;
    } catch (error) {
      logger.error('Sell order failed', 'useExchange', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled' as const, updatedAt: new Date() }
          : order
      ));
    } catch (error) {
      logger.error('Cancel order failed', 'useExchange', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderBook = (pair: string) => {
    return {
      bids: [],
      asks: [],
    };
  };

  return {
    orders,
    rates,
    isLoading,
    getRate,
    placeBuyOrder,
    placeSellOrder,
    cancelOrder,
    getOrderBook,
  };
}