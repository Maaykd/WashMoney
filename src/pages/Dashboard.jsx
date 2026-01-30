import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Car, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatsCard from '../components/dashboard/StatsCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import ServiceStatusCard from '../components/dashboard/ServiceStatusCard';
import TopServicesCard from '../components/dashboard/TopServicesCard';
import RecentOrdersCard from '../components/dashboard/RecentOrdersCard';

export default function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  // Stats calculations
  const todayOrders = orders.filter(o => isToday(new Date(o.created_date)));
  const weekOrders = orders.filter(o => isThisWeek(new Date(o.created_date)));
  const monthOrders = orders.filter(o => isThisMonth(new Date(o.created_date)));

  const todayRevenue = todayOrders
    .filter(o => o.status === 'finalizado')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const weekRevenue = weekOrders
    .filter(o => o.status === 'finalizado')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const monthRevenue = monthOrders
    .filter(o => o.status === 'finalizado')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const todayAppointments = appointments.filter(a => 
    a.date === format(new Date(), 'yyyy-MM-dd') && a.status !== 'cancelado'
  );

  // Weekly chart data
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const chartData = weekDays.map((name, index) => {
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate.getDay() === index && isThisWeek(orderDate) && o.status === 'finalizado';
    });
    return {
      name,
      value: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Carros Hoje"
          value={todayOrders.length}
          subtitle={`${todayOrders.filter(o => o.status === 'finalizado').length} finalizados`}
          icon={Car}
          color="sky"
        />
        <StatsCard
          title="Faturamento Hoje"
          value={`R$ ${todayRevenue.toFixed(2)}`}
          subtitle={`Semana: R$ ${weekRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Faturamento Mensal"
          value={`R$ ${monthRevenue.toFixed(2)}`}
          subtitle={`${monthOrders.length} serviços`}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Agendamentos Hoje"
          value={todayAppointments.length}
          subtitle={`${clients.length} clientes cadastrados`}
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={chartData} />
        <ServiceStatusCard orders={todayOrders} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopServicesCard services={services} orders={monthOrders} />
        <RecentOrdersCard orders={orders} />
      </div>
    </div>
  );
}