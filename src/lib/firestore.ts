import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Locale, Personal, Asignacion, Snapshot, AuditLog, AuditAction } from '@/types';

// ==================== LOCALES ====================

export async function createLocale(data: Omit<Locale, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'locales'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateLocale(id: string, data: Partial<Omit<Locale, 'id' | 'createdAt'>>) {
  const docRef = doc(db, 'locales', id);
  await updateDoc(docRef, data);
}

export async function deleteLocale(id: string) {
  const docRef = doc(db, 'locales', id);
  await deleteDoc(docRef);
}

export async function getLocale(id: string): Promise<Locale | null> {
  const docRef = doc(db, 'locales', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Locale;
  }

  return null;
}

export async function getLocales(userId?: string): Promise<Locale[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (userId) {
    constraints.unshift(where('createdBy', '==', userId));
  }

  const q = query(collection(db, 'locales'), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Locale[];
}

// ==================== PERSONAL ====================

export async function createPersonal(data: Omit<Personal, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'personal'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePersonal(id: string, data: Partial<Omit<Personal, 'id' | 'createdAt'>>) {
  const docRef = doc(db, 'personal', id);
  await updateDoc(docRef, data);
}

export async function deletePersonal(id: string) {
  const docRef = doc(db, 'personal', id);
  await deleteDoc(docRef);
}

export async function getPersonal(id: string): Promise<Personal | null> {
  const docRef = doc(db, 'personal', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Personal;
  }

  return null;
}

export async function getAllPersonal(userId?: string): Promise<Personal[]> {
  const constraints: QueryConstraint[] = [orderBy('apellido', 'asc')];

  if (userId) {
    constraints.unshift(where('createdBy', '==', userId));
  }

  const q = query(collection(db, 'personal'), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Personal[];
}

// ==================== ASIGNACIONES ====================

export async function createAsignacion(data: Omit<Asignacion, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'asignaciones'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAsignacion(id: string, data: Partial<Omit<Asignacion, 'id' | 'createdAt'>>) {
  const docRef = doc(db, 'asignaciones', id);
  await updateDoc(docRef, data);
}

export async function deleteAsignacion(id: string) {
  const docRef = doc(db, 'asignaciones', id);
  await deleteDoc(docRef);
}

export async function getAsignacion(id: string): Promise<Asignacion | null> {
  const docRef = doc(db, 'asignaciones', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Asignacion;
  }

  return null;
}

export async function getAsignaciones(filters?: {
  localeId?: string;
  personalId?: string;
  activo?: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
}): Promise<Asignacion[]> {
  const constraints: QueryConstraint[] = [orderBy('fecha', 'asc')];

  if (filters?.localeId) {
    constraints.unshift(where('localeId', '==', filters.localeId));
  }

  if (filters?.personalId) {
    constraints.unshift(where('personalId', '==', filters.personalId));
  }

  if (filters?.activo !== undefined) {
    constraints.unshift(where('activo', '==', filters.activo));
  }

  if (filters?.fechaInicio) {
    constraints.push(where('fecha', '>=', filters.fechaInicio));
  }

  if (filters?.fechaFin) {
    constraints.push(where('fecha', '<=', filters.fechaFin));
  }

  const q = query(collection(db, 'asignaciones'), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Asignacion[];
}

// Función helper para mover una asignación a otro local
export async function moverAsignacionALocal(asignacionId: string, nuevoLocaleId: string) {
  await updateAsignacion(asignacionId, { localeId: nuevoLocaleId });
}

// ==================== SNAPSHOTS ====================

// Helper para calcular total de horas de una lista de asignaciones
function calcularTotalHoras(asignaciones: Asignacion[]): number {
  return asignaciones.reduce((total, asig) => {
    const [horaInicioH, horaInicioM] = asig.horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = asig.horaFin.split(':').map(Number);
    const horas = (horaFinH + horaFinM / 60) - (horaInicioH + horaInicioM / 60);
    return total + horas;
  }, 0);
}

// Helper para obtener el lunes de una fecha
function obtenerLunesDeSemana(fecha: Date): Date {
  const dia = fecha.getDay();
  const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar al lunes
  return new Date(fecha.setDate(diff));
}

// Helper para obtener el domingo de una fecha
function obtenerDomingoDeSemana(fecha: Date): Date {
  const lunes = obtenerLunesDeSemana(new Date(fecha));
  return new Date(lunes.setDate(lunes.getDate() + 6));
}

// Helper para formatear nombre de semana
function formatearNombreSemana(lunes: Date, domingo: Date): string {
  const formatearFecha = (fecha: Date) => {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  return `Semana del ${formatearFecha(lunes)} al ${formatearFecha(domingo)}`;
}

export async function createSnapshot(
  userId: string,
  fecha?: Date // Si no se provee, usa la semana actual
): Promise<string> {
  const fechaBase = fecha || new Date();
  const lunes = obtenerLunesDeSemana(new Date(fechaBase));
  const domingo = obtenerDomingoDeSemana(new Date(fechaBase));

  // Obtener todas las asignaciones activas
  const asignaciones = await getAsignaciones({ activo: true });

  // Calcular estadísticas
  const totalHoras = calcularTotalHoras(asignaciones);
  const totalTurnos = asignaciones.length;
  const nombre = formatearNombreSemana(lunes, domingo);

  // Crear el snapshot
  const docRef = await addDoc(collection(db, 'snapshots'), {
    nombre,
    semanaInicio: lunes,
    semanaFin: domingo,
    asignaciones,
    totalHoras,
    totalTurnos,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });

  return docRef.id;
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
  const docRef = doc(db, 'snapshots', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Snapshot;
  }

  return null;
}

export async function getSnapshots(userId?: string): Promise<Snapshot[]> {
  const constraints: QueryConstraint[] = [orderBy('semanaInicio', 'desc')];

  if (userId) {
    constraints.unshift(where('createdBy', '==', userId));
  }

  const q = query(collection(db, 'snapshots'), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Snapshot[];
}

export async function deleteSnapshot(id: string) {
  const docRef = doc(db, 'snapshots', id);
  await deleteDoc(docRef);
}

// ==================== AUDIT LOGS ====================

export async function createAuditLog(
  action: AuditAction,
  entityType: 'asignacion' | 'snapshot',
  userId: string,
  userEmail: string | null | undefined,
  entityId?: string,
  details?: Record<string, any>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'auditLogs'), {
    action,
    entityType,
    entityId,
    details: details || {},
    userId,
    userEmail: userEmail || '',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: 'asignacion' | 'snapshot';
  entityId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (filters?.userId) {
    constraints.unshift(where('userId', '==', filters.userId));
  }

  if (filters?.entityType) {
    constraints.unshift(where('entityType', '==', filters.entityType));
  }

  if (filters?.entityId) {
    constraints.unshift(where('entityId', '==', filters.entityId));
  }

  const q = query(collection(db, 'auditLogs'), ...constraints);
  const querySnapshot = await getDocs(q);

  let logs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];

  // Apply limit if specified (after fetching since Firestore limit doesn't work well with multiple where clauses)
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
}
