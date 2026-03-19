/*
  # Security Fix Part 4: Remove Duplicate Index

  1. Changes
    - Remove duplicate index on auctions table
    - Keep auctions_seller_id_idx, remove idx_auctions_seller_id

  2. Security
    - Duplicate indexes waste space and slow down writes
    - This improves overall database performance
*/

-- Remove duplicate index (keep auctions_seller_id_idx, remove idx_auctions_seller_id)
DROP INDEX IF EXISTS idx_auctions_seller_id;
