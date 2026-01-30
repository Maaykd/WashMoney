import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, Building2, Clock, Gift, Bell, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    businessName: 'Meu Lava Jato',
    openingTime: '08:00',
    closingTime: '18:00',
    loyaltyEnabled: true,
    loyaltyPointsPerVisit: 1,
    loyaltyRewardThreshold: 10,
    loyaltyDiscountPercent: 10,
    notificationsEnabled: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const user = await base44.auth.me();
      if (user?.app_settings) {
        setSettings(prev => ({ ...prev, ...user.app_settings }));
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await base44.auth.updateMe({ app_settings: settings });
    setLoading(false);
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 mt-1">Personalize seu sistema</p>
      </div>

      <div className="space-y-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <CardTitle>Informações do Negócio</CardTitle>
                <CardDescription>Dados básicos do seu lava jato</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome do Estabelecimento</Label>
              <Input
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                placeholder="Meu Lava Jato"
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Horário de Funcionamento</CardTitle>
                <CardDescription>Defina os horários disponíveis para agendamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Abertura</Label>
                <Input
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Fechamento</Label>
                <Input
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Program */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Programa de Fidelidade</CardTitle>
                <CardDescription>Configure recompensas para clientes frequentes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Ativar Programa de Fidelidade</p>
                <p className="text-sm text-slate-500">Clientes acumulam pontos a cada visita</p>
              </div>
              <Switch
                checked={settings.loyaltyEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, loyaltyEnabled: checked })}
              />
            </div>
            
            {settings.loyaltyEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <Label>Pontos por Visita</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.loyaltyPointsPerVisit}
                    onChange={(e) => setSettings({ ...settings, loyaltyPointsPerVisit: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Pontos para Recompensa</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.loyaltyRewardThreshold}
                    onChange={(e) => setSettings({ ...settings, loyaltyRewardThreshold: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.loyaltyDiscountPercent}
                    onChange={(e) => setSettings({ ...settings, loyaltyDiscountPercent: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure alertas do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Notificações do Sistema</p>
                <p className="text-sm text-slate-500">Receba alertas de novos agendamentos e serviços</p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}