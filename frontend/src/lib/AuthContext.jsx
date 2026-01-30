import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // manda/recebe cookies
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mantive para não quebrar o App.jsx (ele usa os dois loaders) [cite:37]
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);

  const [authError, setAuthError] = useState(null);

  // Mantive para compatibilidade com o que existia antes [cite:36]
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);

      // Não existe mais "public settings" Base44; deixamos como false por compatibilidade [cite:36]
      setIsLoadingPublicSettings(false);

      setIsLoadingAuth(true);

      const { data } = await api.get('/auth/me');

      setUser(data?.user ?? null);
      setTenant(data?.tenant ?? null);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);

      // Axios: status vem em error.response.status
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      } else {
        setAuthError({
          type: 'unknown',
          message: error?.message || 'Failed to load auth state',
        });
      }
    }
  };

  // Mantive o nome pra não quebrar chamadas existentes [cite:36]
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignora erro de logout (ex: já deslogado)
    } finally {
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    }
  };

  // No modelo novo, login é rota interna (a gente faz no próximo passo) [cite:37]
  const navigateToLogin = () => {
    setAuthError({ type: 'auth_required', message: 'Authentication required' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,

        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,

        authError,
        appPublicSettings,

        logout,
        navigateToLogin,
        checkAppState,

        // helper pro futuro formulário de login
        login: async (email, password) => {
          const { data } = await api.post('/auth/login', { email, password });
          // após login, atualiza estado com /me
          await checkAppState();
          return data;
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
