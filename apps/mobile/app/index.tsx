/**
 * Screen 1 — Landing.
 * Per docs/03-DESIGN-SYSTEM.md §Screen 1.
 *
 * Tap on `Commencer` triggers:
 *   1. Camera permission request (so we can go straight to Screen 2)
 *   2. POST /auth/sign-in/anonymous — stores the session cookie
 *   3. Navigate to /onboarding/photo
 *
 * If anything fails, we surface a short, editorial error inline and keep
 * the user on this screen. No modals, no stack traces.
 */
import { useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { signInAnonymous } from "@/api/client";
import { t } from "@/i18n";

export default function Landing() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const onStart = useCallback(async () => {
    setErrorKey(null);
    setBusy(true);
    try {
      const granted = permission?.granted
        ? true
        : (await requestPermission()).granted;
      if (!granted) {
        Alert.alert("Permission caméra", t("errors.permissionDenied"));
        setBusy(false);
        return;
      }
      await signInAnonymous();
      router.replace("/onboarding/photo");
    } catch (err) {
      setErrorKey(
        err instanceof Error && err.message.includes("Network")
          ? "errors.networkFailed"
          : "errors.networkFailed",
      );
    } finally {
      setBusy(false);
    }
  }, [permission, requestPermission]);

  return (
    <View
      className="flex-1 bg-bg-app px-8"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
      accessibilityLabel="Écran d'accueil Lueur"
    >
      <View className="flex-1 items-center justify-center">
        <Text className="font-serif italic text-accent-primary text-base mb-12">
          {t("app.brand")}
        </Text>
        <Text
          className="font-serif text-text-primary text-[28px] text-center leading-snug"
          accessibilityRole="header"
        >
          {t("landing.headline")}
        </Text>
        <Text className="font-serif italic text-text-secondary text-lg text-center mt-3">
          {t("landing.sub")}
        </Text>
      </View>

      {errorKey && (
        <Text className="font-sans text-accent-primary text-center mb-3">
          {t(errorKey)}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("landing.cta")}
        onPress={onStart}
        disabled={busy}
        className="bg-text-primary rounded-full py-4 items-center active:opacity-80"
      >
        {busy ? (
          <ActivityIndicator color="#FAF6EE" />
        ) : (
          <Text className="text-bg-app text-base font-sans">
            {t("landing.cta")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
