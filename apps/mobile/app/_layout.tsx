/**
 * Root layout. Hosts every app-wide provider (TanStack Query, gesture
 * handler) and mounts a single Stack navigator. Individual screen groups
 * (onboarding/, (app)/) register their own stacks below.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";
import "../src/i18n";

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAF6EE" },
              animation: "fade",
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
