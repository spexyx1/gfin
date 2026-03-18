import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex space-x-3 overflow-x-auto pb-2">
      <button
        onClick={() => onCategoryChange('All')}
        className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-black uppercase ${
          selectedCategory === 'All'
            ? 'bg-luxe-gold text-black neon-blue-glow'
            : 'luxe-glass text-gray-300 hover:luxe-glass hover:text-gray-200'
        } active:btn-neon-active`}
      >
        ALL CATEGORIES
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-black uppercase ${
            selectedCategory === category
              ? 'bg-luxe-gold text-black neon-blue-glow'
              : 'luxe-glass text-gray-300 hover:luxe-glass hover:text-gray-200'
          } active:btn-neon-active`}
        >
          {category.toUpperCase()}
        </button>
      ))}
    </div>
  );
};