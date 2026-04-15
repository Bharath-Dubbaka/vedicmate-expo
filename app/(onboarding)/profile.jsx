// app/(onboarding)/profile.jsx

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { onboardingAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const GENDERS = [
  { label: "Man", value: "male", emoji: "👨" },
  { label: "Woman", value: "female", emoji: "👩" },
];
const LOOKING_FOR = [
  { label: "Marriage", value: "marriage", emoji: "💍" },
  { label: "Dating", value: "dating", emoji: "💕" },
  { label: "Both", value: "both", emoji: "✨" },
];
const GENDER_PREFS = [
  { label: "Men", value: "male", emoji: "👨" },
  { label: "Women", value: "female", emoji: "👩" },
  { label: "Both", value: "both", emoji: "💫" },
];

export default function ProfileOnboardingScreen() {
  const router = useRouter();
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();

  const [gender, setGender] = useState(null);
  const [lookingFor, setLookingFor] = useState("both");
  const [genderPref, setGenderPref] = useState("both");
  const [bio, setBio] = useState("");
  const [minAge, setMinAge] = useState("22");
  const [maxAge, setMaxAge] = useState("35");
  const [minGuna, setMinGuna] = useState("18");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!gender) {
      Alert.alert("Required", "Please select your gender.");
      return;
    }
    setLoading(true);
    try {
      await onboardingAPI.saveProfile({
        gender,
        bio: bio.trim(),
        lookingFor,
        preferences: {
          minAge: parseInt(minAge) || 18,
          maxAge: parseInt(maxAge) || 45,
          minGunaScore: parseInt(minGuna) ?? 18,
          genderPref,
        },
      });
      router.push("/(onboarding)/cosmic-reveal");
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const chipStyle = (active) => ({
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: active ? COLORS.gold : COLORS.border,
    backgroundColor: active ? COLORS.bgElevated : COLORS.bgCard,
    gap: 4,
    minWidth: 80,
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
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
          STEP 2 OF 3
        </Text>
        <Text
          style={{
            fontFamily: FONTS.heading,
            fontSize: 22,
            color: COLORS.textPrimary,
          }}
        >
          Your Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Gender */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 3,
            marginTop: SPACING.xl,
            marginBottom: SPACING.sm,
          }}
        >
          I AM A
        </Text>
        <View
          style={{ flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" }}
        >
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={chipStyle(gender === g.value)}
              onPress={() => {
                setGender(g.value);
                if (g.value === "male") setGenderPref("female");
                else setGenderPref("male");
              }}
            >
              <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color:
                    gender === g.value ? COLORS.gold : COLORS.textSecondary,
                }}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Looking for */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 3,
            marginTop: SPACING.xl,
            marginBottom: SPACING.sm,
          }}
        >
          LOOKING FOR
        </Text>
        <View
          style={{ flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" }}
        >
          {LOOKING_FOR.map((l) => (
            <TouchableOpacity
              key={l.value}
              style={chipStyle(lookingFor === l.value)}
              onPress={() => setLookingFor(l.value)}
            >
              <Text style={{ fontSize: 22 }}>{l.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color:
                    lookingFor === l.value ? COLORS.gold : COLORS.textSecondary,
                }}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Show me */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 3,
            marginTop: SPACING.xl,
            marginBottom: SPACING.sm,
          }}
        >
          SHOW ME
        </Text>
        <View
          style={{ flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" }}
        >
          {GENDER_PREFS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={chipStyle(genderPref === p.value)}
              onPress={() => setGenderPref(p.value)}
            >
              <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color:
                    genderPref === p.value ? COLORS.gold : COLORS.textSecondary,
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bio */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 3,
            marginTop: SPACING.xl,
            marginBottom: SPACING.sm,
          }}
        >
          BIO (OPTIONAL)
        </Text>
        <TextInput
          style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: SPACING.md,
            height: 100,
            fontFamily: FONTS.body,
            fontSize: 15,
            color: COLORS.textPrimary,
          }}
          placeholder="Tell potential matches about yourself..."
          placeholderTextColor={COLORS.textDim}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={300}
          textAlignVertical="top"
        />
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            color: COLORS.textDim,
            textAlign: "right",
            marginTop: 4,
          }}
        >
          {bio.length}/300
        </Text>

        {/* Age range */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 3,
            marginTop: SPACING.xl,
            marginBottom: SPACING.sm,
          }}
        >
          AGE RANGE
        </Text>
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          {[
            { label: "Min age", val: minAge, set: setMinAge },
            { label: "Max age", val: maxAge, set: setMaxAge },
          ].map((f) => (
            <View key={f.label} style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  marginBottom: 4,
                }}
              >
                {f.label}
              </Text>
              <TextInput
                style={{
                  backgroundColor: COLORS.bgCard,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                  fontFamily: FONTS.bodyBold,
                  fontSize: 18,
                  color: COLORS.gold,
                  textAlign: "center",
                }}
                value={f.val}
                onChangeText={f.set}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          ))}
        </View>

        {/* Min Guna */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: COLORS.gold,
            letterSpacing: 3,
            marginTop: SPACING.xl,
            marginBottom: SPACING.xs,
          }}
        >
          MINIMUM GUNA SCORE
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.textSecondary,
            marginBottom: SPACING.sm,
          }}
        >
          Profiles below this score won't appear in your Discover feed
        </Text>
        <View
          style={{ flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" }}
        >
          {[
            { val: "1", label: "Any" },
            { val: "18", label: "18+" },
            { val: "24", label: "24+" },
            { val: "28", label: "28+" },
            { val: "32", label: "32+" },
          ].map(({ val, label }) => (
            <TouchableOpacity
              key={val}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: minGuna === val ? COLORS.gold : COLORS.border,
                backgroundColor:
                  minGuna === val ? COLORS.bgElevated : COLORS.bgCard,
                minWidth: 50,
              }}
              onPress={() => setMinGuna(val)}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color: minGuna === val ? COLORS.gold : COLORS.textSecondary,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

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
          onPress={handleSubmit}
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
              Continue to Cosmic Reveal 🌟
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
