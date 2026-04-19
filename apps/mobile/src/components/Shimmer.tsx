/**
 * Skeleton shimmer while the photo analysis is running. Three stacked bars
 * of decreasing width, all pulsing opacity between 0.35 and 0.85 at 1.2 s.
 * Intentionally slow and calm — the vibe is "I'm looking", not "loading".
 */
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const BARS = [
  { w: "90%" as const, h: 14 },
  { w: "75%" as const, h: 14 },
  { w: "82%" as const, h: 14 },
  { w: "60%" as const, h: 14 },
];

export function Shimmer() {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className="gap-3 py-2" accessibilityElementsHidden>
      {BARS.map((bar, i) => (
        <Animated.View
          key={i}
          style={[{ width: bar.w, height: bar.h, borderRadius: 4 }, style]}
          className="bg-divider"
        />
      ))}
    </View>
  );
}
