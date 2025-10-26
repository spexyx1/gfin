import { useState, useEffect } from 'react';
import { TradeOrder, ExchangeRate } from '../types';

export function useExchange() {
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock exchange rates
  useEffect(() => {
    const mockRates: ExchangeRate[] = [
      { from: 'BTC', to: 'USD', rate: 43250.00, timestamp: new Date() },
      { from: 'ETH', to: 'USD', rate: 2650.00, timestamp: new Date() },
      { from: 'SOL', to: 'USD', rate: 125.50, timestamp: new Date() },
      { from: 'USDC', to: 'USD', rate: 1.00, timestamp: new Date() },
      { from: 'BTC', to: 'ETH', rate: 16.32, timestamp: new Date() },
      { from: 'ETH', to: 'SOL', rate: 21.12, timestamp: new Date() },
    ];
    setRates(mockRates);

    // Mock existing orders
    const mockOrders: TradeOrder[] = [
      {
        id: 'order1',
        type: 'buy',
        orderType: 'limit',
        pair: 'ETH/USDC',
        amount: 1.0,
        price: 2600,
        filled: 0,
        status: 'open',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'order2',
        type: 'sell',
        orderType: 'market',
        pair: 'BTC/USDC',
        amount: 0.01,
        filled: 0.01,
        status: 'filled',
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 7000000),
      },
    ];
    setOrders(mockOrders);
  }, []);

  const getRate = (from: string, to: string): number => {
    const rate = rates.find(r => r.from === from && r.to === to);
    if (rate) return rate.rate;
    
    // Try reverse rate
    const reverseRate = rates.find(r => r.from === to && r.to === from);
    if (reverseRate) return 1 / reverseRate.rate;
    
    return 0;
  };

  const placeBuyOrder = async (
    pair: string,
    amount: number,
    orderType: 'market' | 'limit',
    price?: number
  ) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      console.error('Buy order failed:', error);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      console.error('Sell order failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' as const, updatedAt: new Date() }
          : order
      ));
    } catch (error) {
      console.error('Cancel order failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderBook = (pair: string) => {
    // Mock order book data
    return {
      bids: [
        { price: 2645, amount: 1.5 },
        { price: 2640, amount: 2.1 },
        { price: 2635, amount: 0.8 },
      ],
      asks: [
        { price: 2655, amount: 1.2 },
        { price: 2660, amount: 1.8 },
        { price: 2665, amount: 2.5 },
      ],
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