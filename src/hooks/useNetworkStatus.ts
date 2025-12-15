import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Global flag shared across all components to prevent multiple modals
let globalHasShownOfflineModal = false;

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [hasShownOfflineModal, setHasShownOfflineModal] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      // Reset the global flag when connection is restored
      if (connected) {
        globalHasShownOfflineModal = false;
        setHasShownOfflineModal(false);
      }
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Custom setter that updates both local and global state
  const setGlobalHasShownOfflineModal = (value: boolean) => {
    globalHasShownOfflineModal = value;
    setHasShownOfflineModal(value);
  };

  return {
    isConnected,
    hasShownOfflineModal: globalHasShownOfflineModal,
    setHasShownOfflineModal: setGlobalHasShownOfflineModal,
  };
}
