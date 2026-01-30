import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Car, Clock, DollarSign, Edit2, Trash2, Tag, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import ServiceFormModal from '../components/services/ServiceFormModal';
import { cn } from '@/lib/utils';

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
  
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setModalOpen(false);
      setSelectedService(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setModalOpen(false);
      setSelectedService(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteDialog({ open: false, service: null });
    },
  });

  const handleSave = (data) => {
    if (selectedService) {
      updateMutation.mutate({ id: selectedService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Gerencie os serviços oferecidos"
        action={handleNew}
        actionLabel="Novo Serviço"
      />

      {services.length === 0 && !isLoading ? (
        <EmptyState
          icon={Car}
          title="Nenhum serviço cadastrado"
          description="Comece cadastrando os serviços que seu lava jato oferece"
          action={handleNew}
          actionLabel="Cadastrar Serviço"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all",
                !service.active && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    service.is_combo 
                      ? "bg-gradient-to-br from-amber-100 to-orange-100" 
                      : "bg-gradient-to-br from-sky-100 to-blue-100"
                  )}>
                    {service.is_combo ? (
                      <Tag className="w-6 h-6 text-amber-600" />
                    ) : (
                      <Car className="w-6 h-6 text-sky-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{service.name}</h3>
                    {service.is_combo && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                        Combo
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(service)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialog({ open: true, service })}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {service.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{service.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{service.duration_minutes || 30} min</span>
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-sky-600">
                  <DollarSign className="w-5 h-5" />
                  <span>R$ {service.price?.toFixed(2)}</span>
                </div>
              </div>

              {!service.active && (
                <Badge variant="secondary" className="mt-3 bg-slate-100 text-slate-500">
                  Inativo
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <ServiceFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedService(null);
        }}
        onSave={handleSave}
        service={selectedService}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{deleteDialog.service?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDialog.service?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}