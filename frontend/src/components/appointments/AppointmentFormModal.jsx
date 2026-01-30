import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

export default function AppointmentFormModal({ 
  open, 
  onClose, 
  onSave, 
  appointment, 
  clients, 
  services,
  existingAppointments,
  loading 
}) {
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_phone: '',
    vehicle_plate: '',
    vehicle_model: '',
    services: [],
    date: '',
    time: '',
    notes: '',
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormData({
        client_id: appointment.client_id || '',
        client_name: appointment.client_name || '',
        client_phone: appointment.client_phone || '',
        vehicle_plate: appointment.vehicle_plate || '',
        vehicle_model: appointment.vehicle_model || '',
        services: appointment.services || [],
        date: appointment.date || '',
        time: appointment.time || '',
        notes: appointment.notes || '',
      });
      setClientSearch(appointment.client_name || '');
    } else {
      setFormData({
        client_id: '',
        client_name: '',
        client_phone: '',
        vehicle_plate: '',
        vehicle_model: '',
        services: [],
        date: new Date().toISOString().split('T')[0],
        time: '',
        notes: '',
      });
      setClientSearch('');
    }
  }, [appointment, open]);

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone?.includes(clientSearch)
  );

  const handleClientSelect = (client) => {
    setClientSearch(client.name);
    setFormData({
      ...formData,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone,
      vehicle_plate: client.vehicles?.[0]?.plate || '',
      vehicle_model: client.vehicles?.[0]?.model || '',
    });
    setShowClientDropdown(false);
  };

  const handleServiceToggle = (service, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        services: [
          ...formData.services,
          { service_id: service.id, service_name: service.name, price: service.price }
        ],
      });
    } else {
      setFormData({
        ...formData,
        services: formData.services.filter(s => s.service_id !== service.id),
      });
    }
  };

  const isTimeSlotTaken = (time) => {
    if (!formData.date) return false;
    return existingAppointments?.some(a => 
      a.date === formData.date && 
      a.time === time && 
      a.id !== appointment?.id &&
      a.status !== 'cancelado'
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: appointment?.status || 'agendado',
    });
  };

  const activeServices = services.filter(s => s.active !== false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                  setFormData({ ...formData, client_name: e.target.value, client_id: '' });
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="pl-9"
                required
              />
              {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>Placa</Label>
              <Input
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                placeholder="ABC1234"
              />
            </div>
          </div>

          <div>
            <Label>Modelo do Veículo</Label>
            <Input
              value={formData.vehicle_model}
              onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
              placeholder="Ex: Honda Civic"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => {
                const isTaken = isTimeSlotTaken(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => !isTaken && setFormData({ ...formData, time })}
                    disabled={isTaken}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      formData.time === time
                        ? "bg-sky-500 text-white"
                        : isTaken
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2">
            <Label>Serviços</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {activeServices.map((service) => {
                const isSelected = formData.services.some(s => s.service_id === service.id);
                return (
                  <div
                    key={service.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                    onClick={() => handleServiceToggle(service, !isSelected)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                      <span className="font-medium text-slate-800">{service.name}</span>
                    </div>
                    <span className="font-bold text-sky-600">R$ {service.price?.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações..."
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.time}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {appointment ? 'Salvar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}