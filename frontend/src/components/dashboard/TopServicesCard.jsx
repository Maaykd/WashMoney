import React from 'react';

export default function TopServicesCard({ services, orders }) {
  const serviceCount = {};
  orders.forEach(order => {
    order.services?.forEach(s => {
      serviceCount[s.service_name] = (serviceCount[s.service_name] || 0) + 1;
    });
  });

  const topServices = Object.entries(serviceCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const maxCount = topServices[0]?.[1] || 1;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Serviços Mais Vendidos</h3>
      <div className="space-y-4">
        {topServices.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Nenhum serviço registrado</p>
        ) : (
          topServices.map(([name, count], index) => (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 truncate">{name}</span>
                <span className="text-sm text-slate-500">{count} vendas</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}