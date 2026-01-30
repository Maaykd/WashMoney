import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Car, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ServiceOrderFormModal({ 
  open, 
  onClose, 
  onSave, 
  order, 
  clients, 
  services, 
  employees,
  loading 
}) {
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    vehicle_plate: '',
    vehicle_model: '',
    services: [],
    employee_id: '',
    employee_name: '',
    payment_method: '',
    discount: 0,
    notes: '',
  });

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        client_id: order.client_id || '',
        client_name: order.client_name || '',
        vehicle_plate: order.vehicle_plate || '',
        vehicle_model: order.vehicle_model || '',
        services: order.services || [],
        employee_id: order.employee_id || '',
        employee_name: order.employee_name || '',
        payment_method: order.payment_method || '',
        discount: order.discount || 0,
        notes: order.notes || '',
      });
      const client = clients.find(c => c.id === order.client_id);
      setSelectedClient(client || null);
      setClientSearch(order.client_name || '');
    } else {
      setFormData({
        client_id: '',
        client_name: '',
        vehicle_plate: '',
        vehicle_model: '',
        services: [],
        employee_id: '',
        employee_name: '',
        payment_method: '',
        discount: 0,
        notes: '',
      });
      setSelectedClient(null);
      setClientSearch('');
    }
  }, [order, open, clients]);

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone?.includes(clientSearch) ||
    client.vehicles?.some(v => v.plate?.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setFormData({
      ...formData,
      client_id: client.id,
      client_name: client.name,
      vehicle_plate: client.vehicles?.[0]?.plate || '',
      vehicle_model: client.vehicles?.[0]?.model || '',
    });
    setShowClientDropdown(false);
  };

  const handleVehicleSelect = (vehicle) => {
    setFormData({
      ...formData,
      vehicle_plate: vehicle.plate,
      vehicle_model: vehicle.model,
    });
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

  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData({
      ...formData,
      employee_id: employeeId,
      employee_name: employee?.name || '',
    });
  };

  const calculateTotal = () => {
    const servicesTotal = formData.services.reduce((sum, s) => sum + (s.price || 0), 0);
    return servicesTotal - (formData.discount || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderNumber = order?.order_number || `OS-${Date.now().toString(36).toUpperCase()}`;
    onSave({
      ...formData,
      order_number: orderNumber,
      total: calculateTotal(),
      status: order?.status || 'aguardando',
    });
  };

  const activeServices = services.filter(s => s.active !== false);
  const activeEmployees = employees.filter(e => e.active !== false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-3">
            <Label>Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente por nome, telefone ou placa..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="pl-9"
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

            {/* Quick Client Entry */}
            {!selectedClient && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Nome do cliente"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required={!selectedClient}
                />
                <Input
                  placeholder="Placa do veículo"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            )}
          </div>

          {/* Vehicle Selection (if client selected) */}
          {selectedClient && selectedClient.vehicles?.length > 0 && (
            <div className="space-y-2">
              <Label>Veículo</Label>
              <div className="flex flex-wrap gap-2">
                {selectedClient.vehicles.map((vehicle, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleVehicleSelect(vehicle)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                      formData.vehicle_plate === vehicle.plate
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Car className="w-4 h-4" />
                    <span className="font-medium">{vehicle.plate}</span>
                    <span className="text-sm text-slate-500">{vehicle.model}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Model */}
          <div>
            <Label>Modelo do Veículo</Label>
            <Input
              value={formData.vehicle_model}
              onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
              placeholder="Ex: Honda Civic 2020"
            />
          </div>

          {/* Services Selection */}
          <div className="space-y-3">
            <Label>Serviços</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
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
                      <Checkbox checked={isSelected} onCheckedChange={(checked) => handleServiceToggle(service, checked)} />
                      <div>
                        <p className="font-medium text-slate-800">{service.name}</p>
                        <p className="text-xs text-slate-500">{service.duration_minutes || 30} min</p>
                      </div>
                    </div>
                    <span className="font-bold text-sky-600">R$ {service.price?.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Funcionário</Label>
              <Select
                value={formData.employee_id}
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Discount */}
          <div>
            <Label>Desconto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o serviço..."
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="text-lg font-medium text-slate-700">Total</span>
            <span className="text-2xl font-bold text-sky-600">R$ {calculateTotal().toFixed(2)}</span>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || formData.services.length === 0}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {order ? 'Salvar' : 'Criar OS'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}