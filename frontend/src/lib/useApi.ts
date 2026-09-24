import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { ApiError } from './api';

interface ApiState<T> {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  setData: (updater: (current: T | undefined) => T | undefined) => void;
}

/**
 * Load data when the screen gains focus, so lists stay fresh after navigating back.
 * `deps` should list every value the loader closes over.
 */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestId = useRef(0);
  const loaderRef = useRef(loader);
  const depsKey = JSON.stringify(deps);

  useLayoutEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current;
      if (mode === 'refresh') setIsRefreshing(true);
      try {
        const result = await loaderRef.current();
        if (id === requestId.current) {
          setDataState(result);
          setError(null);
        }
      } catch (e) {
        if (id === requestId.current) {
          setError(e instanceof ApiError ? e.message : 'Something went wrong.');
        }
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  // Refetch on focus, and whenever the dependencies change while focused. depsKey is
  // listed only to re-trigger the effect; the loader itself is read from loaderRef.
  useFocusEffect(
    useCallback(() => {
      void run('initial');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, depsKey]),
  );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh: () => run('refresh'),
    setData: (updater) => setDataState(updater),
  };
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong.';
}
