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
import { Locale } from '@/types';
import { toast } from 'sonner';

interface LocaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nombre: string; direccion?: string }) => Promise<void>;
  locale?: Locale | null;
  mode: 'create' | 'edit';
}

export function LocaleForm({ open, onOpenChange, onSubmit, locale, mode }: LocaleFormProps) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locale && mode === 'edit') {
      setNombre(locale.nombre);
      setDireccion(locale.direccion || '');
    } else {
      setNombre('');
      setDireccion('');
    }
  }, [locale, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        nombre,
        direccion: direccion || undefined,
      });

      toast.success(mode === 'create' ? 'Local creado correctamente' : 'Local actualizado correctamente');
      onOpenChange(false);
      setNombre('');
      setDireccion('');
    } catch (error) {
      toast.error('Error al guardar el local');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Crear Nuevo Local' : 'Editar Local'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Completa los datos para crear un nuevo local'
              : 'Modifica los datos del local'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Local *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Local Centro"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección (opcional)</Label>
              <Input
                id="direccion"
                placeholder="Ej: Av. Principal 123"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear Local' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
