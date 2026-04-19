/**
 * Screen 3 — Analysis (polling + typewriter + correction).
 * Per docs/03-DESIGN-SYSTEM.md §Screen 3.
 *
 *   - Polls GET /photos/:id every 800 ms until analysis_status ∈ {done,failed}.
 *   - While pending: italic "Je regarde…" + shimmer skeleton.
 *   - Soft timeout 30 s: swap the leader line for a reassuring one.
 *   - Hard timeout 90 s: swap to a retry CTA that takes the user back to
 *     Screen 2.
 *   - On done: typewriter the observation_lines, then fade in the synthesis
 *     in italic serif 500 ms later. Haptic success when synthesis lands.
 *   - On failed: short, editorial error + "Essayer avec une autre photo".
 *   - CTAs: "Oui, c'est moi" → advance. "Corrige" → bottom-sheet textarea
 *     that POSTs an `event_type=correction` and then advances.
 */
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { InteriorAnalysis } from "@lueur/prompts";

import {
  fetchPhoto,
  postEvent,
  type PhotoRow,
  type PhotoStatus,
} from "@/api/client";
import { CorrectionModal } from "@/components/CorrectionModal";
import { Shimmer } from "@/components/Shimmer";
import { Typewriter } from "@/components/Typewriter";
import { t } from "@/i18n";

const POLL_MS = 800;
const SOFT_TIMEOUT_MS = 30_000;
const HARD_TIMEOUT_MS = 90_000;

export default function OnboardingAnalysis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [photo, setPhoto] = useState<PhotoRow | null>(null);
  const [status, setStatus] = useState<PhotoStatus>("pending");
  const [elapsed, setElapsed] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Polling loop.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let startedAt = Date.now();

    const tick = async (): Promise<void> => {
      if (cancelled) return;
      try {
        const row = await fetchPhoto(id);
        if (cancelled) return;
        setPhoto(row);
        setStatus(row.analysis_status);
        setElapsed(Date.now() - startedAt);
        if (row.analysis_status === "done" || row.analysis_status === "failed") {
          return;
        }
      } catch {
        // swallow transient errors; the next tick retries
      }
      if (Date.now() - startedAt >= HARD_TIMEOUT_MS) return;
      setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Haptic success right after the typewriter finishes.
  useEffect(() => {
    if (typewriterDone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
  }, [typewriterDone]);

  const hardTimeout = elapsed >= HARD_TIMEOUT_MS && status !== "done" && status !== "failed";
  const analysis = (photo?.analysis ?? null) as InteriorAnalysis | null;

  const onAcknowledge = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
    router.replace("/onboarding/duel");
  }, []);

  const onSubmitCorrection = useCallback(
    async (text: string) => {
      if (!id) return;
      setSubmittingCorrection(true);
      try {
        await postEvent("correction", {
          photo_id: id,
          correction_text: text,
        });
        setCorrectionOpen(false);
        setToast(t("onboarding.analysis.correctionSubmitted"));
        setTimeout(() => router.replace("/onboarding/duel"), 700);
      } catch {
        setToast(t("errors.networkFailed"));
      } finally {
        setSubmittingCorrection(false);
      }
    },
    [id],
  );

  const onRetry = useCallback(() => {
    router.replace("/onboarding/photo");
  }, []);

  // --- UI branches ---------------------------------------------------------

  if (status === "failed") {
    return (
      <FailedState insets={insets} onRetry={onRetry} />
    );
  }

  if (hardTimeout) {
    return (
      <View
        className="flex-1 bg-bg-app items-center justify-center px-8"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <Text className="font-serif italic text-text-primary text-lg text-center mb-6">
          {t("onboarding.analysis.slow")}
        </Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="bg-text-primary rounded-full px-8 py-4 active:opacity-80"
        >
          <Text className="text-bg-app font-sans">
            {t("onboarding.analysis.timeoutAgain")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const loading = status !== "done";

  return (
    <View
      className="flex-1 bg-bg-app px-6"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
      accessibilityLabel="Écran d'analyse"
    >
      <View className="items-center">
        <View className="w-32 h-32 rounded-2xl bg-bg-muted" />
      </View>

      <Text className="font-serif italic text-accent-primary text-center text-lg mt-6 mb-4">
        {elapsed >= SOFT_TIMEOUT_MS && loading
          ? t("onboarding.analysis.slow")
          : t("onboarding.analysis.leader")}
      </Text>

      <View className="flex-1 justify-start">
        {loading ? (
          <Shimmer />
        ) : analysis ? (
          <Typewriter
            lines={analysis.narrative.observation_lines}
            onComplete={() => setTypewriterDone(true)}
          />
        ) : null}

        {typewriterDone && analysis && (
          <Text className="font-serif italic text-text-secondary text-base leading-6 mt-6">
            {analysis.narrative.synthesis}
          </Text>
        )}
      </View>

      {toast && (
        <Text className="font-sans italic text-text-secondary text-center mb-3">
          {toast}
        </Text>
      )}

      {status === "done" ? (
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setCorrectionOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.analysis.correct")}
            className="flex-1 items-center justify-center rounded-full border border-text-primary py-4 active:opacity-80"
          >
            <Text className="font-sans text-text-primary">
              {t("onboarding.analysis.correct")}
            </Text>
          </Pressable>
          <Pressable
            onPress={onAcknowledge}
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.analysis.yes")}
            className="flex-1 items-center justify-center rounded-full bg-text-primary py-4 active:opacity-80"
          >
            <Text className="font-sans text-bg-app">
              {t("onboarding.analysis.yes")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="items-center h-14 justify-center">
          <ActivityIndicator color="#8B847A" />
        </View>
      )}

      <CorrectionModal
        visible={correctionOpen}
        submitting={submittingCorrection}
        onCancel={() => setCorrectionOpen(false)}
        onSubmit={onSubmitCorrection}
      />
    </View>
  );
}

function FailedState({
  insets,
  onRetry,
}: {
  insets: { top: number; bottom: number };
  onRetry: () => void;
}) {
  return (
    <View
      className="flex-1 bg-bg-app items-center justify-center px-8"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="font-serif italic text-text-primary text-lg text-center mb-6">
        {t("onboarding.analysis.hardFailed")}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t("onboarding.analysis.tryAnother")}
        className="bg-text-primary rounded-full px-8 py-4 active:opacity-80"
      >
        <Text className="text-bg-app font-sans">
          {t("onboarding.analysis.tryAnother")}
        </Text>
      </Pressable>
    </View>
  );
}
