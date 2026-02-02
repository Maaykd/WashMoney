import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabase';
import { useNavigate } from 'react-router-dom';

export default function CompanyOnboarding() {
  const { user, refetchCompany } = useAuth();
  const [step, setStep] = useState('create'); // 'create' | 'join' | 'success'
  const [companyName, setCompanyName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const accessCode = generateAccessCode();
      
      // 1) Criar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName, access_code: accessCode })
        .select()
        .single();
      
      if (companyError) throw companyError;

      // 2) Vincular usuário como admin
      const { error: ucError } = await supabase
        .from('user_companies')
        .insert({ 
          user_id: user.id, 
          company_id: company.id, 
          role: 'admin' 
        });

      if (ucError) throw ucError;

      alert(`Empresa "${companyName}" criada! Access code: ${accessCode}`);
      refetchCompany();
      navigate('/dashboard');
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const joinCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1) Buscar empresa pelo access_code
      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('access_code', accessCode)
        .single();

      if (!company) throw new Error('Access code inválido');

      // 2) Vincular usuário
      const { error } = await supabase
        .from('user_companies')
        .insert({ 
          user_id: user.id, 
          company_id: company.id, 
          role: 'funcionario' 
        });

      if (error) throw error;

      alert(`Bem-vindo à "${company.name}"!`);
      refetchCompany();
      navigate('/dashboard');
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return <div>Sucesso! Redirecionando...</div>;
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h1>Configurar Empresa</h1>
      <p>Escolha uma opção:</p>
      
      <div style={{ display: 'flex', gap: 12, margin: '24px 0' }}>
        <button 
          onClick={() => setStep('create')} 
          style={{ flex: 1, padding: 12, ...(step === 'create' ? { background: '#3b82f6', color: 'white' } : {}) }}
        >
          Criar Nova Empresa
        </button>
        <button 
          onClick={() => setStep('join')} 
          style={{ flex: 1, padding: 12, ...(step === 'join' ? { background: '#3b82f6', color: 'white' } : {}) }}
        >
          Entrar em Empresa
        </button>
      </div>

      {step === 'create' && (
        <form onSubmit={createCompany} style={{ display: 'grid', gap: 12 }}>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nome da empresa (ex: Lava-Jato DF Norte)"
            style={{ padding: 12, border: '1px solid #ddd', borderRadius: 4 }}
            required
          />
          <button disabled={loading} style={{ padding: 12 }}>
            {loading ? 'Criando...' : 'Criar Empresa'}
          </button>
        </form>
      )}

      {step === 'join' && (
        <form onSubmit={joinCompany} style={{ display: 'grid', gap: 12 }}>
          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX (6 caracteres)"
            maxLength={6}
            style={{ padding: 12, border: '1px solid #ddd', borderRadius: 4, textTransform: 'uppercase' }}
            required
          />
          <button disabled={loading} style={{ padding: 12 }}>
            {loading ? 'Entrando...' : 'Entrar na Empresa'}
          </button>
        </form>
      )}
    </div>
  );
}
