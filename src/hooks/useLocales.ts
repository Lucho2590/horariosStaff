'use client';

import { useState, useEffect } from 'react';
import { Locale } from '@/types';
import { getLocales, createLocale, updateLocale, deleteLocale } from '@/lib/firestore';
import { useAuth } from './useAuth';

export function useLocales() {
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLocales = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getLocales(); // Sin filtro por usuario
      setLocales(data);
    } catch (error) {
      console.error('Error fetching locales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocales();
  }, [user]);

  const addLocale = async (data: Omit<Locale, 'id' | 'createdAt'>) => {
    const id = await createLocale(data);
    await fetchLocales();
    return id;
  };

  const editLocale = async (id: string, data: Partial<Omit<Locale, 'id' | 'createdAt'>>) => {
    await updateLocale(id, data);
    await fetchLocales();
  };

  const removeLocale = async (id: string) => {
    await deleteLocale(id);
    await fetchLocales();
  };

  return {
    locales,
    loading,
    addLocale,
    editLocale,
    removeLocale,
    refetch: fetchLocales,
  };
}
