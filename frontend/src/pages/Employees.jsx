import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCog, Phone, Percent, Calendar, Edit2, Trash2, MoreVertical, DollarSign, TrendingUp, Eye, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import EmployeeFormModal from '../components/employees/EmployeeFormModal';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const roleLabels = {
  lavador: 'Lavador',
  polidor: 'Polidor',
  atendente: 'Atendente',
  gerente: 'Gerente',
};

const roleColors = {
  lavador: 'bg-sky-100 text-sky-700',
  polidor: 'bg-purple-100 text-purple-700',
  atendente: 'bg-amber-100 text-amber-700',
  gerente: 'bg-emerald-100 text-emerald-700',
};

export default function Employees() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, employee: null });
  
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date'),
  });

  const { data: employeeLogs = [] } = useQuery({
    queryKey: ['employeeLogs'],
    queryFn: () => base44.entities.EmployeeServiceLog.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModalOpen(false);
      setSelectedEmployee(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModalOpen(false);
      setSelectedEmployee(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteDialog({ open: false, employee: null });
    },
  });

  const handleSave = (data) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedEmployee(null);
    setModalOpen(true);
  };

  const getEmployeeStats = (employeeId) => {
    const employeeOrders = orders.filter(o => o.employee_id === employeeId && o.status === 'finalizado');
    const totalServices = employeeOrders.length;
    const totalRevenue = employeeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // This month stats
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthOrders = employeeOrders.filter(o => {
      const date = new Date(o.created_date);
      return date >= monthStart && date <= monthEnd;
    });
    const monthServices = monthOrders.length;
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Commission from logs
    const logs = employeeLogs.filter(l => l.employee_id === employeeId);
    const totalCommission = logs.reduce((sum, l) => sum + (l.commission_value || 0), 0);
    const pendingCommission = logs.filter(l => !l.paid).reduce((sum, l) => sum + (l.commission_value || 0), 0);
    
    return { totalServices, totalRevenue, monthServices, monthRevenue, totalCommission, pendingCommission };
  };

  const getEmployeeLogs = (employeeId) => {
    return employeeLogs.filter(l => l.employee_id === employeeId);
  };

  return (
    <div>
      <PageHeader
        title="Funcionários"
        subtitle="Gerencie sua equipe"
        action={handleNew}
        actionLabel="Novo Funcionário"
      />

      {employees.length === 0 && !isLoading ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum funcionário cadastrado"
          description="Cadastre os funcionários do seu lava jato"
          action={handleNew}
          actionLabel="Cadastrar Funcionário"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => {
            const stats = getEmployeeStats(employee.id);
            return (
              <div
                key={employee.id}
                className={cn(
                  "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all",
                  !employee.active && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-sky-600">
                        {employee.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{employee.name}</h3>
                      <Badge className={cn("text-xs", roleColors[employee.role])}>
                        {roleLabels[employee.role] || employee.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, employee })}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(employee)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialog({ open: true, employee })}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.commission_percent > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Percent className="w-4 h-4 text-slate-400" />
                      <span>{employee.commission_percent}% de comissão</span>
                    </div>
                  )}
                  {employee.hire_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Desde {format(new Date(employee.hire_date), "MMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Este Mês</p>
                    <p className="text-lg font-bold text-slate-800">{stats.monthServices} serviços</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Comissão Pendente</p>
                    <p className="text-lg font-bold text-emerald-600">R$ {stats.pendingCommission.toFixed(2)}</p>
                  </div>
                </div>
                
                {employee.monthly_goal > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Meta: {employee.monthly_goal} serviços</span>
                      <span className="font-medium">{Math.round((stats.monthServices / employee.monthly_goal) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.monthServices / employee.monthly_goal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {!employee.active && (
                  <Badge variant="secondary" className="mt-3 bg-slate-100 text-slate-500">
                    Inativo
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={handleSave}
        employee={selectedEmployee}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o funcionário "{deleteDialog.employee?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDialog.employee?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico - {detailsDialog.employee?.name}</DialogTitle>
          </DialogHeader>
          {detailsDialog.employee && (
            <div className="space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">
                      {getEmployeeStats(detailsDialog.employee.id).totalServices}
                    </p>
                    <p className="text-xs text-slate-500">Total Serviços</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-sky-600">
                      R$ {getEmployeeStats(detailsDialog.employee.id).totalRevenue.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500">Receita Gerada</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      R$ {getEmployeeStats(detailsDialog.employee.id).totalCommission.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">Total Comissões</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      R$ {getEmployeeStats(detailsDialog.employee.id).pendingCommission.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">Pendente</p>
                  </CardContent>
                </Card>
              </div>

              {/* Service History */}
              <Tabs defaultValue="logs">
                <TabsList>
                  <TabsTrigger value="logs">Histórico de Serviços</TabsTrigger>
                  <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
                </TabsList>
                
                <TabsContent value="logs">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>OS</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Comissão</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getEmployeeLogs(detailsDialog.employee.id).slice(0, 20).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.date), 'dd/MM/yy')}</TableCell>
                            <TableCell className="font-medium">{log.order_number}</TableCell>
                            <TableCell>{log.service_name}</TableCell>
                            <TableCell className="text-right">R$ {(log.service_value || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right text-emerald-600">
                              R$ {(log.commission_value || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.paid ? "secondary" : "outline"} className={log.paid ? "bg-emerald-100 text-emerald-700" : ""}>
                                {log.paid ? 'Pago' : 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {getEmployeeLogs(detailsDialog.employee.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                              Nenhum registro encontrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="orders">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>OS</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter(o => o.employee_id === detailsDialog.employee.id)
                          .slice(0, 20)
                          .map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{format(new Date(order.created_date), 'dd/MM/yy')}</TableCell>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>{order.client_name}</TableCell>
                              <TableCell>{order.vehicle_plate}</TableCell>
                              <TableCell className="text-right font-medium">R$ {(order.total || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}