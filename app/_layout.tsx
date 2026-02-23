import { useInternetStatus } from "@/hooks/use-internet-status";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();
  const isOnline = useInternetStatus();
  const [retryKey, setRetryKey] = useState<number>(0);
  const wasOffline = useRef(false);

  useEffect(() => {
    if(!isOnline) {
      wasOffline.current = true;
      return;
    }

    if(isOnline && wasOffline.current) {
      wasOffline.current = false;
      setRetryKey(prev => prev++);
    }

    const isAuthGroup = segments[0] === "auth";
    if (!user && !isAuthGroup && !isLoadingUser) {
      router.replace('/auth');
    } else if (user && isAuthGroup && !isLoadingUser) {
      router.replace('/')
    }
  }, [user, segments, isOnline]);

  const handleReload = () => {
    setRetryKey(prev => prev++);
  }

  return (
    <>
      {!isOnline ? 
        <View style={styles.overlay}>
          <MaterialIcons
          name="wifi-off"
          size={64}
          color="#8760be"
          />
          <Text style={styles.noInternetText}>
            {"No internet connection. Please connect your device to internet."}
          </Text>
          {/* <Button
          mode="outlined"
          style={styles.retryButton}
          onPress={handleReload}
          >
            {"Retry"}
          </Button> */}
        </View>
      :
        <>
          {children}
        </>
      }
    </>
  );
}

export default function RootLayout() {
  return (
    <>
      <GestureHandlerRootView>
        <AuthProvider>
          {/* <PaperProvider> */}
            <SafeAreaProvider>
              <RouteGuard>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
              </RouteGuard>
            </SafeAreaProvider>
          {/* </PaperProvider> */}
        </AuthProvider>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 32,
    marginHorizontal: 24,
  },
  noInternetText: {
    fontSize: 20,
    marginBottom: 12,
  },
  retryButton: {
    borderColor: "#8760be",
    borderWidth: 2,
    borderRadius: 50,
  },
});