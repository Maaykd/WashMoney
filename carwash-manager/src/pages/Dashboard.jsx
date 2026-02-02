import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { company, signOut } = useAuth();
  
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Bem-vindo à {company.name}</h1>
        <button onClick={signOut}>Sair</button>
      </div>
      <p>Role: {company.role} | Company ID: {company.id}</p>
      <div>Próximos passos: ServiceOrders, Clients, etc.</div>
    </div>
  );
}
