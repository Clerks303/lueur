/**
 * Jest runtime setup — mock native modules that can't run in Node.
 * Reanimated + Worklets need a native runtime; their official mock is the
 * canonical way to run component tests under Jest.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock("react-native-reanimated", () => {
  try {
    // Reanimated ships its own Jest-friendly mock.
    return require("react-native-reanimated/mock");
  } catch {
    return {
      default: {},
      useSharedValue: (v) => ({ value: v }),
      useAnimatedStyle: (fn) => fn(),
      withRepeat: (v) => v,
      withTiming: (v) => v,
      Easing: { inOut: (fn) => fn, ease: (v) => v },
      View: "Animated.View",
    };
  }
});
