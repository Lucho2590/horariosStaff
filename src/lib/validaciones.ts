import { Asignacion, AsignacionConDetalles } from '@/types';

// Función para verificar si dos rangos de horarios se superponen
export function horariosSeSuperponen(
  hora1Inicio: string,
  hora1Fin: string,
  hora2Inicio: string,
  hora2Fin: string
): boolean {
  const [h1i_h, h1i_m] = hora1Inicio.split(':').map(Number);
  const [h1f_h, h1f_m] = hora1Fin.split(':').map(Number);
  const [h2i_h, h2i_m] = hora2Inicio.split(':').map(Number);
  const [h2f_h, h2f_m] = hora2Fin.split(':').map(Number);

  const inicio1 = h1i_h * 60 + h1i_m;
  const fin1 = h1f_h * 60 + h1f_m;
  const inicio2 = h2i_h * 60 + h2i_m;
  const fin2 = h2f_h * 60 + h2f_m;

  // Se superponen si el inicio de uno está antes del fin del otro
  return inicio1 < fin2 && inicio2 < fin1;
}

// Verificar si hay conflictos al crear una nueva asignación
export function verificarConflictos(
  personalId: string,
  fecha: Date,
  horaInicio: string,
  horaFin: string,
  asignacionesExistentes: (Asignacion | AsignacionConDetalles)[],
  asignacionActualId?: string // Para excluir al editar
): { hayConflicto: boolean; mensaje?: string } {
  // Normalizar la fecha (solo comparar día, mes, año)
  const fechaNormalizada = new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);

  // Filtrar solo las asignaciones del mismo empleado en la misma fecha
  const asignacionesMismaFecha = asignacionesExistentes.filter((a) => {
    const fechaAsignacion = a.fecha instanceof Date ? a.fecha : (a.fecha as any).toDate();
    const fechaAsignacionNormalizada = new Date(fechaAsignacion);
    fechaAsignacionNormalizada.setHours(0, 0, 0, 0);

    return (
      a.personalId === personalId &&
      fechaAsignacionNormalizada.getTime() === fechaNormalizada.getTime() &&
      a.activo &&
      a.id !== asignacionActualId // Excluir la asignación que estamos editando
    );
  });

  if (asignacionesMismaFecha.length === 0) {
    return { hayConflicto: false };
  }

  // Verificar superposición de horarios
  for (const asignacion of asignacionesMismaFecha) {
    if (horariosSeSuperponen(horaInicio, horaFin, asignacion.horaInicio, asignacion.horaFin)) {
      const localNombre = 'locale' in asignacion && asignacion.locale?.nombre
        ? asignacion.locale.nombre
        : 'otro local';

      return {
        hayConflicto: true,
        mensaje: `Este empleado ya tiene un turno este día de ${asignacion.horaInicio} a ${asignacion.horaFin} en ${localNombre}`,
      };
    }
  }

  return { hayConflicto: false };
}

// Verificar conflictos para múltiples asignaciones (semana completa)
export function verificarConflictosMultiples(
  personalId: string,
  asignaciones: { fecha: Date; horaInicio: string; horaFin: string }[],
  asignacionesExistentes: (Asignacion | AsignacionConDetalles)[]
): { hayConflicto: boolean; mensaje?: string; fechasConConflicto?: string[] } {
  const fechasConConflicto: string[] = [];

  for (const nuevaAsignacion of asignaciones) {
    const resultado = verificarConflictos(
      personalId,
      nuevaAsignacion.fecha,
      nuevaAsignacion.horaInicio,
      nuevaAsignacion.horaFin,
      asignacionesExistentes
    );

    if (resultado.hayConflicto) {
      const fechaStr = nuevaAsignacion.fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      });
      fechasConConflicto.push(fechaStr);
    }
  }

  if (fechasConConflicto.length > 0) {
    return {
      hayConflicto: true,
      mensaje: `Ya hay turnos asignados en: ${fechasConConflicto.join(', ')}`,
      fechasConConflicto,
    };
  }

  return { hayConflicto: false };
}
