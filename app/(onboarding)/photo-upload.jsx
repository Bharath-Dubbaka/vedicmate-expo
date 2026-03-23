// app/(onboarding)/photo-upload.jsx
// Step 4 of onboarding — profile photo upload
// Works in Expo Go (expo-image-picker is a pure JS library)

import { useState } from "react";
import {
   View,
   Text,
   StyleSheet,
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
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

export default function PhotoUploadScreen() {
   const router = useRouter();
   const dispatch = useDispatch();

   const [photoUri, setPhotoUri] = useState(null);
   const [uploading, setUploading] = useState(false);

   // ── Pick image from library ──────────────────────────────
   const pickImage = async () => {
      const { status } =
         await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
         Alert.alert(
            "Permission needed",
            "Please allow photo access in your device settings to upload a profile photo.",
         );
         return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ["images"],
         allowsEditing: true,
         aspect: [1, 1], // square crop
         quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
         setPhotoUri(result.assets[0].uri);
      }
   };

   // ── Take photo with camera ───────────────────────────────
   const takePhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
         Alert.alert(
            "Permission needed",
            "Please allow camera access in your device settings.",
         );
         return;
      }

      const result = await ImagePicker.launchCameraAsync({
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
         setPhotoUri(result.assets[0].uri);
      }
   };

   // ── Upload to Cloudinary via backend ────────────────────
   const handleUpload = async () => {
      if (!photoUri) return;

      setUploading(true);
      try {
         // Build multipart/form-data payload
         const filename = photoUri.split("/").pop();
         const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
         const mimeType =
            extension === "png"
               ? "image/png"
               : extension === "webp"
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
            // Sync fresh photos[] into Redux + AsyncStorage
            await dispatch(updateUser({ photos: [res.data.photoUrl] }));
            console.log("[PHOTO UPLOAD] Success:", res.data.photoUrl);
            // Navigate to main app — onboarding is fully complete
            router.replace("/(tabs)/discover");
         }
      } catch (err) {
         console.error(
            "[PHOTO UPLOAD] Error:",
            err.response?.data || err.message,
         );
         Alert.alert(
            "Upload failed",
            err?.response?.data?.message ||
               "Please check your connection and try again.",
         );
      } finally {
         setUploading(false);
      }
   };

   // ── Skip (photo optional) ────────────────────────────────
   const handleSkip = () => {
      router.replace("/(tabs)/discover");
   };

   return (
      <View style={styles.container}>
         {/* Header */}
         <View style={styles.header}>
            <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
            <Text style={styles.stepTitle}>Your Photo</Text>
            <Text style={styles.stepSubtitle}>
               Help your matches recognise you ✨
            </Text>
         </View>

         {/* Photo preview / placeholder */}
         <View style={styles.photoSection}>
            {photoUri ? (
               <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
               <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderEmoji}>👤</Text>
                  <Text style={styles.photoPlaceholderText}>
                     No photo selected
                  </Text>
               </View>
            )}

            {/* Pick buttons */}
            <View style={styles.pickBtnsRow}>
               <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={pickImage}
                  activeOpacity={0.8}
               >
                  <Text style={styles.pickBtnEmoji}>🖼️</Text>
                  <Text style={styles.pickBtnText}>Gallery</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={takePhoto}
                  activeOpacity={0.8}
               >
                  <Text style={styles.pickBtnEmoji}>📷</Text>
                  <Text style={styles.pickBtnText}>Camera</Text>
               </TouchableOpacity>
            </View>
         </View>

         {/* Tips */}
         <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>✦ PHOTO TIPS</Text>
            {[
               "Clear face shot — matches see this first",
               "Good lighting makes a huge difference",
               "Smile! Authenticity attracts cosmic matches",
            ].map((tip) => (
               <Text key={tip} style={styles.tipText}>
                  · {tip}
               </Text>
            ))}
         </View>

         {/* Footer */}
         <View style={styles.footer}>
            {/* Upload button — only shown when a photo is selected */}
            {photoUri && (
               <TouchableOpacity
                  style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
                  onPress={handleUpload}
                  disabled={uploading}
                  activeOpacity={0.85}
               >
                  {uploading ? (
                     <ActivityIndicator color={COLORS.bg} />
                  ) : (
                     <Text style={styles.uploadBtnText}>
                        Upload & Start Matching 🔮
                     </Text>
                  )}
               </TouchableOpacity>
            )}

            {/* Skip link */}
            <TouchableOpacity
               style={styles.skipBtn}
               onPress={handleSkip}
               disabled={uploading}
            >
               <Text style={styles.skipBtnText}>
                  {photoUri ? "Skip for now →" : "Skip — add photo later →"}
               </Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },

   header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: 60,
      paddingBottom: SPACING.lg,
   },
   stepLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.gold,
      letterSpacing: 3,
      marginBottom: 4,
   },
   stepTitle: {
      fontFamily: FONTS.heading,
      fontSize: 26,
      color: COLORS.textPrimary,
      marginBottom: 4,
   },
   stepSubtitle: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
   },

   photoSection: {
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
      marginTop: SPACING.lg,
   },
   photoPreview: {
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 3,
      borderColor: COLORS.gold,
      marginBottom: SPACING.xl,
   },
   photoPlaceholder: {
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
   },
   photoPlaceholderEmoji: { fontSize: 56 },
   photoPlaceholderText: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textDim,
   },

   pickBtnsRow: {
      flexDirection: "row",
      gap: SPACING.lg,
   },
   pickBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.bgCard,
      gap: 4,
   },
   pickBtnEmoji: { fontSize: 24 },
   pickBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textSecondary,
   },

   tipsBox: {
      marginHorizontal: SPACING.xl,
      marginTop: SPACING.xl,
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.xs,
   },
   tipsTitle: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.gold,
      letterSpacing: 2,
      marginBottom: SPACING.xs,
   },
   tipText: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      lineHeight: 20,
   },

   footer: {
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
   },
   uploadBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md + 2,
      alignItems: "center",
      elevation: 8,
   },
   uploadBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: COLORS.bg,
   },
   skipBtn: {
      alignItems: "center",
      paddingVertical: SPACING.sm,
   },
   skipBtnText: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textDim,
   },
});
