'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Personal, Locale, DIAS_SEMANA } from '@/types';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface SemanaCompletaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (asignaciones: {
    personalId: string;
    localeId: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    activo: boolean;
  }[]) => Promise<void>;
  personal: Personal[];
  locales: Locale[];
  defaultLocaleId?: string;
  semanaActual: Date; // Lunes de la semana actual
}

export function SemanaCompletaForm({
  open,
  onOpenChange,
  onSubmit,
  personal,
  locales,
  defaultLocaleId,
  semanaActual,
}: SemanaCompletaFormProps) {
  const [personalId, setPersonalId] = useState('');
  const [localeId, setLocaleId] = useState(defaultLocaleId || '');
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([]); // 0-6 para índices de días
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('17:00');
  const [loading, setLoading] = useState(false);

  // Generar las fechas de la semana
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(semanaActual);
    fecha.setDate(fecha.getDate() + i);
    return fecha;
  });

  const toggleDia = (index: number) => {
    if (diasSeleccionados.includes(index)) {
      setDiasSeleccionados(diasSeleccionados.filter((d) => d !== index));
    } else {
      setDiasSeleccionados([...diasSeleccionados, index].sort());
    }
  };

  const seleccionarTodos = () => {
    setDiasSeleccionados([0, 1, 2, 3, 4]); // Lunes a Viernes
  };

  const limpiarSeleccion = () => {
    setDiasSeleccionados([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalId || !localeId) {
      toast.error('Por favor selecciona empleado y local');
      return;
    }

    if (diasSeleccionados.length === 0) {
      toast.error('Por favor selecciona al menos un día');
      return;
    }

    if (horaInicio >= horaFin) {
      toast.error('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    setLoading(true);

    try {
      // Crear asignaciones con fechas específicas
      const asignaciones = diasSeleccionados.map((diaIndex) => {
        const fechaOriginal = diasSemana[diaIndex];
        // Crear fecha en zona horaria local para evitar problemas de timezone
        const fecha = new Date(
          fechaOriginal.getFullYear(),
          fechaOriginal.getMonth(),
          fechaOriginal.getDate(),
          12, 0, 0, 0
        );

        return {
          personalId,
          localeId,
          fecha,
          horaInicio,
          horaFin,
          activo: true,
        };
      });

      await onSubmit(asignaciones);

      toast.success(`Semana completa creada: ${diasSeleccionados.length} turnos agregados`);
      onOpenChange(false);

      // Reset form
      setPersonalId('');
      setDiasSeleccionados([]);
      setHoraInicio('09:00');
      setHoraFin('17:00');
    } catch (error) {
      toast.error('Error al crear la semana completa');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear rango de semana
  const formatearRangoSemana = () => {
    const inicio = diasSemana[0];
    const fin = diasSemana[6];

    const formatear = (fecha: Date) => {
      return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    return `${formatear(inicio)} - ${formatear(fin)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cargar Semana Completa
          </DialogTitle>
          <DialogDescription>
            Asigna múltiples días a un empleado con el mismo horario para la semana {formatearRangoSemana()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="personal">Empleado *</Label>
              <Select value={personalId} onValueChange={setPersonalId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Local *</Label>
              <Select value={localeId} onValueChange={setLocaleId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un local" />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Días de la semana *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={seleccionarTodos}
                    disabled={loading}
                  >
                    L-V
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={limpiarSeleccion}
                    disabled={loading}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {diasSemana.map((fecha, index) => {
                  const isSelected = diasSeleccionados.includes(index);
                  const diaNombre = DIAS_SEMANA[fecha.getDay()];
                  const fechaStr = fecha.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                  });

                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 p-3 rounded-md border-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        id={`dia-${index}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleDia(index)}
                        disabled={loading}
                      />
                      <Label
                        htmlFor={`dia-${index}`}
                        className="cursor-pointer flex-1 select-none"
                      >
                        <span className="block font-medium">{diaNombre}</span>
                        <span className="block text-xs text-muted-foreground">{fechaStr}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora Inicio *</Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaFin">Hora Fin *</Label>
                <Input
                  id="horaFin"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {diasSeleccionados.length > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-sm font-medium">
                  Se crearán {diasSeleccionados.length} turnos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {horaInicio} - {horaFin} • {diasSeleccionados.length} días seleccionados
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Semana Completa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
