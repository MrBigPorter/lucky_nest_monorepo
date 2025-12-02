import { useState, useEffect, useCallback } from 'react';

// Generic hook to handle list data with simulated delay
export function useMockData<T>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Simulate fetch
  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  }, []);

  const add = (item: T) => {
    setLoading(true);
    setTimeout(() => {
      setData((prev) => [...prev, item]);
      setLoading(false);
    }, 500);
  };

  const update = (id: string, updatedItem: Partial<T>) => {
    setLoading(true);
    setTimeout(() => {
      setData((prev) =>
        prev.map((item: any) =>
          item.id === id ? { ...item, ...updatedItem } : item,
        ),
      );
      setLoading(false);
    }, 500);
  };

  const remove = (id: string, requireConfirm = true) => {
    if (
      requireConfirm &&
      !window.confirm('Are you sure you want to delete this item?')
    )
      return;
    setLoading(true);
    setTimeout(() => {
      setData((prev) => prev.filter((item: any) => item.id !== id));
      setLoading(false);
    }, 500);
  };

  return { data, loading, add, update, remove, refresh };
}
