import { useState, useEffect } from 'react';

/**
 * Custom hook for debounced search input
 * Delays the search query update until user stops typing
 * 
 * @param value - The current search value
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState("");
 * const debouncedSearch = useDebouncedSearch(searchQuery, 500);
 * 
 * // Use debouncedSearch for API calls
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export function useDebouncedSearch<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

