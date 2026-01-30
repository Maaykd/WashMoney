import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Car, Clock, Play, CheckCircle2, XCircle, MoreVertical, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import ServiceOrderFormModal from '../components/orders/ServiceOrderFormModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const paymentLabels = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
};

export default function ServiceOrders() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, order: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: serviceSupplies = [] } = useQuery({
    queryKey: ['serviceSupplies'],
    queryFn: () => base44.entities.ServiceSupply.list(),
  });

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies'],
    queryFn: () => base44.entities.Supply.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDeleteDialog({ open: false, order: null });
    },
  });

  const handleSave = (data) => {
    if (selectedOrder) {
      updateMutation.mutate({ id: selectedOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'em_andamento' && !order.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (newStatus === 'finalizado' && !order.finished_at) {
      updates.finished_at = new Date().toISOString();
      
      // Register employee commission log
      if (order.employee_id) {
        const employee = employees.find(e => e.id === order.employee_id);
        if (employee && employee.commission_percent > 0) {
          const commissionValue = (order.total || 0) * (employee.commission_percent / 100);
          await base44.entities.EmployeeServiceLog.create({
            employee_id: order.employee_id,
            employee_name: order.employee_name,
            service_order_id: order.id,
            order_number: order.order_number,
            service_name: order.services?.map(s => s.service_name).join(', ') || '',
            service_value: order.total || 0,
            commission_percent: employee.commission_percent,
            commission_value: commissionValue,
            date: format(new Date(), 'yyyy-MM-dd'),
            paid: false,
          });
        }
      }

      // Deduct supplies automatically
      for (const service of (order.services || [])) {
        const serviceSupplyList = serviceSupplies.filter(ss => ss.service_id === service.service_id);
        for (const ss of serviceSupplyList) {
          const supply = supplies.find(s => s.id === ss.supply_id);
          if (supply) {
            // Create movement record
            await base44.entities.SupplyMovement.create({
              supply_id: ss.supply_id,
              supply_name: ss.supply_name,
              type: 'saida',
              quantity: ss.quantity_per_service,
              reason: 'consumo_servico',
              service_order_id: order.id,
              employee_id: order.employee_id,
              employee_name: order.employee_name,
              date: format(new Date(), 'yyyy-MM-dd'),
            });
            
            // Update supply stock
            await base44.entities.Supply.update(supply.id, {
              current_stock: Math.max(0, supply.current_stock - ss.quantity_per_service),
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      queryClient.invalidateQueries({ queryKey: ['supplyMovements'] });
      queryClient.invalidateQueries({ queryKey: ['employeeLogs'] });
    }
    updateMutation.mutate({ id: order.id, data: updates });
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedOrder(null);
    setModalOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Gerencie os serviços em andamento"
        action={handleNew}
        actionLabel="Nova OS"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, placa ou nº OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="finalizado">Finalizados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 && !isLoading ? (
        <EmptyState
          icon={ClipboardList}
          title={searchTerm || statusFilter !== 'all' ? "Nenhuma OS encontrada" : "Nenhuma ordem de serviço"}
          description={searchTerm || statusFilter !== 'all' ? "Tente outros filtros" : "Crie uma nova ordem de serviço"}
          action={!searchTerm && statusFilter === 'all' ? handleNew : undefined}
          actionLabel="Criar OS"
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex w-14 h-14 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 items-center justify-center">
                    <Car className="w-7 h-7 text-sky-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{order.client_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {order.order_number}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {order.vehicle_plate} • {order.vehicle_model}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {order.services?.map((service, index) => (
                        <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700">
                          {service.service_name}
                        </Badge>
                      ))}
                    </div>
                    {order.employee_name && (
                      <p className="text-xs text-slate-400 mt-2">
                        Responsável: {order.employee_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <p className="text-xl font-bold text-sky-600">
                    R$ {order.total?.toFixed(2)}
                  </p>
                  {order.payment_method && (
                    <p className="text-xs text-slate-500">
                      {paymentLabels[order.payment_method]}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {format(new Date(order.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  {order.status === 'aguardando' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order, 'em_andamento')}
                      className="bg-sky-500 hover:bg-sky-600"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  {order.status === 'em_andamento' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order, 'finalizado')}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Finalizar
                    </Button>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(order)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'aguardando')}>
                      <Clock className="w-4 h-4 mr-2" />
                      Aguardando
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'em_andamento')}>
                      <Play className="w-4 h-4 mr-2" />
                      Em Andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'finalizado')}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'cancelado')}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelado
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialog({ open: true, order })}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceOrderFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSave}
        order={selectedOrder}
        clients={clients}
        services={services}
        employees={employees}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ordem de serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS "{deleteDialog.order?.order_number}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDialog.order?.id)}
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