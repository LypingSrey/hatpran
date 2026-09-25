import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from './api';
import { restoreSession } from './session';
import { deleteItem, getItem, setItem } from './storage';
import type { AuthResponse, User } from './types';
import { errorMessage } from './useApi';

const TOKEN_KEY = 'hatpran.token';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /** Set when a saved sign-in couldn't be checked (e.g. no signal). The sign-in is kept for a retry. */
  restoreError: string | null;
  retryRestore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Replace the signed-in user after a profile edit. */
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setRestoreError(null);
    await deleteItem(TOKEN_KEY);
  }, []);

  const restore = useCallback(async (token: string | null) => {
    setAuthToken(token);
    const result = await restoreSession(token, api.me);
    if (result.status === 'signed-in') setUser(result.user);
    else if (result.status === 'unreachable') setRestoreError(errorMessage(result.error));
    else if (token) await clearSession();
    setIsLoading(false);
  }, [clearSession]);

  const retryRestore = useCallback(async () => {
    setIsLoading(true);
    setRestoreError(null);
    await restore(await getItem(TOKEN_KEY));
  }, [restore]);

  // Restore a saved session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    void getItem(TOKEN_KEY).then(restore);
    return () => setUnauthorizedHandler(null);
  }, [clearSession, restore]);

  const startSession = useCallback(async ({ user, token }: AuthResponse) => {
    setAuthToken(token);
    await setItem(TOKEN_KEY, token);
    setUser(user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      restoreError,
      retryRestore,
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
      updateUser: setUser,
    }),
    [user, isLoading, restoreError, retryRestore, startSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
