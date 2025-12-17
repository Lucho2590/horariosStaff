'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Asignacion, Personal, Locale } from '@/types';
import { toast } from 'sonner';
import { verificarConflictos } from '@/lib/validaciones';
import { getAsignaciones } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

interface AsignacionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { personalId: string; localeId: string; fecha: Date; horaInicio: string; horaFin: string; activo: boolean }) => Promise<void>;
  asignacion?: Asignacion | null;
  personal: Personal[];
  locales: Locale[];
  mode: 'create' | 'edit';
  defaultLocaleId?: string;
  defaultFecha?: Date; // Nueva prop para fecha predeterminada
}

export function AsignacionForm({
  open,
  onOpenChange,
  onSubmit,
  asignacion,
  personal,
  locales,
  mode,
  defaultLocaleId,
  defaultFecha,
}: AsignacionFormProps) {
  const [personalId, setPersonalId] = useState('');
  const [localeId, setLocaleId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asignacion && mode === 'edit') {
      setPersonalId(asignacion.personalId);
      setLocaleId(asignacion.localeId);

      // Convertir Timestamp a fecha string para el input
      const fechaTurno = asignacion.fecha instanceof Date ? asignacion.fecha : (asignacion.fecha as any).toDate();
      const fechaStr = fechaTurno.toISOString().split('T')[0];
      setFecha(fechaStr);

      setHoraInicio(asignacion.horaInicio);
      setHoraFin(asignacion.horaFin);
    } else {
      setPersonalId('');
      setLocaleId(defaultLocaleId || '');

      // Si hay fecha por defecto, usarla
      if (defaultFecha) {
        const fechaStr = defaultFecha.toISOString().split('T')[0];
        setFecha(fechaStr);
      } else {
        setFecha('');
      }

      setHoraInicio('09:00');
      setHoraFin('17:00');
    }
  }, [asignacion, mode, open, defaultLocaleId, defaultFecha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalId || !localeId || !fecha || !horaInicio || !horaFin) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (horaInicio >= horaFin) {
      toast.error('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    setLoading(true);

    try {
      // Convertir string fecha a Date (en zona horaria local, no UTC)
      const [year, month, day] = fecha.split('-').map(Number);
      const fechaDate = new Date(year, month - 1, day, 12, 0, 0, 0);

      // Obtener todas las asignaciones activas del empleado para verificar conflictos
      const todasLasAsignaciones = await getAsignaciones({ personalId, activo: true });

      // Verificar conflictos de horarios
      const { hayConflicto, mensaje } = verificarConflictos(
        personalId,
        fechaDate,
        horaInicio,
        horaFin,
        todasLasAsignaciones,
        asignacion?.id // Excluir la asignación actual si estamos editando
      );

      if (hayConflicto) {
        toast.error(mensaje || 'Este empleado ya tiene un turno asignado en este horario');
        setLoading(false);
        return;
      }

      await onSubmit({
        personalId,
        localeId,
        fecha: fechaDate,
        horaInicio,
        horaFin,
        activo: true,
      });

      toast.success(mode === 'create' ? 'Turno creado correctamente' : 'Turno actualizado correctamente');
      onOpenChange(false);
    } catch (error) {
      toast.error('Error al guardar el turno');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nuevo Turno' : 'Editar Turno'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Asigna un empleado a un local en una fecha y horario específico'
              : 'Modifica el turno existente'}
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

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={loading}
              />
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear Turno' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
