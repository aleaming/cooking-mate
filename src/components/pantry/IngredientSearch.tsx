'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchIngredients } from '@/lib/utils/ingredientMatching';
import { MasterIngredient } from '@/types';

interface IngredientSearchProps {
  onSelect: (ingredient: MasterIngredient) => void;
  excludeIds?: Set<string>;
  placeholder?: string;
}

export function IngredientSearch({
  onSelect,
  excludeIds = new Set(),
  placeholder = 'Search for ingredients...',
}: IngredientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MasterIngredient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 1) {
      const matches = searchIngredients(query);
      // Filter out already selected ingredients
      const filtered = matches.filter((ing) => !excludeIds.has(ing.id));
      setResults(filtered.slice(0, 8));
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, excludeIds]);

  const handleSelect = (ingredient: MasterIngredient) => {
    onSelect(ingredient);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 1 && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-11 text-lg rounded-xl border border-sand-200 dark:border-sand-700 focus:border-olive-400 focus:ring-2 focus:ring-olive-100 dark:focus:ring-olive-900/30 outline-none transition-colors bg-card text-olive-800 placeholder:text-sand-400"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-card rounded-xl shadow-lg border border-sand-200 dark:border-sand-700 overflow-hidden"
          >
            {results.map((ingredient, index) => (
              <button
                key={ingredient.id}
                onClick={() => handleSelect(ingredient)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full px-4 py-3 text-left flex items-center justify-between
                  ${index === highlightedIndex ? 'bg-olive-50 dark:bg-olive-900/30' : 'hover:bg-sand-50 dark:hover:bg-sand-800'}
                  ${index !== results.length - 1 ? 'border-b border-sand-100 dark:border-sand-700' : ''}
                `}
              >
                <span className="text-olive-800">{ingredient.name}</span>
                <span className="text-xs text-sand-500">
                  {ingredient.frequency} {ingredient.frequency === 1 ? 'recipe' : 'recipes'}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
