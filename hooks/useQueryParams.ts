import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for managing URL query parameters in Next.js App Router
 * Provides clean API for reading and writing query params
 * 
 * @example
 * const { get, set, remove, setMultiple } = useQueryParams();
 * 
 * // Read a param
 * const difficulty = get('difficulty'); // "beginner"
 * 
 * // Set a param
 * set('difficulty', 'intermediate');
 * 
 * // Set multiple params
 * setMultiple({ difficulty: 'beginner', year: '2024' });
 * 
 * // Remove a param
 * remove('difficulty');
 */
export function useQueryParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Get a query parameter value
   */
  const get = useCallback(
    (key: string): string | null => {
      return searchParams?.get(key) || null;
    },
    [searchParams]
  );

  /**
   * Get all values for a query parameter (for array params)
   */
  const getAll = useCallback(
    (key: string): string[] => {
      return searchParams?.getAll(key) || [];
    },
    [searchParams]
  );

  /**
   * Set a single query parameter
   */
  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(key, value);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  /**
   * Set multiple query parameters at once
   */
  const setMultiple = useCallback(
    (updates: Record<string, string | number | boolean>) => {
      const params = new URLSearchParams(searchParams?.toString());
      
      Object.entries(updates).forEach(([key, value]) => {
        params.set(key, String(value));
      });
      
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  /**
   * Remove a query parameter
   */
  const remove = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.delete(key);
      
      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname);
    },
    [router, searchParams]
  );

  /**
   * Remove multiple query parameters
   */
  const removeMultiple = useCallback(
    (keys: string[]) => {
      const params = new URLSearchParams(searchParams?.toString());
      
      keys.forEach((key) => params.delete(key));
      
      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname);
    },
    [router, searchParams]
  );

  /**
   * Clear all query parameters
   */
  const clear = useCallback(() => {
    router.push(window.location.pathname);
  }, [router]);

  /**
   * Check if a query parameter exists
   */
  const has = useCallback(
    (key: string): boolean => {
      return searchParams?.has(key) || false;
    },
    [searchParams]
  );

  /**
   * Get all query parameters as an object
   */
  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams?.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    get,
    getAll,
    set,
    setMultiple,
    remove,
    removeMultiple,
    clear,
    has,
    getAllParams,
  };
}

