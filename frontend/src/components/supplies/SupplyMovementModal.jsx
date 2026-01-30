import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function SupplyMovementModal({ open, onClose, supply, supplies }) {
  const [formData, setFormData] = useState({
    supply_id: '',
    type: 'entrada',
    quantity: 0,
    reason: 'compra',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (supply) {
      setFormData(prev => ({
        ...prev,
        supply_id: supply.id,
      }));
    } else {
      setFormData({
        supply_id: '',
        type: 'entrada',
        quantity: 0,
        reason: 'compra',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [supply, open]);

  const createMovementMutation = useMutation({
    mutationFn: async (data) => {
      // Create movement record
      const selectedSupply = supplies.find(s => s.id === data.supply_id);
      await base44.entities.SupplyMovement.create({
        ...data,
        supply_name: selectedSupply?.name || '',
      });

      // Update supply stock
      if (selectedSupply) {
        const newStock = data.type === 'entrada'
          ? selectedSupply.current_stock + data.quantity
          : selectedSupply.current_stock - data.quantity;

        await base44.entities.Supply.update(selectedSupply.id, {
          current_stock: Math.max(0, newStock),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      queryClient.invalidateQueries({ queryKey: ['supplyMovements'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMovementMutation.mutate(formData);
  };

  const selectedSupply = supplies.find(s => s.id === formData.supply_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Insumo</Label>
            <Select
              value={formData.supply_id}
              onValueChange={(value) => setFormData({ ...formData, supply_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o insumo" />
              </SelectTrigger>
              <SelectContent>
                {supplies.filter(s => s.active !== false).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (Estoque: {s.current_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  const reason = value === 'entrada' ? 'compra' : 'consumo_servico';
                  setFormData({ ...formData, type: value, reason });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Motivo</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formData.type === 'entrada' && (
                  <SelectItem value="compra">Compra</SelectItem>
                )}
                {formData.type === 'saida' && (
                  <>
                    <SelectItem value="consumo_servico">Consumo em Serviço</SelectItem>
                    <SelectItem value="desperdicio">Desperdício</SelectItem>
                    <SelectItem value="vencido">Produto Vencido</SelectItem>
                  </>
                )}
                <SelectItem value="ajuste_inventario">Ajuste de Inventário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a movimentação..."
              rows={2}
            />
          </div>

          {selectedSupply && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-slate-600">
                Estoque atual: <span className="font-semibold">{selectedSupply.current_stock}</span>
              </p>
              <p className="text-slate-600">
                Novo estoque: <span className="font-semibold">
                  {formData.type === 'entrada'
                    ? selectedSupply.current_stock + formData.quantity
                    : Math.max(0, selectedSupply.current_stock - formData.quantity)}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMovementMutation.isPending || !formData.supply_id}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {createMovementMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}