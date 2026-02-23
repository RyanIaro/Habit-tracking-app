import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useInternetStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(
      state => setIsOnline(state.isInternetReachable ?? false)
    );

    return () => unsubscribe();
  }, []);

  return isOnline;
}