#!/bin/bash

# Comprehensive script to update all components to dark luxe design
# This script performs batch replacements across all component files

echo "Updating components to dark luxe design..."

# Find all TSX files in components directory
find src/components -name "*.tsx" -type f | while read file; do
  echo "Processing: $file"

  # Replace gray backgrounds
  sed -i 's/bg-gray-900/luxe-glass-strong/g' "$file"
  sed -i 's/bg-gray-800/luxe-glass/g' "$file"
  sed -i 's/bg-gray-700/luxe-glass/g' "$file"

  # Replace gray borders
  sed -i 's/border-gray-800/border-white\/10/g' "$file"
  sed -i 's/border-gray-700/border-white\/10/g' "$file"

  # Replace neon colors with luxe colors
  sed -i 's/text-neon-blue/text-luxe-gold/g' "$file"
  sed -i 's/text-neon-yellow/text-luxe-gold/g' "$file"
  sed -i 's/text-neon-orange/text-luxe-gold/g' "$file"
  sed -i 's/text-neon-red/text-red-400/g' "$file"
  sed -i 's/text-neon-green/text-luxe-green/g' "$file"

  sed -i 's/bg-neon-blue/bg-luxe-gold/g' "$file"
  sed -i 's/bg-neon-yellow/bg-luxe-gold/g' "$file"
  sed -i 's/bg-neon-orange/bg-luxe-gold/g' "$file"
  sed -i 's/bg-neon-red/bg-red-500/g' "$file"
  sed -i 's/bg-neon-green/bg-luxe-green/g' "$file"

  sed -i 's/border-neon-blue/border-luxe-gold/g' "$file"
  sed -i 's/border-neon-yellow/border-luxe-gold/g' "$file"
  sed -i 's/border-neon-orange/border-luxe-gold/g' "$file"
  sed -i 's/border-neon-red/border-red-500/g' "$file"
  sed -i 's/border-neon-green/border-luxe-green/g' "$file"

  # Replace focus states
  sed -i 's/focus:ring-neon-blue/focus:ring-luxe-gold/g' "$file"
  sed -i 's/focus:ring-neon-yellow/focus:ring-luxe-gold/g' "$file"
  sed -i 's/focus:ring-apple-blue/focus:ring-luxe-gold/g' "$file"

  # Replace hover states
  sed -i 's/hover:bg-gray-700/hover:bg-white\/5/g' "$file"
  sed -i 's/hover:bg-gray-800/hover:bg-white\/10/g' "$file"

  # Replace apple style classes
  sed -i 's/apple-title/luxe-title/g' "$file"
  sed -i 's/apple-font/font-normal/g' "$file"
  sed -i 's/glass-morphism-strong/luxe-glass-strong/g' "$file"
  sed -i 's/glass-morphism/luxe-glass/g' "$file"
  sed -i 's/rounded-apple-lg/rounded-2xl/g' "$file"
  sed -i 's/rounded-apple/rounded-xl/g' "$file"

  # Replace apple color classes
  sed -i 's/text-apple-blue/text-luxe-gold/g' "$file"
  sed -i 's/text-apple-gray-400/text-gray-400/g' "$file"
  sed-i 's/text-apple-gray-500/text-gray-500/g' "$file"

  # Replace button classes
  sed -i 's/btn-apple-primary/luxe-btn-primary/g' "$file"
  sed -i 's/btn-apple-secondary/luxe-btn-secondary/g' "$file"

  # Replace hover effects
  sed -i 's/apple-hover/hover:bg-white\/5/g' "$file"
  sed -i 's/apple-focus/focus:ring-2 focus:ring-luxe-gold/g' "$file"

  # Fix disabled states
  sed -i 's/disabled:bg-gray-700/disabled:opacity-50/g' "$file"
  sed -i 's/disabled:bg-gray-800/disabled:opacity-50/g' "$file"
done

echo "Component design update complete!"
