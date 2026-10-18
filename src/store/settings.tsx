import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setHapticsEnabled } from '@/lib/haptics';

const STORAGE_KEY = 'findmybin.settings.v1';

export type Settings = {
  hapticsEnabled: boolean;
  onboarded: boolean;
};

const DEFAULT_SETTINGS: Settings = { hapticsEnabled: true, onboarded: false };

type SettingsContextValue = {
  ready: boolean;
  settings: Settings;
  updateSettings: (changes: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      })
      .catch((error) => console.warn('Could not load settings', error))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    setHapticsEnabled(settings.hapticsEnabled);
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((error) =>
      console.warn('Could not save settings', error),
    );
  }, [ready, settings]);

  const updateSettings = useCallback((changes: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...changes }));
  }, []);

  const value = useMemo(() => ({ ready, settings, updateSettings }), [ready, settings, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
