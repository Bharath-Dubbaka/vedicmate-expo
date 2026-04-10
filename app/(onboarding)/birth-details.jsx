// app/(onboarding)/birth-details.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BIRTH DETAILS — 3-step wizard: Date of Birth → Time → Place
// 100% live data — saves to real API, Nakshatra computed on backend
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { onboardingAPI, authAPI } from "../../services/api";
import { updateUser, selectUser } from "../../store/slices/authSlice";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const STEPS = ["Date of Birth", "Time of Birth", "Place of Birth"];

export default function BirthDetailsScreen() {
   const router = useRouter();
   const dispatch = useDispatch();
   const user = useSelector(selectUser);

   const [currentStep, setCurrentStep] = useState(0);
   const [displayName, setDisplayName] = useState("");
   const [loading, setLoading] = useState(false);

   // Set name from Google OAuth on mount
   useEffect(() => {
      if (user?.name) setDisplayName(user.name);
   }, []);

   // Birth data state
   const [dob, setDob] = useState(new Date(1995, 0, 1));
   const [tob, setTob] = useState(new Date(1995, 0, 1, 10, 30));
   const [showDob, setShowDob] = useState(false);
   const [showTob, setShowTob] = useState(false);
   const [place, setPlace] = useState("");
   const [geocoding, setGeocoding] = useState(false);
   const [geocodeResult, setGeocodeResult] = useState(null);
   const [lat, setLat] = useState("");
   const [lng, setLng] = useState("");

   // Geocode place name → lat/long using OpenStreetMap (free, no API key)
   const geocodePlace = async (placeName) => {
      if (!placeName.trim() || placeName.trim().length < 3) return;
      setGeocoding(true);
      setGeocodeResult(null);
      try {
         const encoded = encodeURIComponent(placeName.trim());
         const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`,
            {
               headers: {
                  "User-Agent": "VedicFind/1.0 (vedicfind@gmail.com)",
               },
            },
         );
         const data = await response.json();
         if (data && data.length > 0) {
            const result = data[0];
            const newLat = parseFloat(result.lat).toFixed(4);
            const newLng = parseFloat(result.lon).toFixed(4);
            setLat(newLat);
            setLng(newLng);
            setGeocodeResult(result.display_name);
            console.log(`[GEOCODE] ${placeName} → ${newLat}, ${newLng}`);
         } else {
            // Not found in India, try worldwide
            const response2 = await fetch(
               `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
               {
                  headers: {
                     "User-Agent": "VedicFind/1.0 (vedicfind@gmail.com)",
                  },
               },
            );
            const data2 = await response2.json();
            if (data2 && data2.length > 0) {
               const result = data2[0];
               const newLat = parseFloat(result.lat).toFixed(4);
               const newLng = parseFloat(result.lon).toFixed(4);
               setLat(newLat);
               setLng(newLng);
               setGeocodeResult(result.display_name);
            } else {
               setGeocodeResult(null);
               console.log(`[GEOCODE] No results for: ${placeName}`);
            }
         }
      } catch (err) {
         console.error("[GEOCODE] Error:", err.message);
      } finally {
         setGeocoding(false);
      }
   };
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

         // Save name if changed
         if (displayName.trim() && displayName.trim() !== user?.name) {
            await authAPI.updateMe({ name: displayName.trim() });
            await dispatch(updateUser({ name: displayName.trim() }));
         }
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
                     <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                        <TextInput
                           style={[styles.input, { flex: 1 }]}
                           placeholder="e.g. Hyderabad, Goa, Mumbai"
                           placeholderTextColor={COLORS.textDim}
                           value={place}
                           onChangeText={(text) => {
                              setPlace(text);
                              setGeocodeResult(null);
                              setLat("");
                              setLng("");
                           }}
                           onEndEditing={() => geocodePlace(place)}
                           autoCapitalize="words"
                           returnKeyType="search"
                           onSubmitEditing={() => geocodePlace(place)}
                        />
                        <TouchableOpacity
                           style={{
                              backgroundColor: geocoding
                                 ? COLORS.bgElevated
                                 : COLORS.gold,
                              borderRadius: RADIUS.md,
                              paddingHorizontal: SPACING.md,
                              justifyContent: "center",
                              opacity: geocoding ? 0.6 : 1,
                           }}
                           onPress={() => geocodePlace(place)}
                           disabled={geocoding}
                        >
                           {geocoding ? (
                              <ActivityIndicator
                                 size="small"
                                 color={COLORS.bg}
                              />
                           ) : (
                              <Text
                                 style={{
                                    fontFamily: FONTS.bodyBold,
                                    fontSize: 13,
                                    color: COLORS.bg,
                                 }}
                              >
                                 Find 📍
                              </Text>
                           )}
                        </TouchableOpacity>
                     </View>

                     {/* Show geocode result */}
                     {geocodeResult && (
                        <View
                           style={{
                              marginTop: SPACING.sm,
                              backgroundColor: COLORS.bgElevated,
                              borderRadius: RADIUS.md,
                              padding: SPACING.sm,
                              borderWidth: 1,
                              borderColor: "#4CAF50",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: SPACING.sm,
                           }}
                        >
                           <Text style={{ fontSize: 14 }}>✅</Text>
                           <View style={{ flex: 1 }}>
                              <Text
                                 style={{
                                    fontFamily: FONTS.bodyMedium,
                                    fontSize: 12,
                                    color: "#4CAF50",
                                    marginBottom: 2,
                                 }}
                              >
                                 Location found
                              </Text>
                              <Text
                                 style={{
                                    fontFamily: FONTS.body,
                                    fontSize: 11,
                                    color: COLORS.textSecondary,
                                 }}
                                 numberOfLines={2}
                              >
                                 {geocodeResult}
                              </Text>
                              <Text
                                 style={{
                                    fontFamily: FONTS.body,
                                    fontSize: 11,
                                    color: COLORS.textDim,
                                    marginTop: 2,
                                 }}
                              >
                                 {lat}, {lng}
                              </Text>
                           </View>
                        </View>
                     )}

                     {/* Not found warning */}
                     {!geocoding &&
                        !geocodeResult &&
                        place.length > 3 &&
                        !lat && (
                           <Text
                              style={{
                                 fontFamily: FONTS.body,
                                 fontSize: 11,
                                 color: COLORS.rose,
                                 marginTop: 4,
                              }}
                           >
                              Location not found. Try a nearby city name.
                           </Text>
                        )}
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>YOUR DISPLAY NAME</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="How you'll appear to matches"
                        placeholderTextColor={COLORS.textDim}
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="words"
                        maxLength={50}
                     />
                     <Text
                        style={{
                           fontFamily: FONTS.body,
                           fontSize: 11,
                           color: COLORS.textDim,
                           marginTop: 4,
                        }}
                     >
                        ⚠️ Gender and date of birth cannot be changed after this
                        step
                     </Text>
                  </View>

                  <View style={styles.infoBox}>
                     <Text style={styles.infoIcon}>🌐</Text>
                     <Text style={styles.infoText}>
                        Type your birth city and tap "Find 📍" to auto-detect
                        coordinates. IST (UTC +5:30) is used for Indian birth
                        places. Accurate coordinates improve Nakshatra
                        precision.
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
