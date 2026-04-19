/**
 * Bottom-sheet modal used on Screen 3 when the user taps "Corrige".
 * Simple RN Modal over a translucent backdrop — no extra deps.
 */
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const MAX_CHARS = 500;

export interface CorrectionModalProps {
  visible: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}

export function CorrectionModal({
  visible,
  submitting,
  onCancel,
  onSubmit,
}: CorrectionModalProps) {
  const [text, setText] = useState("");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/40">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="bg-bg-app rounded-t-3xl px-6 pt-6 pb-8 gap-4"
            accessibilityLabel="Formulaire de correction"
          >
            <Text className="font-serif italic text-text-primary text-lg">
              Dis-moi ce qui ne colle pas.
            </Text>
            <TextInput
              value={text}
              onChangeText={(v) =>
                setText(v.length > MAX_CHARS ? v.slice(0, MAX_CHARS) : v)
              }
              multiline
              autoFocus
              numberOfLines={4}
              className="bg-bg-surface border border-divider rounded-md px-3 py-2 text-text-primary min-h-[120px]"
              placeholder="Exemple : non, je n'aime pas les tons froids."
              placeholderTextColor="#B8AFA0"
              maxLength={MAX_CHARS}
              editable={!submitting}
              textAlignVertical="top"
              accessibilityLabel="Zone de texte pour ta correction"
            />
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-text-tertiary text-xs">
                {text.length}/{MAX_CHARS}
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={onCancel}
                  disabled={submitting}
                  className="px-4 py-3 rounded-full border border-text-primary active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Annuler"
                >
                  <Text className="font-sans text-text-primary">Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={() => onSubmit(text.trim())}
                  disabled={submitting || text.trim().length === 0}
                  className="px-5 py-3 rounded-full bg-text-primary active:opacity-80 disabled:opacity-40"
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer la correction"
                >
                  <Text className="font-sans text-bg-app">
                    {submitting ? "Envoi…" : "Envoyer"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
