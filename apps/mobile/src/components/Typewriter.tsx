/**
 * Typewriter effect over an array of lines. Each line reveals char by char
 * at ~CHAR_MS ms/char, with a small terracotta cursor bar on the currently-
 * typing line. When all lines are out, onComplete fires once.
 *
 * Design note (docs/03-DESIGN-SYSTEM.md §Screen 3): the narrative is
 * editorial. We avoid jitter by giving each line its own steady cadence
 * rather than animating whole-word reveals.
 */
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

const CHAR_MS = 45;

export interface TypewriterProps {
  lines: readonly string[];
  onComplete?: () => void;
}

export function Typewriter({ lines, onComplete }: TypewriterProps) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const calledComplete = useRef(false);

  useEffect(() => {
    if (lineIdx >= lines.length) {
      if (!calledComplete.current) {
        calledComplete.current = true;
        onComplete?.();
      }
      return;
    }
    const current = lines[lineIdx] ?? "";
    if (charIdx < current.length) {
      const id = setTimeout(() => setCharIdx(charIdx + 1), CHAR_MS);
      return () => clearTimeout(id);
    }
    // Finished a line → brief pause before starting the next.
    const id = setTimeout(() => {
      setLineIdx(lineIdx + 1);
      setCharIdx(0);
    }, 280);
    return () => clearTimeout(id);
  }, [lineIdx, charIdx, lines, onComplete]);

  return (
    <View className="gap-2">
      {lines.map((line, i) => {
        const typed =
          i < lineIdx ? line : i === lineIdx ? line.slice(0, charIdx) : "";
        const isActive = i === lineIdx && charIdx < line.length;
        return (
          <View key={i} className="flex-row items-center">
            <Text className="font-sans text-text-primary text-base leading-6 flex-1">
              {typed}
              {isActive && (
                <Text className="text-accent-primary">{"▌"}</Text>
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
