// hooks/useNetworkStatus.js
import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export const useNetworkStatus = () => {
   const [isConnected, setIsConnected] = useState(true);
   const [isChecking, setIsChecking] = useState(true);

   useEffect(() => {
      const unsubscribe = NetInfo.addEventListener((state) => {
         setIsConnected(state.isConnected ?? true);
         setIsChecking(false);
      });

      // Initial check
      NetInfo.fetch().then((state) => {
         setIsConnected(state.isConnected ?? true);
         setIsChecking(false);
      });

      return () => unsubscribe();
   }, []);

   return { isConnected, isChecking };
};
