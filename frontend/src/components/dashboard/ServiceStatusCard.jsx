import React from 'react';
import { Clock, Play, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ServiceStatusCard({ orders }) {
  const statusCounts = {
    aguardando: orders.filter(o => o.status === 'aguardando').length,
    em_andamento: orders.filter(o => o.status === 'em_andamento').length,
    finalizado: orders.filter(o => o.status === 'finalizado').length,
    cancelado: orders.filter(o => o.status === 'cancelado').length,
  };

  const statuses = [
    { key: 'aguardando', label: 'Aguardando', icon: Clock, color: 'bg-amber-100 text-amber-600', count: statusCounts.aguardando },
    { key: 'em_andamento', label: 'Em Andamento', icon: Play, color: 'bg-sky-100 text-sky-600', count: statusCounts.em_andamento },
    { key: 'finalizado', label: 'Finalizados', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600', count: statusCounts.finalizado },
    { key: 'cancelado', label: 'Cancelados', icon: XCircle, color: 'bg-red-100 text-red-600', count: statusCounts.cancelado },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Status dos Serviços</h3>
      <div className="space-y-4">
        {statuses.map((status) => {
          const Icon = status.icon;
          return (
            <div key={status.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", status.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-700">{status.label}</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">{status.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}