'use client';

import { useState } from 'react';
import { Locale, Personal, AsignacionConDetalles, Asignacion } from '@/types';
import { CalendarioSemanal } from './CalendarioSemanal';
import { AsignacionForm } from './AsignacionForm';
import { SemanaCompletaForm } from './SemanaCompletaForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, CalendarDays, Save } from 'lucide-react';
import { useLocales } from '@/hooks/useLocales';
import { usePersonal } from '@/hooks/usePersonal';
import { useTurnos } from '@/hooks/useTurnos';
import { useSnapshots } from '@/hooks/useSnapshots';
import { useAuth } from '@/hooks/useAuth';
import { createAuditLog } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

// Función helper para obtener el lunes de una semana
function obtenerLunesDeSemana(fecha: Date = new Date()): Date {
  const dia = fecha.getDay();
  const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
  const lunes = new Date(fecha);
  lunes.setDate(diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

// Función helper para obtener el domingo de una semana
function obtenerDomingoDeSemana(lunes: Date): Date {
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return domingo;
}

export function CalendarioTabs() {
  const { locales, loading: loadingLocales } = useLocales();
  const { personal, loading: loadingPersonal } = usePersonal();
  const { addSnapshot } = useSnapshots();
  const { user } = useAuth();
  const [selectedLocaleId, setSelectedLocaleId] = useState<string>('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [semanaActual, setSemanaActual] = useState<Date>(obtenerLunesDeSemana());

  // Obtener el rango de fechas de la semana
  const fechaInicio = semanaActual;
  const fechaFin = obtenerDomingoDeSemana(semanaActual);

  const { asignaciones, loading: loadingCalendario, addAsignacion, editAsignacion, removeAsignacion, moverAsignacion } = useTurnos(
    selectedLocaleId
      ? {
          localeId: selectedLocaleId,
          activo: true,
          fechaInicio,
          fechaFin,
        }
      : undefined
  );

  const [formOpen, setFormOpen] = useState(false);
  const [semanaCompletaOpen, setSemanaCompletaOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState<AsignacionConDetalles | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [targetLocaleId, setTargetLocaleId] = useState('');
  const [defaultFecha, setDefaultFecha] = useState<Date | undefined>(undefined);

  const handleCreate = (fecha?: Date) => {
    setSelectedAsignacion(null);
    setFormMode('create');
    setDefaultFecha(fecha);
    setFormOpen(true);
  };

  const handleEdit = (asignacion: AsignacionConDetalles) => {
    setSelectedAsignacion(asignacion);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteClick = (asignacion: AsignacionConDetalles) => {
    setSelectedAsignacion(asignacion);
    setDeleteDialogOpen(true);
  };

  const handleMoveClick = (asignacion: AsignacionConDetalles) => {
    setSelectedAsignacion(asignacion);
    setTargetLocaleId('');
    setMoveDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAsignacion) return;

    try {
      await removeAsignacion(selectedAsignacion.id);
      toast.success('Turno eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedAsignacion(null);
    } catch (error) {
      toast.error('Error al eliminar el turno');
      console.error(error);
    }
  };

  const handleMoveConfirm = async () => {
    if (!selectedAsignacion || !targetLocaleId) {
      toast.error('Por favor selecciona un local de destino');
      return;
    }

    try {
      await moverAsignacion(selectedAsignacion.id, targetLocaleId);
      toast.success('Turno movido correctamente');
      setMoveDialogOpen(false);
      setSelectedAsignacion(null);
      setTargetLocaleId('');
    } catch (error) {
      toast.error('Error al mover el turno');
      console.error(error);
    }
  };

  const handleSubmit = async (data: { personalId: string; localeId: string; fecha: Date; horaInicio: string; horaFin: string; activo: boolean }) => {
    const dataConTimestamp = {
      ...data,
      fecha: Timestamp.fromDate(data.fecha),
    };

    if (formMode === 'create') {
      await addAsignacion(dataConTimestamp);
    } else if (selectedAsignacion) {
      await editAsignacion(selectedAsignacion.id, dataConTimestamp);
    }
  };

  const handleSemanaCompleta = async (asignaciones: { personalId: string; localeId: string; fecha: Date; horaInicio: string; horaFin: string; activo: boolean }[]) => {
    // Convertir fechas a Timestamp y crear todas las asignaciones en paralelo
    await Promise.all(asignaciones.map(data => addAsignacion({
      ...data,
      fecha: Timestamp.fromDate(data.fecha),
    })));

    // Crear audit log para la semana completa
    if (user) {
      await createAuditLog('semana_completa_created', 'asignacion', user.uid, user.email, undefined, {
        cantidadTurnos: asignaciones.length,
        personalId: asignaciones[0]?.personalId,
        localeId: asignaciones[0]?.localeId,
        fechas: asignaciones.map(a => a.fecha.toISOString()),
      });
    }
  };

  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    try {
      await addSnapshot();
      toast.success('Semana guardada correctamente en el historial');
    } catch (error) {
      toast.error('Error al guardar la semana');
      console.error(error);
    } finally {
      setSavingSnapshot(false);
    }
  };

  if (loadingLocales || loadingPersonal) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (locales.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No hay locales creados. Por favor crea al menos un local primero.</p>
        <Button onClick={() => window.location.href = '/locales'}>
          Ir a Locales
        </Button>
      </div>
    );
  }

  if (personal.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No hay empleados registrados. Por favor agrega al menos un empleado primero.</p>
        <Button onClick={() => window.location.href = '/personal'}>
          Ir a Personal
        </Button>
      </div>
    );
  }

  // Seleccionar el primer local por defecto si no hay ninguno seleccionado
  if (!selectedLocaleId && locales.length > 0) {
    setSelectedLocaleId(locales[0].id);
  }

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Calendario</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Gestiona los turnos de tus empleados</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button onClick={handleSaveSnapshot} variant="secondary" disabled={savingSnapshot}>
            <Save className="mr-2 h-4 w-4" />
            {savingSnapshot ? 'Guardando...' : 'Guardar Semana'}
          </Button>
          <Button onClick={() => setSemanaCompletaOpen(true)} variant="outline">
            <CalendarDays className="mr-2 h-4 w-4" />
            Semana Completa
          </Button>
        </div>
      </div>

      {/* Botones flotantes para móvil */}
      <div className="md:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3">
        <Button
          onClick={handleSaveSnapshot}
          size="lg"
          variant="secondary"
          disabled={savingSnapshot}
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <Save className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setSemanaCompletaOpen(true)}
          size="lg"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-white"
        >
          <CalendarDays className="h-5 w-5" />
        </Button>
      </div>

      <Tabs value={selectedLocaleId} onValueChange={setSelectedLocaleId}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {locales.map((locale) => (
            <TabsTrigger key={locale.id} value={locale.id}>
              {locale.nombre}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale.id} value={locale.id} className="mt-6">
            {loadingCalendario ? (
              <div className="text-center py-8">Cargando calendario...</div>
            ) : (
              <CalendarioSemanal
                asignaciones={asignaciones}
                semanaActual={semanaActual}
                onSemanaChange={setSemanaActual}
                onCrearTurno={handleCreate}
                onEditarTurno={handleEdit}
                onEliminarTurno={handleDeleteClick}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AsignacionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        asignacion={selectedAsignacion}
        personal={personal}
        locales={locales}
        mode={formMode}
        defaultLocaleId={selectedLocaleId}
        defaultFecha={defaultFecha}
      />

      <SemanaCompletaForm
        open={semanaCompletaOpen}
        onOpenChange={setSemanaCompletaOpen}
        onSubmit={handleSemanaCompleta}
        personal={personal}
        locales={locales}
        defaultLocaleId={selectedLocaleId}
        semanaActual={semanaActual}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el turno de &quot;
              {selectedAsignacion?.personal?.nombre} {selectedAsignacion?.personal?.apellido}&quot;.
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

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Turno</DialogTitle>
            <DialogDescription>
              Selecciona el local al que deseas mover el turno de &quot;
              {selectedAsignacion?.personal?.nombre} {selectedAsignacion?.personal?.apellido}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={targetLocaleId} onValueChange={setTargetLocaleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un local" />
              </SelectTrigger>
              <SelectContent>
                {locales
                  .filter((l) => l.id !== selectedAsignacion?.localeId)
                  .map((locale) => (
                    <SelectItem key={locale.id} value={locale.id}>
                      {locale.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMoveConfirm}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
