import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, TrendingUp, TrendingDown, Users, Car, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../components/ui/PageHeader';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: orders = [] } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date'),
  });

  const { data: financial = [] } = useQuery({
    queryKey: ['financial'],
    queryFn: () => base44.entities.Financial.list('-date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  const { data: employeeLogs = [] } = useQuery({
    queryKey: ['employeeLogs'],
    queryFn: () => base44.entities.EmployeeServiceLog.list('-date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Filter data by selected month
  const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);

  const monthOrders = orders.filter(o => {
    const date = new Date(o.created_date);
    return date >= monthStart && date <= monthEnd;
  });

  const monthFinancial = financial.filter(f => {
    const date = new Date(f.date);
    return date >= monthStart && date <= monthEnd;
  });

  const monthLogs = employeeLogs.filter(l => {
    const date = new Date(l.date);
    return date >= monthStart && date <= monthEnd;
  });

  // Calculate stats
  const totalRevenue = monthFinancial.filter(f => f.type === 'entrada').reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = monthFinancial.filter(f => f.type === 'saida').reduce((sum, f) => sum + f.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const completedOrders = monthOrders.filter(o => o.status === 'finalizado').length;
  const avgTicket = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  // Service breakdown
  const serviceBreakdown = {};
  monthOrders.forEach(order => {
    order.services?.forEach(s => {
      if (!serviceBreakdown[s.service_name]) {
        serviceBreakdown[s.service_name] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[s.service_name].count++;
      serviceBreakdown[s.service_name].revenue += s.price || 0;
    });
  });

  const serviceData = Object.entries(serviceBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  // Employee productivity
  const employeeProductivity = {};
  monthLogs.forEach(log => {
    if (!employeeProductivity[log.employee_name]) {
      employeeProductivity[log.employee_name] = {
        name: log.employee_name,
        services: 0,
        revenue: 0,
        commission: 0,
      };
    }
    employeeProductivity[log.employee_name].services++;
    employeeProductivity[log.employee_name].revenue += log.service_value || 0;
    employeeProductivity[log.employee_name].commission += log.commission_value || 0;
  });

  const employeeData = Object.values(employeeProductivity).sort((a, b) => b.revenue - a.revenue);

  // Daily revenue chart
  const dailyRevenue = {};
  monthFinancial.filter(f => f.type === 'entrada').forEach(f => {
    const day = format(new Date(f.date), 'dd/MM');
    dailyRevenue[day] = (dailyRevenue[day] || 0) + f.amount;
  });

  const dailyData = Object.entries(dailyRevenue).map(([day, value]) => ({ day, value }));

  // Payment methods
  const paymentMethods = {};
  monthOrders.filter(o => o.status === 'finalizado').forEach(o => {
    const method = o.payment_method || 'outros';
    paymentMethods[method] = (paymentMethods[method] || 0) + (o.total || 0);
  });

  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'dinheiro' ? 'Dinheiro' :
          name === 'pix' ? 'PIX' :
          name === 'cartao_credito' ? 'Cartão Crédito' :
          name === 'cartao_debito' ? 'Cartão Débito' : 'Outros',
    value,
  }));

  // Export functions
  const exportToPDF = async (reportType) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR });

    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 20);
    doc.setFontSize(12);
    doc.text(monthLabel, 20, 30);

    doc.setFontSize(14);
    doc.text('Resumo Geral', 20, 45);

    doc.setFontSize(11);
    doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, 20, 55);
    doc.text(`Despesas: R$ ${totalExpenses.toFixed(2)}`, 20, 63);
    doc.text(`Lucro: R$ ${profit.toFixed(2)}`, 20, 71);
    doc.text(`Serviços Realizados: ${completedOrders}`, 20, 79);
    doc.text(`Ticket Médio: R$ ${avgTicket.toFixed(2)}`, 20, 87);

    if (reportType === 'services' || reportType === 'full') {
      doc.setFontSize(14);
      doc.text('Serviços por Categoria', 20, 105);
      
      let y = 115;
      serviceData.slice(0, 10).forEach(service => {
        doc.setFontSize(10);
        doc.text(`${service.name}: ${service.count}x - R$ ${service.revenue.toFixed(2)}`, 25, y);
        y += 8;
      });
    }

    if (reportType === 'employees' || reportType === 'full') {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Produtividade por Funcionário', 20, 20);

      let y = 35;
      employeeData.forEach(emp => {
        doc.setFontSize(10);
        doc.text(`${emp.name}`, 25, y);
        doc.text(`Serviços: ${emp.services} | Receita: R$ ${emp.revenue.toFixed(2)} | Comissão: R$ ${emp.commission.toFixed(2)}`, 25, y + 6);
        y += 16;
      });
    }

    doc.save(`relatorio-${selectedMonth}.pdf`);
  };

  const exportToCSV = (reportType) => {
    let csvContent = '';

    if (reportType === 'financial') {
      csvContent = 'Data,Tipo,Categoria,Descrição,Valor,Forma de Pagamento\n';
      monthFinancial.forEach(f => {
        csvContent += `${f.date},${f.type},${f.category},"${f.description || ''}",${f.amount},${f.payment_method || ''}\n`;
      });
    } else if (reportType === 'services') {
      csvContent = 'Serviço,Quantidade,Receita Total\n';
      serviceData.forEach(s => {
        csvContent += `"${s.name}",${s.count},${s.revenue}\n`;
      });
    } else if (reportType === 'employees') {
      csvContent = 'Funcionário,Serviços,Receita Gerada,Comissão\n';
      employeeData.forEach(e => {
        csvContent += `"${e.name}",${e.services},${e.revenue},${e.commission}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${reportType}-${selectedMonth}.csv`;
    link.click();
  };

  // Generate month options
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
    });
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        subtitle="Análises e exportações profissionais"
      />

      {/* Month Selector */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => exportToPDF('full')}>
            <Download className="w-4 h-4 mr-2" />
            PDF Completo
          </Button>
          <Button variant="outline" onClick={() => exportToCSV('financial')}>
            <FileText className="w-4 h-4 mr-2" />
            Excel Financeiro
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Receita</p>
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
                <p className="text-2xl font-bold text-slate-800">R$ {totalExpenses.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Despesas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  R$ {profit.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">Lucro</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{completedOrders}</p>
                <p className="text-sm text-slate-500">Serviços</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">R$ {avgTicket.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Receita Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                      <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => exportToCSV('services')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceData.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceData.map((service, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-right">{service.count}</TableCell>
                        <TableCell className="text-right">R$ {service.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => exportToCSV('employees')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produtividade por Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-right">Serviços</TableHead>
                    <TableHead className="text-right">Receita Gerada</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Média/Serviço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeData.map((emp, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-right">{emp.services}</TableCell>
                      <TableCell className="text-right">R$ {emp.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {emp.commission.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        R$ {emp.services > 0 ? (emp.revenue / emp.services).toFixed(2) : '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#0ea5e9" name="Receita" />
                    <Bar dataKey="commission" fill="#10b981" name="Comissão" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}