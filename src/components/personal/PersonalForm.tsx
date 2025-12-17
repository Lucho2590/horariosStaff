'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Personal } from '@/types';
import { toast } from 'sonner';

interface PersonalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nombre: string; apellido: string; telefono?: string }) => Promise<void>;
  personal?: Personal | null;
  mode: 'create' | 'edit';
}

export function PersonalForm({ open, onOpenChange, onSubmit, personal, mode }: PersonalFormProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (personal && mode === 'edit') {
      setNombre(personal.nombre);
      setApellido(personal.apellido);
      setTelefono(personal.telefono || '');
    } else {
      setNombre('');
      setApellido('');
      setTelefono('');
    }
  }, [personal, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        nombre,
        apellido,
        telefono: telefono || undefined,
      });

      toast.success(mode === 'create' ? 'Empleado creado correctamente' : 'Empleado actualizado correctamente');
      onOpenChange(false);
      setNombre('');
      setApellido('');
      setTelefono('');
    } catch (error) {
      toast.error('Error al guardar el empleado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Agregar Nuevo Empleado' : 'Editar Empleado'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Completa los datos del nuevo empleado'
              : 'Modifica los datos del empleado'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Juan"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                placeholder="Ej: Pérez"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                placeholder="Ej: 2995123456"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : mode === 'create' ? 'Agregar Empleado' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
