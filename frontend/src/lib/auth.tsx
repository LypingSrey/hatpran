import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from './api';
import { deleteItem, getItem, setItem } from './storage';
import type { AuthResponse, User } from './types';

const TOKEN_KEY = 'hatpran.token';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await deleteItem(TOKEN_KEY);
  }, []);

  // Restore a saved session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());

    (async () => {
      const token = await getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          setUser(await api.me());
        } catch {
          await clearSession();
        }
      }
      setIsLoading(false);
    })();

    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const startSession = useCallback(async ({ user, token }: AuthResponse) => {
    setAuthToken(token);
    await setItem(TOKEN_KEY, token);
    setUser(user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn: async (email, password) => startSession(await api.login({ email, password })),
      signUp: async (name, email, password, password_confirmation) =>
        startSession(await api.register({ name, email, password, password_confirmation })),
      signOut: async () => {
        try {
          await api.logout();
        } catch {
          // Token may already be invalid; clear locally regardless.
        }
        await clearSession();
      },
    }),
    [user, isLoading, startSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
