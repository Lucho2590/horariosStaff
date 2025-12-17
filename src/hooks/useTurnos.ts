'use client';

import { useState, useEffect } from 'react';
import { Asignacion, AsignacionConDetalles, Personal, Locale } from '@/types';
import {
  getAsignaciones,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
  getPersonal,
  getLocale,
  moverAsignacionALocal,
  createAuditLog,
} from '@/lib/firestore';
import { useAuth } from './useAuth';

export function useTurnos(filters?: { localeId?: string; personalId?: string; activo?: boolean; fechaInicio?: Date; fechaFin?: Date }) {
  const [asignaciones, setAsignaciones] = useState<AsignacionConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAsignaciones = async () => {
    setLoading(true);
    try {
      const data = await getAsignaciones(filters);

      // Enriquecer con datos de personal y locale
      const enriched = await Promise.all(
        data.map(async (asignacion) => {
          const personal = await getPersonal(asignacion.personalId);
          const locale = await getLocale(asignacion.localeId);

          return {
            ...asignacion,
            personal: personal || undefined,
            locale: locale || undefined,
          } as AsignacionConDetalles;
        })
      );

      setAsignaciones(enriched);
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
  }, [filters?.localeId, filters?.personalId, filters?.activo, filters?.fechaInicio?.getTime(), filters?.fechaFin?.getTime()]);

  const addAsignacion = async (data: Omit<Asignacion, 'id' | 'createdAt'>) => {
    const id = await createAsignacion(data);

    // Crear audit log
    if (user) {
      await createAuditLog('asignacion_created', 'asignacion', user.uid, user.email, id, {
        personalId: data.personalId,
        localeId: data.localeId,
        fecha: data.fecha instanceof Date ? data.fecha.toISOString() : new Date().toISOString(),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
      });
    }

    await fetchAsignaciones();
    return id;
  };

  const editAsignacion = async (id: string, data: Partial<Omit<Asignacion, 'id' | 'createdAt'>>) => {
    await updateAsignacion(id, data);

    // Crear audit log
    if (user) {
      await createAuditLog('asignacion_updated', 'asignacion', user.uid, user.email, id, data);
    }

    await fetchAsignaciones();
  };

  const removeAsignacion = async (id: string) => {
    // Obtener datos de la asignación antes de eliminarla para el audit log
    const asignacion = asignaciones.find((a) => a.id === id);

    await deleteAsignacion(id);

    // Crear audit log
    if (user && asignacion) {
      const fechaAsignacion = asignacion.fecha instanceof Date ? asignacion.fecha : (asignacion.fecha as any).toDate();

      await createAuditLog('asignacion_deleted', 'asignacion', user.uid, user.email, id, {
        personalId: asignacion.personalId,
        localeId: asignacion.localeId,
        fecha: fechaAsignacion.toISOString(),
      });
    }

    await fetchAsignaciones();
  };

  const moverAsignacion = async (asignacionId: string, nuevoLocaleId: string) => {
    // Obtener el locale anterior para el audit log
    const asignacion = asignaciones.find((a) => a.id === asignacionId);
    const localeAnterior = asignacion?.localeId;

    await moverAsignacionALocal(asignacionId, nuevoLocaleId);

    // Crear audit log
    if (user) {
      await createAuditLog('asignacion_moved', 'asignacion', user.uid, user.email, asignacionId, {
        localeAnterior,
        localeNuevo: nuevoLocaleId,
      });
    }

    await fetchAsignaciones();
  };

  return {
    asignaciones,
    loading,
    addAsignacion,
    editAsignacion,
    removeAsignacion,
    moverAsignacion,
    refetch: fetchAsignaciones,
  };
}
