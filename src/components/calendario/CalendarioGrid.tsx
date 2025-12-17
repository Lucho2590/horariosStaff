'use client';

import { AsignacionConDetalles, DIAS_SEMANA } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash, ArrowRight, Clock } from 'lucide-react';

interface CalendarioGridProps {
  asignaciones: AsignacionConDetalles[];
  onEdit: (asignacion: AsignacionConDetalles) => void;
  onDelete: (asignacion: AsignacionConDetalles) => void;
  onMove: (asignacion: AsignacionConDetalles) => void;
}

export function CalendarioGrid({ asignaciones, onEdit, onDelete, onMove }: CalendarioGridProps) {
  // Agrupar asignaciones por día
  const asignacionesPorDia = DIAS_SEMANA.map((_, diaSemana) =>
    asignaciones.filter((a) => a.diaSemana === diaSemana && a.activo)
  );

  return (
    <>
      {/* Vista Mobile - Vertical scroll */}
      <div className="md:hidden space-y-4">
        {DIAS_SEMANA.map((dia, index) => {
          const asignacionesDelDia = asignacionesPorDia[index];

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">{dia}</h3>
                <span className="text-sm text-slate-500">
                  {asignacionesDelDia.length} {asignacionesDelDia.length === 1 ? 'turno' : 'turnos'}
                </span>
              </div>

              {asignacionesDelDia.length === 0 ? (
                <Card className="bg-slate-50 border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-slate-500">Sin asignaciones</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {asignacionesDelDia.map((asignacion) => (
                    <Card key={asignacion.id} className="overflow-hidden active:scale-[0.98] transition-transform">
                      <CardContent className="p-0">
                        <div className="flex items-center p-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base text-slate-900 mb-1">
                              {asignacion.personal?.nombre} {asignacion.personal?.apellido}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{asignacion.horaInicio} - {asignacion.horaFin}</span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onEdit(asignacion)} className="cursor-pointer py-3">
                                <Edit className="mr-3 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onMove(asignacion)} className="cursor-pointer py-3">
                                <ArrowRight className="mr-3 h-4 w-4" />
                                Mover a otro local
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(asignacion)}
                                className="cursor-pointer text-red-600 py-3"
                              >
                                <Trash className="mr-3 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vista Desktop - Grid horizontal */}
      <div className="hidden md:grid md:grid-cols-7 gap-4">
        {DIAS_SEMANA.map((dia, index) => {
          const asignacionesDelDia = asignacionesPorDia[index];

          return (
            <div key={index} className="space-y-2">
              <div className="font-semibold text-center py-2 bg-slate-100 rounded-md">
                {dia}
              </div>

              <div className="space-y-2 min-h-[200px]">
                {asignacionesDelDia.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Sin asignaciones
                  </div>
                ) : (
                  asignacionesDelDia.map((asignacion) => (
                    <Card key={asignacion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {asignacion.personal?.nombre} {asignacion.personal?.apellido}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {asignacion.horaInicio} - {asignacion.horaFin}
                            </Badge>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(asignacion)} className="cursor-pointer">
                                <Edit className="mr-2 h-3 w-3" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onMove(asignacion)} className="cursor-pointer">
                                <ArrowRight className="mr-2 h-3 w-3" />
                                Mover a otro local
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(asignacion)}
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
