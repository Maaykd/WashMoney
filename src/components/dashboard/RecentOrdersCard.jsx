import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Clock, Play, CheckCircle2, ChevronRight, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  aguardando: { icon: Clock, color: 'bg-amber-100 text-amber-600', label: 'Aguardando' },
  em_andamento: { icon: Play, color: 'bg-sky-100 text-sky-600', label: 'Em Andamento' },
  finalizado: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600', label: 'Finalizado' },
  cancelado: { icon: Clock, color: 'bg-red-100 text-red-600', label: 'Cancelado' },
};

export default function RecentOrdersCard({ orders }) {
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Ordens Recentes</h3>
        <Link 
          to={createPageUrl('ServiceOrders')}
          className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
        >
          Ver todas <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {recentOrders.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Nenhuma ordem registrada</p>
        ) : (
          recentOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.aguardando;
            const Icon = status.icon;
            return (
              <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{order.client_name}</p>
                  <p className="text-sm text-slate-500">{order.vehicle_plate} • {order.vehicle_model}</p>
                </div>
                <div className="text-right">
                  <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium", status.color)}>
                    <Icon className="w-3 h-3" />
                    {status.label}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    R$ {order.total?.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}