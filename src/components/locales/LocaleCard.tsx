'use client';

import { Locale } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash } from 'lucide-react';

interface LocaleCardProps {
  locale: Locale;
  onEdit: (locale: Locale) => void;
  onDelete: (locale: Locale) => void;
}

export function LocaleCard({ locale, onEdit, onDelete }: LocaleCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">{locale.nombre}</CardTitle>
          {locale.direccion && <CardDescription>{locale.direccion}</CardDescription>}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(locale)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(locale)}
              className="cursor-pointer text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Creado el {locale.createdAt?.toDate?.()?.toLocaleDateString('es-AR') || 'N/A'}
        </p>
      </CardContent>
    </Card>
  );
}
