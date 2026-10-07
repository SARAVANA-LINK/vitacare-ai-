import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);

      // Requirement 4: Set saved user language
      if (data.user && data.user.preferredLanguage) {
        localStorage.setItem('vitacare_lang', data.user.preferredLanguage);
      }
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err.message);
      api.setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    api.setToken(res.token);
    setUser(res.user);
    if (res.user && res.user.preferredLanguage) {
      localStorage.setItem('vitacare_lang', res.user.preferredLanguage);
    }
    await fetchCurrentUser();
    return res;
  };

  const adminLogin = async (email, password) => {
    const res = await api.adminLogin({ email, password });
    api.setToken(res.token);
    setUser(res.user);
    await fetchCurrentUser();
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    api.setToken(res.token);
    setUser(res.user);
    await fetchCurrentUser();
    return res;
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    api.setToken(res.token);
    setUser(res.user);
    await fetchCurrentUser();
    return res;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        adminLogin,
        register,
        demoLogin,
        logout,
        refreshUser: fetchCurrentUser
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
