import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function SupplyFormModal({ open, onClose, onSave, supply, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'litro',
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    category: 'limpeza',
    active: true,
  });

  useEffect(() => {
    if (supply) {
      setFormData({
        name: supply.name || '',
        unit: supply.unit || 'litro',
        current_stock: supply.current_stock || 0,
        minimum_stock: supply.minimum_stock || 0,
        cost_per_unit: supply.cost_per_unit || 0,
        category: supply.category || 'limpeza',
        active: supply.active !== false,
      });
    } else {
      setFormData({
        name: '',
        unit: 'litro',
        current_stock: 0,
        minimum_stock: 0,
        cost_per_unit: 0,
        category: 'limpeza',
        active: true,
      });
    }
  }, [supply, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{supply ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do Insumo</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Shampoo Automotivo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unidade</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="litro">Litro (L)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="kg">Quilograma (kg)</SelectItem>
                  <SelectItem value="g">Grama (g)</SelectItem>
                  <SelectItem value="unidade">Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                  <SelectItem value="polimento">Polimento</SelectItem>
                  <SelectItem value="higienizacao">Higienização</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estoque Atual</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Custo por Unidade (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-600">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {supply ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}