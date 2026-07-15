import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

function parseGroups(session) {
  const payload = session?.tokens?.idToken?.payload;
  const groups = payload?.['cognito:groups'] || [];
  return Array.isArray(groups) ? groups : [];
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      const session = await fetchAuthSession();
      setUser({
        username: current.username,
        name: session.tokens?.idToken?.payload?.name,
        email: session.tokens?.idToken?.payload?.email,
      });
      setGroups(parseGroups(session));
    } catch (err) {
      setUser(null);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    await signIn({ username: email, password });
    await refresh();
  };

  const register = async (email, password, name) => {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    });
  };

  const confirmRegistration = async (email, code) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setGroups([]);
  };

  const isAdmin = groups.includes('Admin');
  const isSecurity = groups.includes('Security') || isAdmin;

  const value = {
    user,
    groups,
    loading,
    isAdmin,
    isSecurity,
    login,
    register,
    confirmRegistration,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
