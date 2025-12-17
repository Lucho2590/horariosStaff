'use client';

import { useState } from 'react';
import { Locale } from '@/types';
import { LocaleCard } from './LocaleCard';
import { LocaleForm } from './LocaleForm';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { useLocales } from '@/hooks/useLocales';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function LocalesList() {
  const { locales, loading, addLocale, editLocale, removeLocale } = useLocales();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreate = () => {
    setSelectedLocale(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = (locale: Locale) => {
    setSelectedLocale(locale);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteClick = (locale: Locale) => {
    setSelectedLocale(locale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocale) return;

    try {
      await removeLocale(selectedLocale.id);
      toast.success('Local eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedLocale(null);
    } catch (error) {
      toast.error('Error al eliminar el local');
      console.error(error);
    }
  };

  const handleSubmit = async (data: { nombre: string; direccion?: string }) => {
    if (!user) return;

    if (formMode === 'create') {
      await addLocale({
        ...data,
        createdBy: user.uid,
      });
    } else if (selectedLocale) {
      await editLocale(selectedLocale.id, data);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando locales...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Locales</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Gestiona los locales de tu negocio</p>
        </div>
        <Button onClick={handleCreate} className="hidden md:flex">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Local
        </Button>
      </div>

      {/* Botón flotante para móvil */}
      <Button
        onClick={handleCreate}
        size="lg"
        className="md:hidden fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {locales.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No hay locales creados aún</p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primer Local
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {locales.map((locale) => (
            <LocaleCard
              key={locale.id}
              locale={locale}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <LocaleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        locale={selectedLocale}
        mode={formMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el local &quot;
              {selectedLocale?.nombre}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
