'use client';

import { useState, useEffect } from 'react';
import { Personal } from '@/types';
import { getAllPersonal, createPersonal, updatePersonal, deletePersonal } from '@/lib/firestore';
import { useAuth } from './useAuth';

export function usePersonal() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPersonal = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getAllPersonal(); // Sin filtro por usuario
      setPersonal(data);
    } catch (error) {
      console.error('Error fetching personal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, [user]);

  const addPersonal = async (data: Omit<Personal, 'id' | 'createdAt'>) => {
    const id = await createPersonal(data);
    await fetchPersonal();
    return id;
  };

  const editPersonal = async (id: string, data: Partial<Omit<Personal, 'id' | 'createdAt'>>) => {
    await updatePersonal(id, data);
    await fetchPersonal();
  };

  const removePersonal = async (id: string) => {
    await deletePersonal(id);
    await fetchPersonal();
  };

  return {
    personal,
    loading,
    addPersonal,
    editPersonal,
    removePersonal,
    refetch: fetchPersonal,
  };
}
