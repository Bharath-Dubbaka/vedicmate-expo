// app/(onboarding)/birth-details.jsx
import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const STEPS = ["Date of Birth", "Time of Birth", "Place of Birth"];
const IS_DEV = true; // flip to false when real backend is ready

export default function BirthDetailsScreen() {
  const router = useRouter();
  const { token, updateUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dob, setDob] = useState(new Date(1995, 0, 1));
  const [tob, setTob] = useState(new Date(1995, 0, 1, 10, 30));
  const [showDob, setShowDob] = useState(false);
  const [showTob, setShowTob] = useState(false);
  const [place, setPlace] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (step) => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const goNext = () => {
    const next = currentStep + 1;
    if (next < STEPS.length) {
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
      const dobStr = dob.toISOString().split("T")[0];
      const hours = String(tob.getHours()).padStart(2, "0");
      const mins = String(tob.getMinutes()).padStart(2, "0");
      const tobStr = `${hours}:${mins}`;

      const payload = {
        dateOfBirth: dobStr,
        timeOfBirth: tobStr,
        placeOfBirth: place,
        latitude: parseFloat(lat) || 17.385,
        longitude: parseFloat(lng) || 78.4867,
        utcOffset: 5.5,
      };

      const isDev = !token || token.startsWith("dev_token");

      if (isDev) {
        // Store birth details in user object for cosmic reveal to use
        await updateUser({ birthDetails: payload });
        console.log("DEV: skipping API, navigating to profile");
        router.push("/(onboarding)/profile");
        return;
      }

      const { onboardingAPI } = await import("../../services/api");
      await onboardingAPI.saveBirthDetails(payload);
      router.push("/(onboarding)/profile");
    } catch (err) {
      console.error("Birth details error:", err);
      Alert.alert("Error", err?.response?.data?.message || err.message || "Something went wrong");
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
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Step {currentStep + 1} of {STEPS.length}</Text>
        <Text style={styles.stepTitle}>{STEPS[currentStep]}</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>📅</Text>
            <Text style={styles.title}>When were you born?</Text>
            <Text style={styles.subtitle}>
              Your birth date determines the Moon position which defines your Nakshatra.
            </Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDob(true)}>
              <Text style={styles.pickerBtnLabel}>SELECTED DATE</Text>
              <Text style={styles.pickerBtnValue}>
                {dob.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </TouchableOpacity>
            {showDob && (
              <DateTimePicker
                value={dob} mode="date" display="spinner"
                maximumDate={new Date()} minimumDate={new Date(1940, 0, 1)}
                onChange={(_, date) => { setShowDob(false); if (date) setDob(date); }}
                themeVariant="dark"
              />
            )}
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>🕰️</Text>
            <Text style={styles.title}>What time were you born?</Text>
            <Text style={styles.subtitle}>
              Birth time pinpoints the exact Moon position for precise Nakshatra calculation.
            </Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTob(true)}>
              <Text style={styles.pickerBtnLabel}>SELECTED TIME</Text>
              <Text style={styles.pickerBtnValue}>
                {tob.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </Text>
            </TouchableOpacity>
            {showTob && (
              <DateTimePicker
                value={tob} mode="time" display="spinner"
                onChange={(_, date) => { setShowTob(false); if (date) setTob(date); }}
                themeVariant="dark"
              />
            )}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Don't know your exact time? Use 12:00 noon as default.
              </Text>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>📍</Text>
            <Text style={styles.title}>Where were you born?</Text>
            <Text style={styles.subtitle}>
              Your birthplace coordinates help calculate your exact birth chart.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / Place of Birth</Text>
              <TextInput
                style={styles.input} placeholder="e.g. Hyderabad, India"
                placeholderTextColor={COLORS.textDim} value={place}
                onChangeText={setPlace} autoCapitalize="words"
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.inputLabel}>Latitude (optional)</Text>
                <TextInput
                  style={styles.input} placeholder="17.3850"
                  placeholderTextColor={COLORS.textDim} value={lat}
                  onChangeText={setLat} keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Longitude (optional)</Text>
                <TextInput
                  style={styles.input} placeholder="78.4867"
                  placeholderTextColor={COLORS.textDim} value={lng}
                  onChangeText={setLng} keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>🌐</Text>
              <Text style={styles.infoText}>
                IST (UTC +5:30) is auto-applied. Lat/Lng optional in dev mode.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, loading && { opacity: 0.6 }]}
          onPress={goNext} disabled={loading}
        >
          <Text style={styles.nextBtnText}>
            {loading ? "Calculating..." :
             currentStep < STEPS.length - 1 ? "Continue →" : "Reveal My Nakshatra 🔮"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
  stepLabel: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold, letterSpacing: 2, marginBottom: 4 },
  stepTitle: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.textPrimary, marginBottom: SPACING.md },
  progressTrack: { height: 3, backgroundColor: COLORS.border, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },
  body: { paddingHorizontal: SPACING.xl, paddingBottom: 120 },
  stepContent: { paddingTop: SPACING.lg },
  emoji: { fontSize: 56, marginBottom: SPACING.md },
  title: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.xl },
  pickerBtn: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  pickerBtnLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textDim, marginBottom: 4, letterSpacing: 1 },
  pickerBtnValue: { fontFamily: FONTS.bodyBold, fontSize: 20, color: COLORS.gold },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.xs, letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontFamily: FONTS.bodyMedium, fontSize: 16, color: COLORS.textPrimary },
  row: { flexDirection: "row" },
  infoBox: { flexDirection: "row", backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm, marginTop: SPACING.sm },
  infoIcon: { fontSize: 18 },
  infoText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 19 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.xl, paddingBottom: 40, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border },
  nextBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, alignItems: "center", elevation: 8 },
  nextBtnText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.bg },
});