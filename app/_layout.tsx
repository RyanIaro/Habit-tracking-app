import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    const isAuthGroup = segments[0] === "auth";
    if (!user && !isAuthGroup && !isLoadingUser) {
      router.replace('/auth');
    } else if (user && isAuthGroup && !isLoadingUser) {
      router.replace('/')
    }
  }, [user, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <>
      <GestureHandlerRootView>
        <AuthProvider>
          <PaperProvider>
            <SafeAreaProvider>
              <RouteGuard>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
              </RouteGuard>
            </SafeAreaProvider>
          </PaperProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </>
  );
}
