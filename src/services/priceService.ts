import { logger } from '../utils/logger';

interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60000; // 1 minute cache

const priceCache = new Map<string, { price: TokenPrice; timestamp: number }>();

const TOKEN_ID_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum'
};

export async function fetchTokenPrice(symbol: string): Promise<TokenPrice | null> {
  const coinId = TOKEN_ID_MAP[symbol.toUpperCase()];
  if (!coinId) {
    logger.warn(`Token ${symbol} not found in price mapping`, 'priceService');
    return null;
  }

  const cached = priceCache.get(coinId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CoinGeckoPrice = await response.json();

    if (!data[coinId]) {
      return null;
    }

    const price: TokenPrice = data[coinId];
    priceCache.set(coinId, { price, timestamp: Date.now() });

    return price;
  } catch (error) {
    logger.error(`Error fetching price for ${symbol}`, 'priceService', error);
    return null;
  }
}

export async function fetchMultipleTokenPrices(symbols: string[]): Promise<Map<string, TokenPrice>> {
  const coinIds = symbols
    .map(s => TOKEN_ID_MAP[s.toUpperCase()])
    .filter(Boolean);

  if (coinIds.length === 0) {
    return new Map();
  }

  const uncachedIds: string[] = [];
  const result = new Map<string, TokenPrice>();

  for (const symbol of symbols) {
    const coinId = TOKEN_ID_MAP[symbol.toUpperCase()];
    if (!coinId) continue;

    const cached = priceCache.get(coinId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      result.set(symbol, cached.price);
    } else {
      uncachedIds.push(coinId);
    }
  }

  if (uncachedIds.length > 0) {
    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${uncachedIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoPrice = await response.json();

      for (const [coinId, priceData] of Object.entries(data)) {
        priceCache.set(coinId, { price: priceData, timestamp: Date.now() });

        const symbol = Object.keys(TOKEN_ID_MAP).find(
          key => TOKEN_ID_MAP[key] === coinId
        );

        if (symbol) {
          result.set(symbol, priceData);
        }
      }
    } catch (error) {
      logger.error('Error fetching multiple token prices', 'priceService', error);
    }
  }

  return result;
}

export async function getExchangeRate(fromToken: string, toToken: string): Promise<number | null> {
  if (fromToken === toToken) return 1;

  const [fromPrice, toPrice] = await Promise.all([
    fetchTokenPrice(fromToken),
    fetchTokenPrice(toToken)
  ]);

  if (!fromPrice || !toPrice) {
    return null;
  }

  return fromPrice.usd / toPrice.usd;
}

export function clearPriceCache(): void {
  priceCache.clear();
}
