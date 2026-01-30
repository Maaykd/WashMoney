import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';

export default function ClientFormModal({ open, onClose, onSave, client, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicles: [],
    notes: '',
  });

  const [newVehicle, setNewVehicle] = useState({ plate: '', model: '', color: '', year: '' });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        vehicles: client.vehicles || [],
        notes: client.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        vehicles: [],
        notes: '',
      });
    }
    setNewVehicle({ plate: '', model: '', color: '', year: '' });
  }, [client, open]);

  const handleAddVehicle = () => {
    if (newVehicle.plate && newVehicle.model) {
      setFormData({
        ...formData,
        vehicles: [...formData.vehicles, { ...newVehicle, plate: newVehicle.plate.toUpperCase() }],
      });
      setNewVehicle({ plate: '', model: '', color: '', year: '' });
    }
  };

  const handleRemoveVehicle = (index) => {
    setFormData({
      ...formData,
      vehicles: formData.vehicles.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Veículos</Label>
            
            {formData.vehicles.map((vehicle, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{vehicle.plate}</p>
                  <p className="text-sm text-slate-500">
                    {vehicle.model} {vehicle.color && `• ${vehicle.color}`} {vehicle.year && `• ${vehicle.year}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveVehicle(index)}
                  className="h-8 w-8 text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="p-4 border border-dashed border-slate-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-slate-600">Adicionar veículo</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Placa"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                />
                <Input
                  placeholder="Modelo"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
                <Input
                  placeholder="Cor"
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                />
                <Input
                  placeholder="Ano"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVehicle}
                disabled={!newVehicle.plate || !newVehicle.model}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre o cliente..."
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {client ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}