import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Plus, AlertTriangle, Edit2, Trash2, MoreVertical, TrendingDown, TrendingUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import SupplyFormModal from '../components/supplies/SupplyFormModal';
import SupplyMovementModal from '../components/supplies/SupplyMovementModal';
import ServiceSupplyModal from '../components/supplies/ServiceSupplyModal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels = {
  limpeza: 'Limpeza',
  polimento: 'Polimento',
  higienizacao: 'Higienização',
  outros: 'Outros'
};

const unitLabels = {
  litro: 'L',
  ml: 'ml',
  kg: 'kg',
  g: 'g',
  unidade: 'un'
};

export default function Supplies() {
  const [modalOpen, setModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [serviceSupplyModalOpen, setServiceSupplyModalOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, supply: null });

  const queryClient = useQueryClient();

  const { data: supplies = [], isLoading } = useQuery({
    queryKey: ['supplies'],
    queryFn: () => base44.entities.Supply.list(),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['supplyMovements'],
    queryFn: () => base44.entities.SupplyMovement.list('-created_date'),
  });

  const { data: serviceSupplies = [] } = useQuery({
    queryKey: ['serviceSupplies'],
    queryFn: () => base44.entities.ServiceSupply.list(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supply.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setModalOpen(false);
      setSelectedSupply(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supply.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setModalOpen(false);
      setSelectedSupply(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supply.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setDeleteDialog({ open: false, supply: null });
    },
  });

  const handleSave = (data) => {
    if (selectedSupply) {
      updateMutation.mutate({ id: selectedSupply.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supply) => {
    setSelectedSupply(supply);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedSupply(null);
    setModalOpen(true);
  };

  const handleAddMovement = (supply) => {
    setSelectedSupply(supply);
    setMovementModalOpen(true);
  };

  const lowStockSupplies = supplies.filter(s => s.current_stock <= s.minimum_stock && s.active !== false);
  const activeSupplies = supplies.filter(s => s.active !== false);

  // Calcular consumo médio dos últimos 30 dias
  const last30DaysMovements = movements.filter(m => {
    const moveDate = new Date(m.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return moveDate >= thirtyDaysAgo && m.type === 'saida';
  });

  const getAverageConsumption = (supplyId) => {
    const supplyMovements = last30DaysMovements.filter(m => m.supply_id === supplyId);
    const total = supplyMovements.reduce((sum, m) => sum + m.quantity, 0);
    return total / 30;
  };

  return (
    <div>
      <PageHeader
        title="Controle de Insumos"
        subtitle="Gerencie o estoque e consumo de produtos"
        action={handleNew}
        actionLabel="Novo Insumo"
      />

      {/* Low Stock Alert */}
      {lowStockSupplies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">Estoque Baixo</h3>
              <p className="text-sm text-amber-700">
                {lowStockSupplies.length} {lowStockSupplies.length === 1 ? 'insumo está' : 'insumos estão'} abaixo do estoque mínimo
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {lowStockSupplies.map(supply => (
              <Badge key={supply.id} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                {supply.name}: {supply.current_stock} {unitLabels[supply.unit]}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{activeSupplies.length}</p>
                <p className="text-sm text-slate-500">Insumos Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{lowStockSupplies.length}</p>
                <p className="text-sm text-slate-500">Estoque Baixo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {last30DaysMovements.filter(m => m.reason === 'desperdicio').length}
                </p>
                <p className="text-sm text-slate-500">Desperdícios (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {supplies.reduce((sum, s) => sum + (s.current_stock * (s.cost_per_unit || 0)), 0).toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">Valor em Estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="supplies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="supplies">Insumos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="config">Consumo por Serviço</TabsTrigger>
        </TabsList>

        <TabsContent value="supplies">
          {activeSupplies.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum insumo cadastrado"
              description="Cadastre os produtos utilizados no seu lava jato"
              action={handleNew}
              actionLabel="Cadastrar Insumo"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSupplies.map((supply) => {
                const isLowStock = supply.current_stock <= supply.minimum_stock;
                const avgConsumption = getAverageConsumption(supply.id);
                const daysUntilEmpty = avgConsumption > 0 ? Math.floor(supply.current_stock / avgConsumption) : 999;

                return (
                  <Card key={supply.id} className={cn(isLowStock && "border-amber-300 bg-amber-50/50")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{supply.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {categoryLabels[supply.category] || supply.category}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddMovement(supply)}>
                              <History className="w-4 h-4 mr-2" />
                              Registrar Movimentação
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(supply)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, supply })}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Estoque Atual</p>
                            <p className={cn(
                              "text-2xl font-bold",
                              isLowStock ? "text-amber-600" : "text-slate-800"
                            )}>
                              {supply.current_stock} {unitLabels[supply.unit]}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">Mínimo</p>
                            <p className="text-lg font-medium text-slate-600">
                              {supply.minimum_stock} {unitLabels[supply.unit]}
                            </p>
                          </div>
                        </div>

                        {/* Stock Bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isLowStock ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{
                              width: `${Math.min((supply.current_stock / (supply.minimum_stock * 3)) * 100, 100)}%`
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Consumo médio: {avgConsumption.toFixed(2)} {unitLabels[supply.unit]}/dia
                          </span>
                          {daysUntilEmpty < 30 && (
                            <Badge variant={daysUntilEmpty < 7 ? "destructive" : "secondary"}>
                              ~{daysUntilEmpty} dias
                            </Badge>
                          )}
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-sm text-slate-500">
                            Custo: R$ {(supply.cost_per_unit || 0).toFixed(2)}/{unitLabels[supply.unit]}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Nenhuma movimentação"
                  description="As movimentações de estoque aparecerão aqui"
                />
              ) : (
                <div className="space-y-3">
                  {movements.slice(0, 50).map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          movement.type === 'entrada' ? "bg-emerald-100" : "bg-red-100"
                        )}>
                          {movement.type === 'entrada' ? (
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{movement.supply_name}</p>
                          <p className="text-sm text-slate-500">
                            {movement.reason === 'compra' && 'Compra'}
                            {movement.reason === 'consumo_servico' && 'Consumo em serviço'}
                            {movement.reason === 'desperdicio' && 'Desperdício'}
                            {movement.reason === 'ajuste_inventario' && 'Ajuste de inventário'}
                            {movement.reason === 'vencido' && 'Produto vencido'}
                            {movement.employee_name && ` • ${movement.employee_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          movement.type === 'entrada' ? "text-emerald-600" : "text-red-600"
                        )}>
                          {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(movement.date), 'dd/MM/yy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Consumo por Serviço</CardTitle>
              <Button onClick={() => setServiceSupplyModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </CardHeader>
            <CardContent>
              {serviceSupplies.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Nenhuma configuração"
                  description="Configure o consumo de insumos por serviço para desconto automático do estoque"
                  action={() => setServiceSupplyModalOpen(true)}
                  actionLabel="Configurar"
                />
              ) : (
                <div className="space-y-4">
                  {services.filter(s => s.active !== false).map(service => {
                    const serviceSupplyList = serviceSupplies.filter(ss => ss.service_id === service.id);
                    if (serviceSupplyList.length === 0) return null;

                    return (
                      <div key={service.id} className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-800 mb-2">{service.name}</h4>
                        <div className="flex flex-wrap gap-2">
                          {serviceSupplyList.map(ss => {
                            const supply = supplies.find(s => s.id === ss.supply_id);
                            return (
                              <Badge key={ss.id} variant="secondary">
                                {ss.supply_name}: {ss.quantity_per_service} {supply ? unitLabels[supply.unit] : ''}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SupplyFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSupply(null);
        }}
        onSave={handleSave}
        supply={selectedSupply}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <SupplyMovementModal
        open={movementModalOpen}
        onClose={() => {
          setMovementModalOpen(false);
          setSelectedSupply(null);
        }}
        supply={selectedSupply}
        supplies={supplies}
      />

      <ServiceSupplyModal
        open={serviceSupplyModalOpen}
        onClose={() => setServiceSupplyModalOpen(false)}
        services={services}
        supplies={supplies}
        existingServiceSupplies={serviceSupplies}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir insumo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteDialog.supply?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDialog.supply?.id)}
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