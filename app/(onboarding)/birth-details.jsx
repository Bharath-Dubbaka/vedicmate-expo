// app/(onboarding)/birth-details.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BIRTH DETAILS — 3-step wizard: Date of Birth → Time → Place
// 100% live data — saves to real API, Nakshatra computed on backend
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
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
import { useTheme } from "../../context/ThemeContext";

const STEPS = ["Date of Birth", "Time of Birth", "Place of Birth"];

export default function BirthDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dob, setDob] = useState(new Date(1995, 0, 1));
  const [tob, setTob] = useState(new Date(1995, 0, 1, 10, 30));
  const [showDob, setShowDob] = useState(false);
  const [showTob, setShowTob] = useState(false);
  const [place, setPlace] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    if (user?.name) setDisplayName(user.name);
  }, []);

  const geocodePlace = async (placeName) => {
    if (!placeName.trim() || placeName.trim().length < 3) return;
    setGeocoding(true);
    setSearchAttempted(true);
    setGeocodeResult(null);
    try {
      const encoded = encodeURIComponent(placeName.trim());
      const tryFetch = async (url) => {
        const res = await fetch(url, {
          headers: { "User-Agent": "VedicFind/1.0 (vedicfind@gmail.com)" },
        });
        return res.json();
      };
      let data = await tryFetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`
      );
      if (!data?.length)
        data = await tryFetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`
        );
      if (data?.length) {
        setLat(parseFloat(data[0].lat).toFixed(4));
        setLng(parseFloat(data[0].lon).toFixed(4));
        setGeocodeResult(data[0].display_name);
      }
    } catch (err) {
      console.error("[GEOCODE]", err.message);
    } finally {
      setGeocoding(false);
    }
  };

  const progressAnim = useRef(new Animated.Value(1 / STEPS.length)).current;
  const animateProgress = (step) => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      const n = currentStep + 1;
      setCurrentStep(n);
      animateProgress(n);
    } else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!place.trim()) {
      Alert.alert("Missing Info", "Please enter your birth place.");
      return;
    }
    setLoading(true);
    try {
      const dobStr = dob.toISOString().split("T")[0];
      const tobStr = `${String(tob.getHours()).padStart(2, "0")}:${String(
        tob.getMinutes()
      ).padStart(2, "0")}`;
      const payload = {
        dateOfBirth: dobStr,
        timeOfBirth: tobStr,
        placeOfBirth: place.trim(),
        latitude: parseFloat(lat) || 17.385,
        longitude: parseFloat(lng) || 78.4867,
        utcOffset: 5.5,
      };
      await onboardingAPI.saveBirthDetails(payload);
      if (displayName.trim() && displayName.trim() !== user?.name) {
        await authAPI.updateMe({ name: displayName.trim() });
        await dispatch(updateUser({ name: displayName.trim() }));
      }
      router.push("/(onboarding)/profile");
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const inputStyle = {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
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
          STEP {currentStep + 1} OF {STEPS.length}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.heading,
            fontSize: 22,
            color: COLORS.textPrimary,
            marginBottom: SPACING.md,
          }}
        >
          {STEPS[currentStep]}
        </Text>
        <View
          style={{
            height: 3,
            backgroundColor: COLORS.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: 3,
              backgroundColor: COLORS.gold,
              borderRadius: 2,
              width: progressWidth,
            }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.xl,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: DOB */}
        {currentStep === 0 && (
          <View style={{ paddingTop: SPACING.lg }}>
            <Text style={{ fontSize: 56, marginBottom: SPACING.md }}>📅</Text>
            <Text
              style={{
                fontFamily: FONTS.heading,
                fontSize: 26,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              When were you born?
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 22,
                marginBottom: SPACING.xl,
              }}
            >
              Your birth date determines the Moon's position, which defines your
              Nakshatra and Rashi.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: SPACING.md,
                marginBottom: SPACING.md,
              }}
              onPress={() => setShowDob(true)}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  marginBottom: 4,
                  letterSpacing: 2,
                }}
              >
                SELECTED DATE
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 22,
                  color: COLORS.gold,
                }}
              >
                {dob.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>
            {showDob && (
              <DateTimePicker
                value={dob}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1940, 0, 1)}
                onChange={(_, d) => {
                  setShowDob(false);
                  if (d) setDob(d);
                }}
                themeVariant="dark"
              />
            )}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                gap: SPACING.sm,
              }}
            >
              <Text style={{ fontSize: 18 }}>🌙</Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                The Moon moves through all 27 Nakshatras in ~27.3 days. Birth
                time gives exact placement.
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: TOB */}
        {currentStep === 1 && (
          <View style={{ paddingTop: SPACING.lg }}>
            <Text style={{ fontSize: 56, marginBottom: SPACING.md }}>🕰️</Text>
            <Text
              style={{
                fontFamily: FONTS.heading,
                fontSize: 26,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              What time were you born?
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 22,
                marginBottom: SPACING.xl,
              }}
            >
              Birth time pinpoints the exact Moon position. Even 30 minutes can
              change your Nakshatra Pada.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: SPACING.md,
                marginBottom: SPACING.md,
              }}
              onPress={() => setShowTob(true)}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  marginBottom: 4,
                  letterSpacing: 2,
                }}
              >
                SELECTED TIME
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 22,
                  color: COLORS.gold,
                }}
              >
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
                onChange={(_, d) => {
                  setShowTob(false);
                  if (d) setTob(d);
                }}
                themeVariant="dark"
              />
            )}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                gap: SPACING.sm,
              }}
            >
              <Text style={{ fontSize: 18 }}>💡</Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Don't know your exact time? Use 12:00 noon — this affects Pada
                but not the main Nakshatra in most cases.
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Place */}
        {currentStep === 2 && (
          <View style={{ paddingTop: SPACING.lg }}>
            <Text style={{ fontSize: 56, marginBottom: SPACING.md }}>📍</Text>
            <Text
              style={{
                fontFamily: FONTS.heading,
                fontSize: 26,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Where were you born?
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 22,
                marginBottom: SPACING.xl,
              }}
            >
              Your birth coordinates determine the exact UTC offset used in Moon
              position calculation.
            </Text>

            <View style={{ marginBottom: SPACING.md }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                  letterSpacing: 2,
                  marginBottom: SPACING.xs,
                }}
              >
                CITY / PLACE OF BIRTH
              </Text>
              <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                <TextInput
                  style={[inputStyle, { flex: 1 }]}
                  placeholder="e.g. Hyderabad, Goa, Mumbai"
                  placeholderTextColor={COLORS.textDim}
                  value={place}
                  onChangeText={(t) => {
                    setPlace(t);
                    setGeocodeResult(null);
                    setLat("");
                    setLng("");
                    setSearchAttempted(false);
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
                    <ActivityIndicator size="small" color={COLORS.bg} />
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
              {!geocoding && !geocodeResult && searchAttempted && !lat && (
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

            <View style={{ marginBottom: SPACING.md }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                  letterSpacing: 2,
                  marginBottom: SPACING.xs,
                }}
              >
                YOUR DISPLAY NAME
              </Text>
              <TextInput
                style={inputStyle}
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
                ⚠️ Gender and date of birth cannot be changed after this step
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                gap: SPACING.sm,
              }}
            >
              <Text style={{ fontSize: 18 }}>🌐</Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Type your birth city and tap "Find 📍" to auto-detect
                coordinates. IST (UTC +5:30) is used for Indian birth places.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

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
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.gold,
            borderRadius: RADIUS.lg,
            paddingVertical: SPACING.md + 2,
            alignItems: "center",
            elevation: 8,
            opacity: loading ? 0.6 : 1,
          }}
          onPress={goNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: COLORS.bg,
              }}
            >
              {currentStep < STEPS.length - 1
                ? "Continue →"
                : "Reveal My Nakshatra 🔮"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
