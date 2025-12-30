import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface HeaderConfig {
  title?: string;
  hide?: 'rivalries' | 'pending' | 'profile' | 'how-to-play';
  showHeader?: boolean;
}

interface HeaderContextValue {
  config: HeaderConfig;
  setConfig: (config: HeaderConfig) => void;
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({
    title: 'Rivalry Club',
    showHeader: true,
  });

  return (
    <HeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeaderConfig() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeaderConfig must be used within a HeaderProvider');
  }
  return context.config;
}

export function useSetHeader(config: HeaderConfig) {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useSetHeader must be used within a HeaderProvider');
  }

  // Set the header config when the component mounts or config changes
  // Use useEffect to avoid updating state during render
  useEffect(() => {
    context.setConfig(config);
  }, [JSON.stringify(config)]);
}
