'use client';

import { useState } from 'react';
import { Personal } from '@/types';
import { PersonalForm } from './PersonalForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash } from 'lucide-react';
import { usePersonal } from '@/hooks/usePersonal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function PersonalList() {
  const { personal, loading, addPersonal, editPersonal, removePersonal } = usePersonal();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreate = () => {
    setSelectedPersonal(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = (person: Personal) => {
    setSelectedPersonal(person);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteClick = (person: Personal) => {
    setSelectedPersonal(person);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPersonal) return;

    try {
      await removePersonal(selectedPersonal.id);
      toast.success('Empleado eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedPersonal(null);
    } catch (error) {
      toast.error('Error al eliminar el empleado');
      console.error(error);
    }
  };

  const handleSubmit = async (data: { nombre: string; apellido: string; telefono?: string }) => {
    if (!user) return;

    if (formMode === 'create') {
      await addPersonal({
        ...data,
        createdBy: user.uid,
      });
    } else if (selectedPersonal) {
      await editPersonal(selectedPersonal.id, data);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando personal...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Personal</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Gestiona los empleados de tu negocio</p>
        </div>
        <Button onClick={handleCreate} className="hidden md:flex">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Empleado
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

      {personal.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No hay empleados registrados aún</p>
        </div>
      ) : (
        <>
          {/* Vista Mobile - Cards */}
          <div className="md:hidden space-y-2">
            {personal.map((person) => (
              <Card key={person.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">
                        {person.nombre} {person.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {person.telefono || 'Sin teléfono'}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEdit(person)} className="cursor-pointer py-3">
                          <Edit className="mr-3 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(person)}
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

          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personal.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.nombre}</TableCell>
                    <TableCell>{person.apellido}</TableCell>
                    <TableCell>{person.telefono || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(person)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(person)}
                            className="cursor-pointer text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <PersonalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        personal={selectedPersonal}
        mode={formMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a &quot;
              {selectedPersonal?.nombre} {selectedPersonal?.apellido}&quot;.
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
