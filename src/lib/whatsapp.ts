import { Personal, AsignacionConDetalles, DIAS_SEMANA } from '@/types';

export function generarMensajeHorario(
  persona: Personal,
  asignaciones: AsignacionConDetalles[]
): string {
  if (asignaciones.length === 0) {
    return `Hola ${persona.nombre}! No tenés turnos asignados.`;
  }

  // Ordenar por fecha
  const asignacionesOrdenadas = [...asignaciones].sort((a, b) => {
    const fechaA = a.fecha instanceof Date ? a.fecha : (a.fecha as any).toDate();
    const fechaB = b.fecha instanceof Date ? b.fecha : (b.fecha as any).toDate();
    return fechaA.getTime() - fechaB.getTime();
  });

  // Agrupar por local
  const porLocal = asignacionesOrdenadas.reduce((acc, asig) => {
    const localNombre = asig.locale?.nombre || 'Sin local';
    if (!acc[localNombre]) {
      acc[localNombre] = [];
    }
    acc[localNombre].push(asig);
    return acc;
  }, {} as Record<string, AsignacionConDetalles[]>);

  // Construir mensaje
  let mensaje = `*Hola ${persona.nombre}!* 👋\n\n`;
  mensaje += `📅 *Tus turnos:*\n\n`;

  Object.entries(porLocal).forEach(([local, turnos]) => {
    if (Object.keys(porLocal).length > 1) {
      mensaje += `🏢 *${local}*\n`;
    }

    turnos.forEach(turno => {
      const fechaTurno = turno.fecha instanceof Date ? turno.fecha : (turno.fecha as any).toDate();
      const diaNombre = DIAS_SEMANA[fechaTurno.getDay()];
      const fechaFormateada = fechaTurno.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit'
      });

      mensaje += `• ${diaNombre} ${fechaFormateada}: ${turno.horaInicio} - ${turno.horaFin}\n`;
    });

    mensaje += `\n`;
  });

  // Calcular total de horas
  const totalHoras = asignaciones.reduce((total, asig) => {
    const [horaInicioH, horaInicioM] = asig.horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = asig.horaFin.split(':').map(Number);
    const horas = (horaFinH + horaFinM / 60) - (horaInicioH + horaInicioM / 60);
    return total + horas;
  }, 0);

  mensaje += `⏰ *Total:* ${totalHoras.toFixed(1)} horas\n\n`;
  mensaje += `_Enviado desde MDQApps Turnos_`;

  return mensaje;
}

export function enviarPorWhatsApp(telefono: string, mensaje: string) {
  // Limpiar el teléfono (quitar espacios, guiones, etc)
  const telefonoLimpio = telefono.replace(/\D/g, '');

  // Si no tiene código de país, agregar +54 (Argentina)
  const telefonoCompleto = telefonoLimpio.startsWith('54')
    ? telefonoLimpio
    : `54${telefonoLimpio}`;

  // Crear URL de WhatsApp
  const mensajeCodificado = encodeURIComponent(mensaje);
  const url = `https://wa.me/${telefonoCompleto}?text=${mensajeCodificado}`;

  // Abrir en nueva ventana
  window.open(url, '_blank');
}

export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    console.error('Error al copiar:', error);
    return false;
  }
}
