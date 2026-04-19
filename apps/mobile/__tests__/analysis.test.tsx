/**
 * Screen 3 smoke paths:
 *   - pending: Shimmer skeleton renders, no CTAs.
 *   - done: typewriter starts producing characters from observation_lines
 *     and both CTAs appear.
 *   - failed: editorial error + "Essayer avec une autre photo" CTA.
 */
import {
  act,
  render,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

jest.mock("@/api/client", () => ({
  fetchPhoto: jest.fn(),
  postEvent: jest.fn().mockResolvedValue(undefined),
}));

import * as apiClient from "@/api/client";

const fetchPhotoMock = apiClient.fetchPhoto as unknown as jest.Mock;

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: "abc" }),
}));

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "fr" }],
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-constants", () => ({ default: { expoConfig: { extra: {} } } }));

jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import OnboardingAnalysis from "../app/onboarding/analysis/[id]";

const SAMPLE_ANALYSIS = {
  structured: {
    palette: {
      observed_colors: ["ocres poussiéreux"],
      temperature: "warm",
      saturation: "muted",
    },
    materials: { observed: ["lin brut"], absent_notable: [] },
    forms: { dominant: ["lignes droites"], ornamentation: "minimal" },
    references: ["japandi"],
    anti_patterns_detected: [],
    confidence_overall: 0.85,
    domain: "interior",
  },
  narrative: {
    observation_lines: ["Lumière douce.", "Palette ocres."],
    synthesis: "Tu privilégies le toucher.",
  },
};

describe("Screen 3 — Analysis", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchPhotoMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the leader line while analysis_status=queued", async () => {
    fetchPhotoMock.mockResolvedValue({
      id: "abc",
      user_id: "u",
      storage_key: "k",
      domain: null,
      analysis: null,
      analysis_status: "queued",
      created_at: "2026-04-25T12:00:00Z",
    });
    const screen = render(<OnboardingAnalysis />);
    await waitFor(() => expect(fetchPhotoMock).toHaveBeenCalled());
    expect(screen.getByText("Je regarde…")).toBeTruthy();
  });

  it("renders the typewriter and both CTAs when analysis_status=done", async () => {
    fetchPhotoMock.mockResolvedValue({
      id: "abc",
      user_id: "u",
      storage_key: "k",
      domain: "interior",
      analysis: SAMPLE_ANALYSIS,
      analysis_status: "done",
      created_at: "2026-04-25T12:00:00Z",
    });
    const screen = render(<OnboardingAnalysis />);
    await waitFor(() => expect(fetchPhotoMock).toHaveBeenCalled());
    // Advance timers so the typewriter produces at least a few chars.
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByLabelText("Oui, c'est moi")).toBeTruthy();
    expect(screen.getByLabelText("Corrige")).toBeTruthy();
  });

  it("shows the failure copy and retry CTA when analysis_status=failed", async () => {
    fetchPhotoMock.mockResolvedValue({
      id: "abc",
      user_id: "u",
      storage_key: "k",
      domain: null,
      analysis: null,
      analysis_status: "failed",
      created_at: "2026-04-25T12:00:00Z",
    });
    const screen = render(<OnboardingAnalysis />);
    await waitFor(() => expect(fetchPhotoMock).toHaveBeenCalled());
    expect(
      screen.getByText("Je n'ai pas réussi à analyser cette photo."),
    ).toBeTruthy();
    expect(screen.getByLabelText("Essayer avec une autre photo")).toBeTruthy();
  });
});
