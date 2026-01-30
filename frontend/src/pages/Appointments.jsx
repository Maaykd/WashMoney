import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, Car, Phone, Edit2, Trash2, MoreVertical, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import AppointmentFormModal from '../components/appointments/AppointmentFormModal';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Appointments() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, appointment: null });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setModalOpen(false);
      setSelectedAppointment(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setModalOpen(false);
      setSelectedAppointment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDeleteDialog({ open: false, appointment: null });
    },
  });

  const handleSave = (data) => {
    if (selectedAppointment) {
      updateMutation.mutate({ id: selectedAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = (appointment, newStatus) => {
    updateMutation.mutate({ id: appointment.id, data: { status: newStatus } });
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dateStr).sort((a, b) => a.time?.localeCompare(b.time));
  };

  const navigateWeek = (direction) => {
    setCurrentDate(addDays(currentDate, direction * 7));
  };

  const todayAppointments = getAppointmentsForDay(new Date());

  return (
    <div>
      <PageHeader
        title="Agendamentos"
        subtitle="Gerencie os horários do seu lava jato"
        action={handleNew}
        actionLabel="Novo Agendamento"
      />

      {/* Today's Summary */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">Hoje</h3>
            <p className="text-3xl font-bold">{todayAppointments.length} agendamentos</p>
            <p className="text-sm opacity-80 mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Calendar className="w-16 h-16 opacity-30" />
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigateWeek(-1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Semana Anterior
        </Button>
        <h3 className="text-lg font-semibold text-slate-800">
          {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: ptBR })}
        </h3>
        <Button variant="outline" onClick={() => navigateWeek(1)}>
          Próxima Semana
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-white rounded-2xl border shadow-sm overflow-hidden",
                isToday ? "border-sky-500 ring-2 ring-sky-100" : "border-slate-100"
              )}
            >
              <div className={cn(
                "p-3 text-center",
                isToday ? "bg-sky-500 text-white" : "bg-slate-50"
              )}>
                <p className="text-xs font-medium uppercase">
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className="text-2xl font-bold">{format(day, 'd')}</p>
              </div>
              <div className="p-2 space-y-2 min-h-[150px]">
                {dayAppointments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Livre</p>
                ) : (
                  dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => handleEdit(appointment)}
                      className={cn(
                        "p-2 rounded-lg cursor-pointer transition-all text-xs",
                        appointment.status === 'cancelado'
                          ? "bg-red-50 border border-red-200"
                          : appointment.status === 'realizado'
                          ? "bg-emerald-50 border border-emerald-200"
                          : appointment.status === 'confirmado'
                          ? "bg-sky-50 border border-sky-200"
                          : "bg-amber-50 border border-amber-200"
                      )}
                    >
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <Clock className="w-3 h-3" />
                        {appointment.time}
                      </div>
                      <p className="font-medium text-slate-700 truncate">
                        {appointment.client_name}
                      </p>
                      {appointment.vehicle_plate && (
                        <p className="text-slate-500 truncate">{appointment.vehicle_plate}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Agendamentos de Hoje</h3>
        {todayAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nenhum agendamento para hoje"
            description="Aproveite para organizar a agenda"
          />
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-sky-100 flex flex-col items-center justify-center">
                      <Clock className="w-5 h-5 text-sky-600" />
                      <span className="text-sm font-bold text-sky-600">{appointment.time}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{appointment.client_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {appointment.client_phone && (
                          <>
                            <Phone className="w-3 h-3" />
                            <span>{appointment.client_phone}</span>
                          </>
                        )}
                        {appointment.vehicle_plate && (
                          <>
                            <Car className="w-3 h-3 ml-2" />
                            <span>{appointment.vehicle_plate}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {appointment.services?.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {s.service_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appointment.status} size="sm" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(appointment, 'confirmado')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-sky-600" />
                          Confirmar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(appointment, 'realizado')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                          Marcar como Realizado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(appointment, 'nao_compareceu')}>
                          <XCircle className="w-4 h-4 mr-2 text-orange-600" />
                          Não Compareceu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(appointment, 'cancelado')}>
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                          Cancelar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({ open: true, appointment })}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppointmentFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={handleSave}
        appointment={selectedAppointment}
        clients={clients}
        services={services}
        existingAppointments={appointments}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDialog.appointment?.id)}
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