/**
 * Smoke: Landing renders without crashing and shows the brand + CTA.
 * Heavier UI tests are intentionally skipped for MVP (see
 * docs/CTO-KICKOFF.md — "UI tests: skip for MVP").
 */
import { render } from "@testing-library/react-native";
import React from "react";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  Stack: () => null,
  useLocalSearchParams: () => ({}),
}));

jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "fr" }],
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-constants", () => ({
  default: { expoConfig: { extra: {} } },
}));

jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import Landing from "../app/index";

describe("Landing", () => {
  it("renders the brand, headline, and CTA", () => {
    const { getByText } = render(<Landing />);
    expect(getByText("lueur")).toBeTruthy();
    expect(getByText("Une app qui apprend ton goût.")).toBeTruthy();
    expect(getByText("Commencer")).toBeTruthy();
  });
});
