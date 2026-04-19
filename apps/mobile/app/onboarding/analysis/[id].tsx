/** Screen 3 — Analysis streaming (stub). */
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function OnboardingAnalysis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-bg-app items-center justify-center px-8">
      <Text className="font-serif italic text-text-secondary">
        Screen 3 — analysis stub (photo_id: {id})
      </Text>
    </View>
  );
}
