// app/(onboarding)/profile.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SETUP — Gender, bio, preferences
// 100% live API — no mocks
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   TextInput,
   ScrollView,
   Alert,
   ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { onboardingAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const GENDERS = [
   { label: "Man", value: "male", emoji: "👨" },
   { label: "Woman", value: "female", emoji: "👩" },
   { label: "Other", value: "other", emoji: "🌈" },
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
         const payload = {
            gender,
            bio: bio.trim(),
            lookingFor,
            preferences: {
               minAge: parseInt(minAge) || 18,
               maxAge: parseInt(maxAge) || 45,
               minGunaScore: parseInt(minGuna) || 18,
               genderPref,
            },
         };

         console.log("[PROFILE ONBOARDING] Saving profile:", payload);
         await onboardingAPI.saveProfile(payload);
         console.log(
            "[PROFILE ONBOARDING] Saved — navigating to cosmic-reveal",
         );

         router.push("/(onboarding)/cosmic-reveal");
      } catch (err) {
         console.error(
            "[PROFILE ONBOARDING] Error:",
            err.response?.data || err.message,
         );
         Alert.alert(
            "Error",
            err?.response?.data?.message ||
               err.message ||
               "Something went wrong",
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
            <Text style={styles.stepTitle}>Your Profile</Text>
         </View>

         <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
         >
            {/* Gender */}
            <Text style={styles.sectionLabel}>I AM A</Text>
            <View style={styles.chipRow}>
               {GENDERS.map((g) => (
                  <TouchableOpacity
                     key={g.value}
                     style={[
                        styles.chip,
                        gender === g.value && styles.chipActive,
                     ]}
                     onPress={() => setGender(g.value)}
                  >
                     <Text style={styles.chipEmoji}>{g.emoji}</Text>
                     <Text
                        style={[
                           styles.chipText,
                           gender === g.value && styles.chipTextActive,
                        ]}
                     >
                        {g.label}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            {/* Looking for */}
            <Text style={styles.sectionLabel}>LOOKING FOR</Text>
            <View style={styles.chipRow}>
               {LOOKING_FOR.map((l) => (
                  <TouchableOpacity
                     key={l.value}
                     style={[
                        styles.chip,
                        lookingFor === l.value && styles.chipActive,
                     ]}
                     onPress={() => setLookingFor(l.value)}
                  >
                     <Text style={styles.chipEmoji}>{l.emoji}</Text>
                     <Text
                        style={[
                           styles.chipText,
                           lookingFor === l.value && styles.chipTextActive,
                        ]}
                     >
                        {l.label}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            {/* Show me */}
            <Text style={styles.sectionLabel}>SHOW ME</Text>
            <View style={styles.chipRow}>
               {GENDER_PREFS.map((p) => (
                  <TouchableOpacity
                     key={p.value}
                     style={[
                        styles.chip,
                        genderPref === p.value && styles.chipActive,
                     ]}
                     onPress={() => setGenderPref(p.value)}
                  >
                     <Text style={styles.chipEmoji}>{p.emoji}</Text>
                     <Text
                        style={[
                           styles.chipText,
                           genderPref === p.value && styles.chipTextActive,
                        ]}
                     >
                        {p.label}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            {/* Bio */}
            <Text style={styles.sectionLabel}>BIO (OPTIONAL)</Text>
            <TextInput
               style={styles.bioInput}
               placeholder="Tell potential matches about yourself..."
               placeholderTextColor={COLORS.textDim}
               value={bio}
               onChangeText={setBio}
               multiline
               maxLength={300}
               textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>

            {/* Age range */}
            <Text style={styles.sectionLabel}>AGE RANGE</Text>
            <View style={styles.row}>
               <View
                  style={[
                     styles.inputGroup,
                     { flex: 1, marginRight: SPACING.sm },
                  ]}
               >
                  <Text style={styles.inputLabel}>Min age</Text>
                  <TextInput
                     style={styles.numInput}
                     value={minAge}
                     onChangeText={setMinAge}
                     keyboardType="number-pad"
                     maxLength={2}
                  />
               </View>
               <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Max age</Text>
                  <TextInput
                     style={styles.numInput}
                     value={maxAge}
                     onChangeText={setMaxAge}
                     keyboardType="number-pad"
                     maxLength={2}
                  />
               </View>
            </View>

            {/* Min Guna score */}
            <Text style={styles.sectionLabel}>MINIMUM GUNA SCORE</Text>
            <Text style={styles.sectionHint}>
               Profiles below this score won't appear in your Discover feed
            </Text>
            <View style={styles.chipRow}>
               {[
                  { val: "0", label: "Any" },
                  { val: "18", label: "18+" },
                  { val: "24", label: "24+" },
                  { val: "28", label: "28+" },
                  { val: "32", label: "32+" },
               ].map(({ val, label }) => (
                  <TouchableOpacity
                     key={val}
                     style={[
                        styles.gunaBtn,
                        minGuna === val && styles.gunaBtnActive,
                     ]}
                     onPress={() => setMinGuna(val)}
                  >
                     <Text
                        style={[
                           styles.gunaBtnText,
                           minGuna === val && styles.gunaBtnTextActive,
                        ]}
                     >
                        {label}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            <View style={{ height: 120 }} />
         </ScrollView>

         <View style={styles.footer}>
            <TouchableOpacity
               style={[styles.nextBtn, loading && { opacity: 0.6 }]}
               onPress={handleSubmit}
               disabled={loading}
            >
               {loading ? (
                  <ActivityIndicator color={COLORS.bg} />
               ) : (
                  <Text style={styles.nextBtnText}>
                     Continue to Cosmic Reveal 🌟
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
   },
   body: { paddingHorizontal: SPACING.xl },
   sectionLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.gold,
      letterSpacing: 3,
      marginTop: SPACING.xl,
      marginBottom: SPACING.sm,
   },
   sectionHint: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginBottom: SPACING.sm,
      marginTop: -SPACING.xs,
   },
   chipRow: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
   chip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.bgCard,
      gap: 4,
      minWidth: 80,
   },
   chipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.bgElevated },
   chipEmoji: { fontSize: 22 },
   chipText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   chipTextActive: { color: COLORS.gold },
   bioInput: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.md,
      height: 100,
      fontFamily: FONTS.body,
      fontSize: 15,
      color: COLORS.textPrimary,
   },
   charCount: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
      textAlign: "right",
      marginTop: 4,
   },
   row: { flexDirection: "row" },
   inputGroup: { marginBottom: SPACING.sm },
   inputLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
      marginBottom: 4,
   },
   numInput: {
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
   },
   gunaBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.bgCard,
      minWidth: 50,
   },
   gunaBtnActive: {
      borderColor: COLORS.gold,
      backgroundColor: COLORS.bgElevated,
   },
   gunaBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   gunaBtnTextActive: { color: COLORS.gold },
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
