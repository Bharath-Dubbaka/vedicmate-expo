// app/(onboarding)/photo-upload.jsx
// Step 4 of onboarding — profile photo upload
// Works in Expo Go (expo-image-picker is a pure JS library)

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { updateUser } from "../../store/slices/authSlice";
import { authAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function PhotoUploadScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();

  const [photoUri, setPhotoUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo access in your device settings."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0])
      setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0])
      setPhotoUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!photoUri) return;
    setUploading(true);
    try {
      const filename = photoUri.split("/").pop();
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
      const formData = new FormData();
      formData.append("photo", {
        uri: photoUri,
        name: filename,
        type: mimeType,
      });
      const res = await authAPI.uploadPhoto(formData);
      if (res.data?.success) {
        await dispatch(updateUser({ photos: [res.data.photoUrl] }));
        router.replace("/(tabs)/discover");
      }
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err?.response?.data?.message ||
          "Please check your connection and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: SPACING.xl,
          paddingTop: 60,
          paddingBottom: SPACING.lg,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            color: COLORS.gold,
            letterSpacing: 3,
            marginBottom: 4,
          }}
        >
          STEP 4 OF 4
        </Text>
        <Text
          style={{
            fontFamily: FONTS.heading,
            fontSize: 26,
            color: COLORS.textPrimary,
            marginBottom: 4,
          }}
        >
          Your Photo
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: COLORS.textSecondary,
          }}
        >
          Help your matches recognise you ✨
        </Text>
      </View>

      {/* Photo section */}
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: SPACING.xl,
          marginTop: SPACING.lg,
        }}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              borderWidth: 3,
              borderColor: COLORS.gold,
              marginBottom: SPACING.xl,
            }}
          />
        ) : (
          <View
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: COLORS.bgCard,
              borderWidth: 2,
              borderColor: COLORS.border,
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: SPACING.xl,
              gap: SPACING.sm,
            }}
          >
            <Text style={{ fontSize: 56 }}>👤</Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textDim,
              }}
            >
              No photo selected
            </Text>
          </View>
        )}

        {/* Pick buttons */}
        <View style={{ flexDirection: "row", gap: SPACING.lg, width: "100%" }}>
          {[
            { emoji: "🖼️", label: "Gallery", fn: pickImage },
            { emoji: "📷", label: "Camera", fn: takePhoto },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.label}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: SPACING.md,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.bgCard,
                gap: 4,
              }}
              onPress={btn.fn}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24 }}>{btn.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                }}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View
        style={{
          marginHorizontal: SPACING.xl,
          marginTop: SPACING.xl,
          backgroundColor: COLORS.bgElevated,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          gap: SPACING.xs,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 2,
            marginBottom: SPACING.xs,
          }}
        >
          ✦ PHOTO TIPS
        </Text>
        {[
          "Clear face shot — matches see this first",
          "Good lighting makes a huge difference",
          "Smile! Authenticity attracts cosmic matches",
        ].map((tip) => (
          <Text
            key={tip}
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textSecondary,
              lineHeight: 20,
            }}
          >
            · {tip}
          </Text>
        ))}
      </View>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: SPACING.xl,
          paddingBottom: 40,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          gap: SPACING.sm,
        }}
      >
        {photoUri && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.md + 2,
              alignItems: "center",
              elevation: 8,
              opacity: uploading ? 0.6 : 1,
            }}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 16,
                  color: COLORS.bg,
                }}
              >
                Upload & Start Matching 🔮
              </Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{ alignItems: "center", paddingVertical: SPACING.sm }}
          onPress={() => router.replace("/(tabs)/discover")}
          disabled={uploading}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.textDim,
            }}
          >
            {photoUri ? "Skip for now →" : "Skip — add photo later →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
