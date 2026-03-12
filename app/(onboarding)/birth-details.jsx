// app/(onboarding)/birth-details.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BIRTH DETAILS — 3-step wizard: Date of Birth → Time → Place
// 100% live data — saves to real API, Nakshatra computed on backend
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   TextInput,
   ScrollView,
   Animated,
   Alert,
   ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { onboardingAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const STEPS = ["Date of Birth", "Time of Birth", "Place of Birth"];

export default function BirthDetailsScreen() {
   const router = useRouter();

   const [currentStep, setCurrentStep] = useState(0);
   const [loading, setLoading] = useState(false);

   // Birth data state
   const [dob, setDob] = useState(new Date(1995, 0, 1));
   const [tob, setTob] = useState(new Date(1995, 0, 1, 10, 30));
   const [showDob, setShowDob] = useState(false);
   const [showTob, setShowTob] = useState(false);
   const [place, setPlace] = useState("");
   const [lat, setLat] = useState("");
   const [lng, setLng] = useState("");

   const progressAnim = useRef(new Animated.Value(1 / STEPS.length)).current;

   const animateProgress = (step) => {
      Animated.timing(progressAnim, {
         toValue: (step + 1) / STEPS.length,
         duration: 400,
         useNativeDriver: false, // can't use native driver for width animations
      }).start();
   };

   const goNext = () => {
      if (currentStep < STEPS.length - 1) {
         const next = currentStep + 1;
         setCurrentStep(next);
         animateProgress(next);
      } else {
         handleSubmit();
      }
   };

   const handleSubmit = async () => {
      if (!place.trim()) {
         Alert.alert("Missing Info", "Please enter your birth place.");
         return;
      }

      setLoading(true);
      try {
         const dobStr = dob.toISOString().split("T")[0]; // "YYYY-MM-DD"
         const hours = String(tob.getHours()).padStart(2, "0");
         const mins = String(tob.getMinutes()).padStart(2, "0");
         const tobStr = `${hours}:${mins}`; // "HH:MM"

         const payload = {
            dateOfBirth: dobStr,
            timeOfBirth: tobStr,
            placeOfBirth: place.trim(),
            latitude: parseFloat(lat) || 17.385, // default: Hyderabad
            longitude: parseFloat(lng) || 78.4867,
            utcOffset: 5.5, // IST — TODO: auto-detect from device timezone
         };

         console.log("[BIRTH DETAILS] Submitting payload:", payload);

         // This call computes Nakshatra on the backend and saves it
         const res = await onboardingAPI.saveBirthDetails(payload);
         console.log("[BIRTH DETAILS] Success:", res.data.kundli?.nakshatra);

         // Navigate to profile setup (next onboarding step)
         router.push("/(onboarding)/profile");
      } catch (err) {
         console.error(
            "[BIRTH DETAILS] Error:",
            err.response?.data || err.message,
         );
         Alert.alert(
            "Error",
            err?.response?.data?.message ||
               err.message ||
               "Something went wrong. Please try again.",
         );
      } finally {
         setLoading(false);
      }
   };

   const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
   });

   return (
      <View style={styles.container}>
         {/* Header with progress bar */}
         <View style={styles.header}>
            <Text style={styles.stepLabel}>
               STEP {currentStep + 1} OF {STEPS.length}
            </Text>
            <Text style={styles.stepTitle}>{STEPS[currentStep]}</Text>
            <View style={styles.progressTrack}>
               <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
               />
            </View>
         </View>

         <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
         >
            {/* ── STEP 1: Date of Birth ──────────────────────────────────────── */}
            {currentStep === 0 && (
               <View style={styles.stepContent}>
                  <Text style={styles.emoji}>📅</Text>
                  <Text style={styles.title}>When were you born?</Text>
                  <Text style={styles.subtitle}>
                     Your birth date determines the Moon's position at birth,
                     which defines your Nakshatra (lunar mansion) and Rashi
                     (moon sign).
                  </Text>
                  <TouchableOpacity
                     style={styles.pickerBtn}
                     onPress={() => setShowDob(true)}
                  >
                     <Text style={styles.pickerBtnLabel}>SELECTED DATE</Text>
                     <Text style={styles.pickerBtnValue}>
                        {dob.toLocaleDateString("en-IN", {
                           day: "numeric",
                           month: "long",
                           year: "numeric",
                        })}
                     </Text>
                  </TouchableOpacity>
                  {showDob && (
                     // DateTimePicker is a native component — renders the OS date picker
                     // React.js equivalent: <input type="date" /> (but uglier)
                     <DateTimePicker
                        value={dob}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        minimumDate={new Date(1940, 0, 1)}
                        onChange={(_, date) => {
                           setShowDob(false);
                           if (date) setDob(date);
                        }}
                        themeVariant="dark"
                     />
                  )}
                  <View style={styles.infoBox}>
                     <Text style={styles.infoIcon}>🌙</Text>
                     <Text style={styles.infoText}>
                        The Moon moves through all 27 Nakshatras in ~27.3 days.
                        Your birth date narrows it to about 2 Nakshatras. Birth
                        time gives exact placement.
                     </Text>
                  </View>
               </View>
            )}

            {/* ── STEP 2: Time of Birth ──────────────────────────────────────── */}
            {currentStep === 1 && (
               <View style={styles.stepContent}>
                  <Text style={styles.emoji}>🕰️</Text>
                  <Text style={styles.title}>What time were you born?</Text>
                  <Text style={styles.subtitle}>
                     Birth time pinpoints the exact Moon position. Even 30
                     minutes can change your Nakshatra Pada (quarter), which
                     affects compatibility.
                  </Text>
                  <TouchableOpacity
                     style={styles.pickerBtn}
                     onPress={() => setShowTob(true)}
                  >
                     <Text style={styles.pickerBtnLabel}>SELECTED TIME</Text>
                     <Text style={styles.pickerBtnValue}>
                        {tob.toLocaleTimeString("en-IN", {
                           hour: "2-digit",
                           minute: "2-digit",
                           hour12: true,
                        })}
                     </Text>
                  </TouchableOpacity>
                  {showTob && (
                     <DateTimePicker
                        value={tob}
                        mode="time"
                        display="spinner"
                        onChange={(_, date) => {
                           setShowTob(false);
                           if (date) setTob(date);
                        }}
                        themeVariant="dark"
                     />
                  )}
                  <View style={styles.infoBox}>
                     <Text style={styles.infoIcon}>💡</Text>
                     <Text style={styles.infoText}>
                        Don't know your exact time? Use 12:00 noon as default —
                        this affects Pada (quarter) but not the main Nakshatra
                        in most cases. Your parents or birth certificate are the
                        best sources.
                     </Text>
                  </View>
               </View>
            )}

            {/* ── STEP 3: Place of Birth ─────────────────────────────────────── */}
            {currentStep === 2 && (
               <View style={styles.stepContent}>
                  <Text style={styles.emoji}>📍</Text>
                  <Text style={styles.title}>Where were you born?</Text>
                  <Text style={styles.subtitle}>
                     Your birth coordinates determine the exact UTC offset used
                     in Moon position calculation (especially important near
                     timezone boundaries).
                  </Text>

                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>
                        CITY / PLACE OF BIRTH
                     </Text>
                     <TextInput
                        style={styles.input}
                        placeholder="e.g. Hyderabad, Telangana"
                        placeholderTextColor={COLORS.textDim}
                        value={place}
                        onChangeText={setPlace}
                        autoCapitalize="words"
                     />
                  </View>

                  <View style={styles.row}>
                     <View
                        style={[
                           styles.inputGroup,
                           { flex: 1, marginRight: SPACING.sm },
                        ]}
                     >
                        <Text style={styles.inputLabel}>LATITUDE (opt.)</Text>
                        <TextInput
                           style={styles.input}
                           placeholder="17.3850"
                           placeholderTextColor={COLORS.textDim}
                           value={lat}
                           onChangeText={setLat}
                           keyboardType="decimal-pad"
                        />
                     </View>
                     <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>LONGITUDE (opt.)</Text>
                        <TextInput
                           style={styles.input}
                           placeholder="78.4867"
                           placeholderTextColor={COLORS.textDim}
                           value={lng}
                           onChangeText={setLng}
                           keyboardType="decimal-pad"
                        />
                     </View>
                  </View>

                  <View style={styles.infoBox}>
                     <Text style={styles.infoIcon}>🌐</Text>
                     <Text style={styles.infoText}>
                        IST (UTC +5:30) is used for all Indian birth places.
                        Latitude/Longitude are optional — defaults to Hyderabad
                        if blank. Future version: auto-complete city →
                        coordinates.
                     </Text>
                  </View>
               </View>
            )}
         </ScrollView>

         {/* Footer with Next/Submit button */}
         <View style={styles.footer}>
            <TouchableOpacity
               style={[styles.nextBtn, loading && { opacity: 0.6 }]}
               onPress={goNext}
               disabled={loading}
            >
               {loading ? (
                  <ActivityIndicator color={COLORS.bg} />
               ) : (
                  <Text style={styles.nextBtnText}>
                     {loading
                        ? "Calculating..."
                        : currentStep < STEPS.length - 1
                          ? "Continue →"
                          : "Reveal My Nakshatra 🔮"}
                  </Text>
               )}
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
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: SPACING.md,
   },
   progressTrack: {
      height: 3,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   progressFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },
   body: { paddingHorizontal: SPACING.xl, paddingBottom: 140 },
   stepContent: { paddingTop: SPACING.lg },
   emoji: { fontSize: 56, marginBottom: SPACING.md },
   title: {
      fontFamily: FONTS.heading,
      fontSize: 26,
      color: COLORS.textPrimary,
      marginBottom: SPACING.sm,
   },
   subtitle: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      lineHeight: 22,
      marginBottom: SPACING.xl,
   },
   pickerBtn: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.md,
      marginBottom: SPACING.md,
   },
   pickerBtnLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      marginBottom: 4,
      letterSpacing: 2,
   },
   pickerBtnValue: {
      fontFamily: FONTS.bodyBold,
      fontSize: 22,
      color: COLORS.gold,
   },
   inputGroup: { marginBottom: SPACING.md },
   inputLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textSecondary,
      letterSpacing: 2,
      marginBottom: SPACING.xs,
   },
   input: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontFamily: FONTS.bodyMedium,
      fontSize: 16,
      color: COLORS.textPrimary,
   },
   row: { flexDirection: "row" },
   infoBox: {
      flexDirection: "row",
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.sm,
      marginTop: SPACING.sm,
   },
   infoIcon: { fontSize: 18 },
   infoText: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      flex: 1,
      lineHeight: 18,
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
   },
   nextBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md + 2,
      alignItems: "center",
      elevation: 8,
   },
   nextBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: COLORS.bg,
   },
});
