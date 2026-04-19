/**
 * Four corner brackets overlaid on the camera viewfinder — cream
 * translucent, as specified in docs/03-DESIGN-SYSTEM.md §Screen 2.
 */
import { View } from "react-native";

const LENGTH = 22;
const THICKNESS = 2;
const COLOR = "#FAF6EE";
const OPACITY = 0.7;

export function CornerBrackets() {
  return (
    <View
      style={{ position: "absolute", inset: 0 }}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      {/* top-left */}
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          width: LENGTH,
          height: THICKNESS,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          width: THICKNESS,
          height: LENGTH,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      {/* top-right */}
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: LENGTH,
          height: THICKNESS,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: THICKNESS,
          height: LENGTH,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      {/* bottom-left */}
      <View
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          width: LENGTH,
          height: THICKNESS,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          width: THICKNESS,
          height: LENGTH,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      {/* bottom-right */}
      <View
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          width: LENGTH,
          height: THICKNESS,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          width: THICKNESS,
          height: LENGTH,
          backgroundColor: COLOR,
          opacity: OPACITY,
        }}
      />
    </View>
  );
}
