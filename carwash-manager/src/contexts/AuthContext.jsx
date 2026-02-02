import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null); // { id, name, role }

  useEffect(() => {
    // Monitora auth state
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Pega user atual
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Carrega empresa do usuário (após login)
  useEffect(() => {
    if (user) {
      loadUserCompany();
    } else {
      setCompany(null);
    }
  }, [user]);

  const loadUserCompany = async () => {
    const { data, error } = await supabase
      .from('user_companies')
      .select('*, companies(name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (data) {
      setCompany({
        id: data.company_id,
        name: data.companies.name,
        role: data.role
      });
    }
  };

  const value = {
    user,
    company,
    loading,
    signOut: () => supabase.auth.signOut(),
    refetchCompany: loadUserCompany
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider');
  return context;
};
