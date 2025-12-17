'use client';

import { useState, useEffect } from 'react';
import { Snapshot } from '@/types';
import { getSnapshots, createSnapshot, deleteSnapshot, createAuditLog } from '@/lib/firestore';
import { useAuth } from './useAuth';

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSnapshots = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getSnapshots(); // Sin filtro por usuario
      setSnapshots(data);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [user]);

  const addSnapshot = async (fecha?: Date) => {
    if (!user) throw new Error('Usuario no autenticado');

    const id = await createSnapshot(user.uid, fecha);

    // Crear audit log
    await createAuditLog('snapshot_created', 'snapshot', user.uid, user.email, id, {
      fecha: fecha?.toISOString() || new Date().toISOString(),
    });

    await fetchSnapshots();
    return id;
  };

  const removeSnapshot = async (id: string) => {
    // Obtener el snapshot antes de eliminarlo para el audit log
    const snapshot = snapshots.find((s) => s.id === id);

    await deleteSnapshot(id);

    // Crear audit log
    if (user && snapshot) {
      await createAuditLog('snapshot_deleted', 'snapshot', user.uid, user.email, id, {
        nombre: snapshot.nombre,
        totalTurnos: snapshot.totalTurnos,
        totalHoras: snapshot.totalHoras,
      });
    }

    await fetchSnapshots();
  };

  return {
    snapshots,
    loading,
    addSnapshot,
    removeSnapshot,
    refetch: fetchSnapshots,
  };
}
