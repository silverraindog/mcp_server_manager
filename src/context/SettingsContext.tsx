import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  cpuThreshold: number; // percentage, e.g. 75
  memoryThreshold: number; // percentage, e.g. 75
  alertOnExceed: boolean;
  autoRefreshIntervalSeconds: number;
  autoScaleEnabled: boolean;
  autoScaleMaxMemoryBoost: number; // percentage boost, e.g. 50
  autoScaleCooldownSeconds: number;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  cpuThreshold: 75,
  memoryThreshold: 75,
  alertOnExceed: true,
  autoRefreshIntervalSeconds: 5,
  autoScaleEnabled: true,
  autoScaleMaxMemoryBoost: 50,
  autoScaleCooldownSeconds: 15,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mcp_app_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('mcp_app_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
