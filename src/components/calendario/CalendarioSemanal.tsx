'use client';

import { useState } from 'react';
import { AsignacionConDetalles } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Clock, Plus, MoreVertical, Edit, Trash } from 'lucide-react';
import { DIAS_SEMANA } from '@/types';

interface CalendarioSemanalProps {
  asignaciones: AsignacionConDetalles[];
  semanaActual: Date; // Lunes de la semana actual
  onSemanaChange: (nuevaSemana: Date) => void;
  onCrearTurno: (fecha: Date) => void;
  onEditarTurno: (asignacion: AsignacionConDetalles) => void;
  onEliminarTurno: (asignacion: AsignacionConDetalles) => void;
}

export function CalendarioSemanal({
  asignaciones,
  semanaActual,
  onSemanaChange,
  onCrearTurno,
  onEditarTurno,
  onEliminarTurno,
}: CalendarioSemanalProps) {
  // Generar los 7 días de la semana (lunes a domingo)
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(semanaActual);
    fecha.setDate(fecha.getDate() + i);
    return fecha;
  });

  // Función para obtener turnos de un día específico
  const getTurnosDia = (fecha: Date) => {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);

    return asignaciones.filter((a) => {
      const fechaTurno = a.fecha instanceof Date ? a.fecha : (a.fecha as any).toDate();
      const fechaTurnoNormalizada = new Date(fechaTurno);
      fechaTurnoNormalizada.setHours(0, 0, 0, 0);

      return fechaTurnoNormalizada.getTime() === fechaNormalizada.getTime();
    });
  };

  // Navegación de semanas
  const irSemanaAnterior = () => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(nuevaSemana.getDate() - 7);
    onSemanaChange(nuevaSemana);
  };

  const irSemanaSiguiente = () => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(nuevaSemana.getDate() + 7);
    onSemanaChange(nuevaSemana);
  };

  const irSemanaActual = () => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    onSemanaChange(lunes);
  };

  // Formato de fecha para el título
  const formatearRangoSemana = () => {
    const inicio = diasSemana[0];
    const fin = diasSemana[6];

    const formatear = (fecha: Date) => {
      return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    return `${formatear(inicio)} - ${formatear(fin)}`;
  };

  const esHoy = (fecha: Date) => {
    const hoy = new Date();
    return (
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={irSemanaAnterior}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={irSemanaSiguiente}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center flex-1">
          <h3 className="font-semibold text-lg">{formatearRangoSemana()}</h3>
          <p className="text-sm text-muted-foreground">
            {semanaActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={irSemanaActual}>
          Hoy
        </Button>
      </div>

      {/* Vista desktop: Grid horizontal */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-3">
          {diasSemana.map((fecha, index) => {
            const turnos = getTurnosDia(fecha);
            const dia = DIAS_SEMANA[fecha.getDay()];
            const isHoy = esHoy(fecha);

            return (
              <div key={index} className="space-y-2">
                {/* Header del día */}
                <div
                  className={`text-center p-3 rounded-lg border-2 ${
                    isHoy
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-slate-50 border-border'
                  }`}
                >
                  <p className="text-sm font-medium">{dia}</p>
                  <p className={`text-xl font-bold ${!isHoy && 'text-slate-700'}`}>
                    {fecha.getDate()}
                  </p>
                </div>

                {/* Turnos del día */}
                <div className="space-y-2 min-h-[200px]">
                  {turnos.length === 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-auto py-8 border-dashed"
                      onClick={() => onCrearTurno(fecha)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      {turnos.map((turno) => (
                        <Card
                          key={turno.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {turno.personal?.nombre} {turno.personal?.apellido}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {turno.horaInicio} - {turno.horaFin}
                                  </span>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onEditarTurno(turno)} className="cursor-pointer">
                                    <Edit className="mr-2 h-3 w-3" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onEliminarTurno(turno)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash className="mr-2 h-3 w-3" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => onCrearTurno(fecha)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vista mobile: Lista vertical */}
      <div className="md:hidden space-y-3">
        {diasSemana.map((fecha, index) => {
          const turnos = getTurnosDia(fecha);
          const dia = DIAS_SEMANA[fecha.getDay()];
          const isHoy = esHoy(fecha);

          return (
            <Card key={index} className={isHoy ? 'border-2 border-primary' : ''}>
              <CardContent className="p-4">
                {/* Header del día */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{dia}</h4>
                    <p className="text-sm text-muted-foreground">
                      {fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                  {isHoy && <Badge>Hoy</Badge>}
                </div>

                {/* Turnos */}
                {turnos.length === 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => onCrearTurno(fecha)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar turno
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {turnos.map((turno) => (
                      <div
                        key={turno.id}
                        className="p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {turno.personal?.nombre} {turno.personal?.apellido}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {turno.horaInicio} - {turno.horaFin}
                              </span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditarTurno(turno)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onEliminarTurno(turno)}
                                className="cursor-pointer text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => onCrearTurno(fecha)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar turno
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
