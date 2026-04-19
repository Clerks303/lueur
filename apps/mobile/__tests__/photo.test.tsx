/**
 * Screen 2 smoke: the instruction + accent lines render, the gallery
 * secondary link is present, and the shutter button advertises its
 * accessibility label. Camera permission is granted in the mock so the
 * viewfinder branch is rendered.
 */
import { render } from "@testing-library/react-native";
import React from "react";

jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [
    { granted: true, canAskAgain: true },
    jest.fn().mockResolvedValue({ granted: true }),
  ],
  CameraView: () => null,
}));

jest.mock("expo-file-system/legacy", () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { BINARY_CONTENT: "binary" },
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("expo-linking", () => ({ openSettings: jest.fn() }));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
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

import OnboardingPhoto from "../app/onboarding/photo";

describe("Screen 2 — Photo capture", () => {
  it("renders the instruction, accent line, shutter button, and gallery link", () => {
    const { getByText, getByLabelText } = render(<OnboardingPhoto />);
    expect(getByText("Prends une photo d'un endroit chez toi")).toBeTruthy();
    expect(getByText("que tu aimes.")).toBeTruthy();
    expect(getByText("ou choisir dans la galerie")).toBeTruthy();
    expect(getByLabelText("Prendre la photo")).toBeTruthy();
  });
});
