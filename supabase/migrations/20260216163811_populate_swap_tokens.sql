/*
  # Populate Supported Swap Tokens for GHETTO Trading

  1. Initial Token Configuration
    - GHETTO on Polygon (chain_id 137)
    - USDC on multiple chains (Polygon, Ethereum)
    - ETH on Ethereum (chain_id 1)
    - BTC - uses wrapped version on Polygon
    - BCH - uses wrapped version on Polygon
    - BNB on BNB Chain (chain_id 56)
    - SOL - uses wrapped version on Polygon
    - XRP - uses wrapped version on Polygon

  2. Notes
    - All tokens are initially marked as active
    - Gasless transactions enabled for GHETTO on Polygon
    - Token addresses are for Polygon mainnet where applicable
    - Cross-chain swaps will require bridge integration
*/

-- Insert GHETTO token on Polygon
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  137,
  'Polygon',
  '0x0000000000000000000000000000000000000000', -- Will be updated with actual deployed address
  'GHETTO',
  'Ghetto Token',
  18,
  true,
  true,
  null
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  is_gasless_enabled = EXCLUDED.is_gasless_enabled;

-- Insert USDC on Polygon
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  137,
  'Polygon',
  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', -- USDC native on Polygon
  'USDC',
  'USD Coin',
  6,
  false,
  true,
  'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insert USDC on Ethereum
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  1,
  'Ethereum',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', -- USDC on Ethereum
  'USDC',
  'USD Coin',
  6,
  false,
  true,
  'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insert WETH on Polygon
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  137,
  'Polygon',
  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', -- WETH on Polygon
  'WETH',
  'Wrapped Ethereum',
  18,
  false,
  true,
  'https://cryptologos.cc/logos/ethereum-eth-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insert WBTC on Polygon
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  137,
  'Polygon',
  '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', -- WBTC on Polygon
  'WBTC',
  'Wrapped Bitcoin',
  8,
  false,
  true,
  'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insert BNB on BNB Chain
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  56,
  'BNB Chain',
  '0x0000000000000000000000000000000000000000', -- Native BNB
  'BNB',
  'BNB',
  18,
  false,
  true,
  'https://cryptologos.cc/logos/bnb-bnb-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insert Wrapped SOL on Polygon
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  137,
  'Polygon',
  '0xd93f7E271cB87c23AaA73edC008A79646d1F9912', -- Wrapped SOL on Polygon
  'SOL',
  'Wrapped Solana',
  9,
  false,
  true,
  'https://cryptologos.cc/logos/solana-sol-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insert POL (native Polygon token)
INSERT INTO public.supported_swap_tokens (
  chain_id,
  chain_name,
  token_address,
  token_symbol,
  token_name,
  token_decimals,
  is_gasless_enabled,
  is_active,
  icon_url
) VALUES
(
  137,
  'Polygon',
  '0x0000000000000000000000000000000000001010', -- Native POL token address on Polygon
  'POL',
  'Polygon Ecosystem Token',
  18,
  false,
  true,
  'https://cryptologos.cc/logos/polygon-matic-logo.png'
)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Note: BCH and XRP wrapped versions would need to be added when bridge partners are established
-- These tokens are less common on Polygon and may require custom bridge solutions
