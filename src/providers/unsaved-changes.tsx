import { createContext, useContext, useState, type ReactNode } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  checkUnsavedChanges: () => Promise<boolean>; // Returns true if navigation should proceed
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const checkUnsavedChanges = async (): Promise<boolean> => {
    // If no unsaved changes, allow navigation
    if (!hasUnsavedChanges) {
      return true;
    }

    // If there are unsaved changes, return false
    // The caller will handle showing the alert
    return false;
  };

  return (
    <UnsavedChangesContext.Provider
      value={{ hasUnsavedChanges, setHasUnsavedChanges, checkUnsavedChanges }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
}
