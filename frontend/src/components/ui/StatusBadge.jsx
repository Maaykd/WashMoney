import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Play, CheckCircle2, XCircle, Calendar, AlertCircle } from 'lucide-react';

const statusConfig = {
  aguardando: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Aguardando' },
  em_andamento: { icon: Play, color: 'bg-sky-100 text-sky-700', label: 'Em Andamento' },
  finalizado: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Finalizado' },
  cancelado: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelado' },
  agendado: { icon: Calendar, color: 'bg-blue-100 text-blue-700', label: 'Agendado' },
  confirmado: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Confirmado' },
  realizado: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Realizado' },
  nao_compareceu: { icon: AlertCircle, color: 'bg-orange-100 text-orange-700', label: 'Não Compareceu' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = statusConfig[status] || statusConfig.aguardando;
  const Icon = config.icon;
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      config.color,
      sizes[size]
    )}>
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      {config.label}
    </span>
  );
}