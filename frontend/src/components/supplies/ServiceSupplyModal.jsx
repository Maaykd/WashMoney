import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ServiceSupplyModal({ open, onClose, services, supplies, existingServiceSupplies }) {
  const [selectedService, setSelectedService] = useState('');
  const [selectedSupply, setSelectedSupply] = useState('');
  const [quantity, setQuantity] = useState(0);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceSupply.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSupplies'] });
      setSelectedSupply('');
      setQuantity(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceSupply.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSupplies'] });
    },
  });

  const handleAdd = () => {
    if (!selectedService || !selectedSupply || quantity <= 0) return;

    const service = services.find(s => s.id === selectedService);
    const supply = supplies.find(s => s.id === selectedSupply);

    createMutation.mutate({
      service_id: selectedService,
      service_name: service?.name || '',
      supply_id: selectedSupply,
      supply_name: supply?.name || '',
      quantity_per_service: quantity,
    });
  };

  const activeServices = services.filter(s => s.active !== false);
  const activeSupplies = supplies.filter(s => s.active !== false);
  const currentServiceSupplies = existingServiceSupplies.filter(ss => ss.service_id === selectedService);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Consumo por Serviço</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Serviço</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {activeServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <>
              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <h4 className="font-medium text-slate-800">Insumos configurados</h4>
                {currentServiceSupplies.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum insumo configurado para este serviço</p>
                ) : (
                  <div className="space-y-2">
                    {currentServiceSupplies.map((ss) => (
                      <div key={ss.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm">
                          {ss.supply_name}: <strong>{ss.quantity_per_service}</strong> por serviço
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => deleteMutation.mutate(ss.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-3">Adicionar insumo</h4>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <Select value={selectedSupply} onValueChange={setSelectedSupply}>
                      <SelectTrigger>
                        <SelectValue placeholder="Insumo" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSupplies.map((supply) => (
                          <SelectItem key={supply.id} value={supply.id}>
                            {supply.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Qtd"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    onClick={handleAdd}
                    disabled={createMutation.isPending || !selectedSupply || quantity <= 0}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}