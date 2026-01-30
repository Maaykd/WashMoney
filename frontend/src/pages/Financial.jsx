import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote, Smartphone, Edit2, Trash2, MoreVertical, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import FinancialFormModal from '../components/financial/FinancialFormModal';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const categoryLabels = {
  servico: 'Serviço',
  produto: 'Produto',
  salario: 'Salário',
  aluguel: 'Aluguel',
  agua: 'Água',
  luz: 'Luz',
  material: 'Material',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

const paymentIcons = {
  dinheiro: Banknote,
  pix: Smartphone,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
};

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Financial() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, transaction: null });
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['financial'],
    queryFn: () => base44.entities.Financial.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Financial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setModalOpen(false);
      setSelectedTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Financial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setModalOpen(false);
      setSelectedTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Financial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setDeleteDialog({ open: false, transaction: null });
    },
  });

  const handleSave = (data) => {
    if (selectedTransaction) {
      updateMutation.mutate({ id: selectedTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedTransaction(null);
    setModalOpen(true);
  };

  // Filter transactions
  const [year, month] = monthFilter.split('-');
  const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
  const monthEnd = endOfMonth(monthStart);

  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const matchesMonth = isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesMonth && matchesType;
  });

  // Calculate totals
  const totalEntradas = filteredTransactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSaidas = filteredTransactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const lucro = totalEntradas - totalSaidas;

  // Payment method breakdown
  const paymentBreakdown = filteredTransactions
    .filter(t => t.type === 'entrada')
    .reduce((acc, t) => {
      const method = t.payment_method || 'outros';
      acc[method] = (acc[method] || 0) + (t.amount || 0);
      return acc;
    }, {});

  const pieData = Object.entries(paymentBreakdown).map(([name, value]) => ({
    name: name === 'dinheiro' ? 'Dinheiro' : 
          name === 'pix' ? 'PIX' : 
          name === 'cartao_credito' ? 'Cartão Crédito' : 
          name === 'cartao_debito' ? 'Cartão Débito' : 'Outros',
    value
  }));

  // Generate month options
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
    });
  }

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Controle de entradas e saídas"
        action={handleNew}
        actionLabel="Novo Lançamento"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Entradas</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {totalEntradas.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Saídas</p>
              <p className="text-2xl font-bold text-red-500">R$ {totalSaidas.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Lucro Estimado</p>
              <p className={cn("text-2xl font-bold", lucro >= 0 ? "text-sky-600" : "text-red-500")}>
                R$ {lucro.toFixed(2)}
              </p>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", 
              lucro >= 0 ? "bg-sky-100" : "bg-red-100"
            )}>
              {lucro >= 0 ? (
                <TrendingUp className="w-6 h-6 text-sky-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Entradas por Forma de Pagamento</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">Nenhum dado disponível</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumo por Categoria</h3>
          <div className="space-y-3">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const categoryTotal = filteredTransactions
                .filter(t => t.category === key)
                .reduce((sum, t) => sum + (t.type === 'entrada' ? t.amount : -t.amount), 0);
              if (categoryTotal === 0) return null;
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className={cn("font-bold", categoryTotal >= 0 ? "text-emerald-600" : "text-red-500")}>
                    R$ {Math.abs(categoryTotal).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 && !isLoading ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhum lançamento"
          description="Registre suas entradas e saídas"
          action={handleNew}
          actionLabel="Novo Lançamento"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((transaction) => {
              const PaymentIcon = paymentIcons[transaction.payment_method] || DollarSign;
              return (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      transaction.type === 'entrada' ? "bg-emerald-100" : "bg-red-100"
                    )}>
                      {transaction.type === 'entrada' ? (
                        <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {transaction.description || categoryLabels[transaction.category]}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{format(new Date(transaction.date), 'dd/MM/yyyy')}</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[transaction.category]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        transaction.type === 'entrada' ? "text-emerald-600" : "text-red-500"
                      )}>
                        {transaction.type === 'entrada' ? '+' : '-'} R$ {transaction.amount?.toFixed(2)}
                      </p>
                      {transaction.payment_method && (
                        <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                          <PaymentIcon className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({ open: true, transaction })}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FinancialFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSave={handleSave}
        transaction={selectedTransaction}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteDialog.transaction?.id)}
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