import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { parseAppearance, resolveScheme, type AppearancePreference } from './appearance';
import { getItem, setItem } from './storage';

const APPEARANCE_KEY = 'hatpran.appearance';

interface AppearanceValue {
  /** What the user picked in Profile. */
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
  /** What to draw with right now. */
  scheme: 'light' | 'dark';
  /** False until the saved choice has been read, so the first frame doesn't flash the wrong theme. */
  ready: boolean;
}

export const AppearanceContext = createContext<AppearanceValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getItem(APPEARANCE_KEY).then((raw) => {
      setPreferenceState(parseAppearance(raw));
      setReady(true);
    });
  }, []);

  // On phones, also switch the native layer (keyboard, alerts, pickers) so they match the app.
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    void setItem(APPEARANCE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference, scheme: resolveScheme(preference, system), ready }),
    [preference, setPreference, system, ready],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceValue {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return context;
}
