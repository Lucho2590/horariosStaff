import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  createdAt: Timestamp;
  role: 'owner' | 'admin';
}

export interface Locale {
  id: string;
  nombre: string;
  direccion?: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Asignacion {
  id: string;
  personalId: string;
  localeId: string;
  fecha: Timestamp; // Fecha específica del turno
  horaInicio: string; // formato "HH:mm"
  horaFin: string; // formato "HH:mm"
  activo: boolean;
  createdAt: Timestamp;
}

export interface AsignacionConDetalles extends Asignacion {
  personal?: Personal;
  locale?: Locale;
}

export interface Snapshot {
  id: string;
  nombre: string; // ej: "Semana del 15/12 al 21/12"
  semanaInicio: Timestamp; // Lunes de esa semana
  semanaFin: Timestamp; // Domingo de esa semana
  asignaciones: Asignacion[]; // Copia de todas las asignaciones activas
  totalHoras: number; // Total de horas de la semana
  totalTurnos: number; // Total de turnos
  createdAt: Timestamp;
  createdBy: string;
}

export type AuditAction =
  | 'asignacion_created'
  | 'asignacion_updated'
  | 'asignacion_deleted'
  | 'asignacion_moved'
  | 'semana_completa_created'
  | 'snapshot_created'
  | 'snapshot_deleted';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: 'asignacion' | 'snapshot';
  entityId?: string; // ID de la entidad afectada
  details: Record<string, any>; // Detalles específicos de la acción
  userId: string;
  userEmail?: string;
  createdAt: Timestamp;
}

export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;
