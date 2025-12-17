'use client';

import { useState } from 'react';
import { useLocales } from '@/hooks/useLocales';
import { usePersonal } from '@/hooks/usePersonal';
import { useTurnos } from '@/hooks/useTurnos';
import { useSnapshots } from '@/hooks/useSnapshots';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Users, Calendar, MessageCircle, Copy, History, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { DIAS_SEMANA } from '@/types';
import { generarMensajeHorario, enviarPorWhatsApp, copiarAlPortapapeles } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Helper para obtener el lunes de una semana
function obtenerLunesDeSemana(fecha: Date = new Date()): Date {
  const dia = fecha.getDay();
  const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
  const lunes = new Date(fecha);
  lunes.setDate(diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

// Helper para obtener el domingo de una semana
function obtenerDomingoDeSemana(lunes: Date): Date {
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return domingo;
}

export default function ReportesPage() {
  const { locales } = useLocales();
  const { personal } = usePersonal();
  const [semanaActual, setSemanaActual] = useState<Date>(obtenerLunesDeSemana());

  // Obtener el rango de fechas de la semana
  const fechaInicio = semanaActual;
  const fechaFin = obtenerDomingoDeSemana(semanaActual);

  const { asignaciones } = useTurnos({
    activo: true,
    fechaInicio,
    fechaFin
  });
  const { snapshots, loading: loadingSnapshots, removeSnapshot } = useSnapshots();
  const [snapshotsExpandidos, setSnapshotsExpandidos] = useState<Set<string>>(new Set());

  // Calcular horas por empleado
  const horasPorEmpleado = personal.map((persona) => {
    const asignacionesPersona = asignaciones.filter((a) => a.personalId === persona.id);

    const totalHoras = asignacionesPersona.reduce((total, asig) => {
      const [horaInicioH, horaInicioM] = asig.horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = asig.horaFin.split(':').map(Number);
      const horas = (horaFinH + horaFinM / 60) - (horaInicioH + horaInicioM / 60);
      return total + horas;
    }, 0);

    return {
      persona,
      horasPorSemana: totalHoras,
      cantidadTurnos: asignacionesPersona.length,
      asignaciones: asignacionesPersona,
    };
  }).sort((a, b) => b.horasPorSemana - a.horasPorSemana);

  // Estadísticas generales
  const totalAsignaciones = asignaciones.length;
  const totalHorasSemana = horasPorEmpleado.reduce((sum, e) => sum + e.horasPorSemana, 0);
  const promedioHorasPorEmpleado = personal.length > 0 ? totalHorasSemana / personal.length : 0;

  // Handlers de WhatsApp
  const handleEnviarWhatsApp = (persona: Personal, asignacionesPersona: any[]) => {
    if (!persona.telefono) {
      toast.error('Este empleado no tiene teléfono registrado');
      return;
    }

    const mensaje = generarMensajeHorario(persona, asignacionesPersona);
    enviarPorWhatsApp(persona.telefono, mensaje);
    toast.success('Abriendo WhatsApp...');
  };

  const handleCopiarMensaje = async (persona: Personal, asignacionesPersona: any[]) => {
    const mensaje = generarMensajeHorario(persona, asignacionesPersona);
    const copiado = await copiarAlPortapapeles(mensaje);

    if (copiado) {
      toast.success('Mensaje copiado al portapapeles');
    } else {
      toast.error('Error al copiar el mensaje');
    }
  };

  const handleDeleteSnapshot = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el snapshot "${nombre}"?`)) {
      try {
        await removeSnapshot(id);
        toast.success('Snapshot eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar el snapshot');
        console.error(error);
      }
    }
  };

  const toggleSnapshotExpandido = (id: string) => {
    const nuevo = new Set(snapshotsExpandidos);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    setSnapshotsExpandidos(nuevo);
  };

  // Navegación de semanas
  const irSemanaAnterior = () => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(nuevaSemana.getDate() - 7);
    setSemanaActual(nuevaSemana);
  };

  const irSemanaSiguiente = () => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(nuevaSemana.getDate() + 7);
    setSemanaActual(nuevaSemana);
  };

  const irSemanaActualHoy = () => {
    setSemanaActual(obtenerLunesDeSemana());
  };

  // Formato de fecha para el título
  const formatearRangoSemana = () => {
    const inicio = semanaActual;
    const fin = obtenerDomingoDeSemana(semanaActual);

    const formatear = (fecha: Date) => {
      return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    return `${formatear(inicio)} - ${formatear(fin)}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis de horas y asignaciones</p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <p className="text-xs md:text-sm font-medium">Empleados</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{personal.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <p className="text-xs md:text-sm font-medium">Turnos</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{totalAsignaciones}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <p className="text-xs md:text-sm font-medium">Hrs/Semana</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{Math.round(totalHorasSemana)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs md:text-sm font-medium">Promedio</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{promedioHorasPorEmpleado.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de reportes */}
      <Tabs defaultValue="empleados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="empleados">Por Empleado</TabsTrigger>
          <TabsTrigger value="locales">Por Local</TabsTrigger>
          <TabsTrigger value="historial">
            <History className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empleados" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-lg">Horas por Empleado</CardTitle>
                  <CardDescription>Horas semanales asignadas a cada empleado</CardDescription>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={irSemanaAnterior}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={irSemanaSiguiente}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{formatearRangoSemana()}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={irSemanaActualHoy}>
                    Hoy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {horasPorEmpleado.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
              ) : (
                horasPorEmpleado.map(({ persona, horasPorSemana, cantidadTurnos, asignaciones: asignacionesPersona }) => (
                  <div
                    key={persona.id}
                    className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base">
                        {persona.nombre} {persona.apellido}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {cantidadTurnos} {cantidadTurnos === 1 ? 'turno' : 'turnos'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-sm md:text-base font-semibold shrink-0">
                      {horasPorSemana.toFixed(1)} hs
                    </Badge>

                    {/* Botones de WhatsApp */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          <MessageCircle className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Enviar</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEnviarWhatsApp(persona, asignacionesPersona)}
                          disabled={!persona.telefono}
                          className="cursor-pointer"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Abrir WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopiarMensaje(persona, asignacionesPersona)}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar mensaje
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locales" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Por Local</CardTitle>
              <CardDescription>Asignaciones y empleados por local</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {locales.map((local) => {
                const asignacionesLocal = asignaciones.filter((a) => a.localeId === local.id);
                const empleadosUnicos = new Set(asignacionesLocal.map((a) => a.personalId)).size;

                return (
                  <div
                    key={local.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base">{local.nombre}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {empleadosUnicos} {empleadosUnicos === 1 ? 'empleado' : 'empleados'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-sm md:text-base">
                      {asignacionesLocal.length} turnos
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-lg">Historial de Semanas</CardTitle>
                  <CardDescription>Semanas guardadas con sus asignaciones</CardDescription>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={irSemanaAnterior}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={irSemanaSiguiente}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{formatearRangoSemana()}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={irSemanaActualHoy}>
                    Hoy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingSnapshots ? (
                <p className="text-center text-muted-foreground py-8">Cargando historial...</p>
              ) : (() => {
                // Filtrar snapshots de la semana seleccionada
                const snapshotsSemana = snapshots.filter((snapshot) => {
                  const snapshotInicio = snapshot.semanaInicio instanceof Date
                    ? snapshot.semanaInicio
                    : (snapshot.semanaInicio as any).toDate();
                  const snapshotFin = snapshot.semanaFin instanceof Date
                    ? snapshot.semanaFin
                    : (snapshot.semanaFin as any).toDate();

                  // Normalizar fechas para comparar solo día/mes/año
                  const snapshotInicioNorm = new Date(snapshotInicio);
                  snapshotInicioNorm.setHours(0, 0, 0, 0);

                  const semanaActualNorm = new Date(semanaActual);
                  semanaActualNorm.setHours(0, 0, 0, 0);

                  return snapshotInicioNorm.getTime() === semanaActualNorm.getTime();
                });

                return snapshotsSemana.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay snapshots guardados para esta semana.
                  </p>
                ) : (
                  snapshotsSemana.map((snapshot) => {
                  const isExpandido = snapshotsExpandidos.has(snapshot.id);

                  // Agrupar turnos por empleado
                  const turnosPorEmpleado = snapshot.asignaciones.reduce((acc, asig) => {
                    if (!acc[asig.personalId]) {
                      acc[asig.personalId] = [];
                    }
                    acc[asig.personalId].push(asig);
                    return acc;
                  }, {} as Record<string, typeof snapshot.asignaciones>);

                  return (
                    <div
                      key={snapshot.id}
                      className="rounded-lg border overflow-hidden"
                    >
                      {/* Header del snapshot */}
                      <div
                        className="flex items-center justify-between gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => toggleSnapshotExpandido(snapshot.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {isExpandido ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base">{snapshot.nombre}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {snapshot.totalTurnos} {snapshot.totalTurnos === 1 ? 'turno' : 'turnos'} • {Math.round(snapshot.totalHoras)} horas totales
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm md:text-base shrink-0">
                            {Math.round(snapshot.totalHoras)} hs
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSnapshot(snapshot.id, snapshot.nombre);
                            }}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {isExpandido && (
                        <div className="border-t bg-slate-50/50 p-4">
                          <div className="space-y-3">
                            {Object.entries(turnosPorEmpleado).map(([personalId, turnos]) => {
                              const persona = personal.find(p => p.id === personalId);
                              const nombrePersona = persona ? `${persona.nombre} ${persona.apellido}` : 'Empleado eliminado';

                              // Ordenar turnos por fecha
                              const turnosOrdenados = turnos.sort((a, b) => {
                                const fechaA = a.fecha instanceof Date ? a.fecha : (a.fecha as any).toDate();
                                const fechaB = b.fecha instanceof Date ? b.fecha : (b.fecha as any).toDate();
                                return fechaA.getTime() - fechaB.getTime();
                              });

                              return (
                                <div key={personalId} className="bg-white rounded-md p-3 border">
                                  <p className="font-medium text-sm mb-2">{nombrePersona}</p>
                                  <div className="space-y-1">
                                    {turnosOrdenados.map((turno, idx) => {
                                      const fechaTurno = turno.fecha instanceof Date ? turno.fecha : (turno.fecha as any).toDate();
                                      const diaNombre = DIAS_SEMANA[fechaTurno.getDay()];
                                      const fechaFormateada = fechaTurno.toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit'
                                      });
                                      const local = locales.find(l => l.id === turno.localeId);

                                      return (
                                        <div key={idx} className="flex items-center justify-between text-xs md:text-sm">
                                          <span className="text-muted-foreground">
                                            {diaNombre} {fechaFormateada} • {local?.nombre || 'Local eliminado'}
                                          </span>
                                          <span className="font-medium">
                                            {turno.horaInicio} - {turno.horaFin}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  })
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
