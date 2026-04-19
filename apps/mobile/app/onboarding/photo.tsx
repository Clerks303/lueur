/**
 * Screen 2 — Photo capture.
 * Per docs/03-DESIGN-SYSTEM.md §Screen 2.
 *
 * Flow on shutter tap:
 *   1. Medium haptic.
 *   2. Take picture (quality 0.85, skipProcessing: false so iOS transcodes
 *      HEIC → JPEG for us).
 *   3. POST /photos/upload-url → get a presigned PUT URL.
 *   4. expo-file-system PUT the bytes directly to MinIO/Scaleway.
 *   5. POST /photos/:id/complete → API enqueues the analyze-photo job.
 *   6. router.replace(`/onboarding/analysis/${photo_id}`).
 *
 * Any step failing surfaces a sober editorial error and returns to the
 * viewfinder. Gallery fallback uses expo-image-picker + expo-image-manipulator
 * to coerce HEIC to JPEG before upload.
 */
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  completePhoto,
  requestUploadUrl,
  type UploadUrlResponse,
} from "@/api/client";
import { CornerBrackets } from "@/components/CornerBrackets";
import { t } from "@/i18n";

type PhotoSource = { uri: string };

export default function OnboardingPhoto() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handlePermission = useCallback(async () => {
    if (!permission || permission.granted) return;
    if (permission.canAskAgain) {
      await requestPermission();
    } else {
      Alert.alert(
        t("onboarding.photo.permissionTitle"),
        t("onboarding.photo.permissionBody"),
        [
          { text: "Ok", style: "cancel" },
          {
            text: t("onboarding.photo.openSettings"),
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  }, [permission, requestPermission]);

  const uploadAndAdvance = useCallback(async (source: PhotoSource) => {
    let upload: UploadUrlResponse;
    try {
      upload = await requestUploadUrl("image/jpeg");
      const put = await FileSystem.uploadAsync(upload.upload_url, source.uri, {
        httpMethod: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
      if (put.status < 200 || put.status >= 300) {
        throw new Error(`upload failed: ${put.status}`);
      }
      await completePhoto(upload.photo_id);
      router.replace({
        pathname: "/onboarding/analysis/[id]",
        params: { id: upload.photo_id },
      });
    } catch {
      setErrorKey("onboarding.photo.uploadFailed");
    }
  }, []);

  const onShutter = useCallback(async () => {
    if (capturing) return;
    setErrorKey(null);
    if (!permission?.granted) {
      await handlePermission();
      return;
    }
    const camera = cameraRef.current;
    if (!camera) return;
    setCapturing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const picture = await camera.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
        exif: false,
      });
      if (!picture?.uri) throw new Error("camera returned no uri");
      await uploadAndAdvance({ uri: picture.uri });
    } catch {
      setErrorKey("onboarding.photo.uploadFailed");
    } finally {
      setCapturing(false);
    }
  }, [capturing, permission, handlePermission, uploadAndAdvance]);

  const onPickFromGallery = useCallback(async () => {
    if (capturing) return;
    setErrorKey(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setCapturing(true);
    try {
      // Coerce HEIC / unknown formats to JPEG so the API whitelist accepts it.
      const jpeg = await ImageManipulator.manipulateAsync(asset.uri, [], {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      await uploadAndAdvance({ uri: jpeg.uri });
    } catch {
      setErrorKey("onboarding.photo.uploadFailed");
    } finally {
      setCapturing(false);
    }
  }, [capturing, uploadAndAdvance]);

  const ready = permission?.granted === true;

  return (
    <View
      className="flex-1 bg-bg-app"
      style={{ paddingTop: insets.top + 16 }}
      accessibilityLabel="Écran de capture photo"
    >
      <View className="px-8 items-center mb-4">
        <Text className="font-sans text-text-secondary text-sm text-center">
          {t("onboarding.photo.instruction")}
        </Text>
        <Text className="font-serif italic text-accent-primary text-lg mt-1">
          {t("onboarding.photo.accent")}
        </Text>
      </View>

      <View
        className="mx-6 flex-1 rounded-2xl overflow-hidden bg-text-primary"
        accessibilityLabel="Viseur caméra"
      >
        {ready ? (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            mode="picture"
          />
        ) : (
          <Pressable
            onPress={handlePermission}
            className="flex-1 items-center justify-center px-8"
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.photo.openSettings")}
          >
            <Text className="font-sans text-bg-app text-center">
              {t("onboarding.photo.permissionBody")}
            </Text>
          </Pressable>
        )}
        <CornerBrackets />
      </View>

      {errorKey && (
        <Text className="font-sans text-accent-primary text-center px-8 mt-4">
          {t(errorKey)}
        </Text>
      )}

      <View
        className="items-center justify-center"
        style={{ paddingTop: 24, paddingBottom: insets.bottom + 24 }}
      >
        <Pressable
          onPress={onShutter}
          disabled={capturing || !ready}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.photo.shutterLabel")}
          className="w-20 h-20 items-center justify-center"
        >
          <View className="w-20 h-20 rounded-full border-2 border-text-primary items-center justify-center">
            {capturing ? (
              <ActivityIndicator color="#1F1A17" />
            ) : (
              <View className="w-14 h-14 rounded-full bg-text-primary" />
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={onPickFromGallery}
          disabled={capturing}
          accessibilityRole="button"
          className="mt-4"
        >
          <Text className="font-sans italic text-text-secondary text-sm underline">
            {t("onboarding.photo.gallery")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
