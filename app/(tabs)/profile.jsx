// app/(tabs)/profile.jsx
// Added: Edit Preferences modal — tap "EDIT" next to PREFERENCES section
// User can change ageRange, minGunaScore, genderPref, lookingFor and save to server

import { useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Alert,
   Modal,
   Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser, selectUser } from "../../store/slices/authSlice";
import { disconnectSocket } from "../../services/socket";
import { authAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const GANA_CONFIG = {
   Deva: { color: "#A78BFA", emoji: "✨", title: "Divine Soul", bg: "#1E1A3A" },
   Manushya: {
      color: "#60A5FA",
      emoji: "🤝",
      title: "Human Heart",
      bg: "#0F1E3A",
   },
   Rakshasa: {
      color: "#F87171",
      emoji: "🔥",
      title: "Fierce Spirit",
      bg: "#2A0F0F",
   },
};

const KOOTA_NAMES = [
   {
      key: "nadi",
      name: "Nadi",
      emoji: "🌊",
      max: 8,
      desc: "Health & genetics",
   },
   {
      key: "bhakoot",
      name: "Bhakoot",
      emoji: "🌕",
      max: 7,
      desc: "Emotional compatibility",
   },
   { key: "gana", name: "Gana", emoji: "✨", max: 6, desc: "Temperament" },
   {
      key: "grahaMaitri",
      name: "Graha Maitri",
      emoji: "🪐",
      max: 5,
      desc: "Mental compatibility",
   },
   {
      key: "yoni",
      name: "Yoni",
      emoji: "🐾",
      max: 4,
      desc: "Physical compatibility",
   },
   {
      key: "tara",
      name: "Tara",
      emoji: "⭐",
      max: 3,
      desc: "Birth star harmony",
   },
   {
      key: "vashya",
      name: "Vashya",
      emoji: "💫",
      max: 2,
      desc: "Mutual attraction",
   },
   {
      key: "varna",
      name: "Varna",
      emoji: "📿",
      max: 1,
      desc: "Spiritual compatibility",
   },
];

// ── Backend call: save preferences ─────────────────────────────────────────
const savePreferences = async (prefs, lookingFor, gender) => {
   // Uses the same /onboarding/profile endpoint (it allows re-saves)
   const { onboardingAPI } = await import("../../services/api");
   return onboardingAPI.saveProfile({
      gender, // backend requires this field
      preferences: prefs,
      lookingFor,
   });
};

// ── Edit Preferences Modal ──────────────────────────────────────────────────
function EditPrefsModal({ visible, user, onClose, onSaved }) {
   const [minAge, setMinAge] = useState(user?.preferences?.minAge ?? 18);
   const [maxAge, setMaxAge] = useState(user?.preferences?.maxAge ?? 45);
   const [minGuna, setMinGuna] = useState(
      user?.preferences?.minGunaScore ?? 18,
   );
   const [genderPref, setGenderPref] = useState(
      user?.preferences?.genderPref ?? "both",
   );
   const [lookingFor, setLookingFor] = useState(user?.lookingFor ?? "both");
   const [saving, setSaving] = useState(false);

   const GENDER_OPTIONS = ["male", "female", "both"];
   const LOOKING_OPTIONS = ["marriage", "dating", "both"];

   const handleSave = async () => {
      if (minAge > maxAge) {
         Alert.alert("Invalid range", "Min age must be less than max age");
         return;
      }
      try {
         setSaving(true);
         const prefs = { minAge, maxAge, minGunaScore: minGuna, genderPref };
         await savePreferences(prefs, lookingFor, user.gender);
         onSaved({ preferences: prefs, lookingFor });
      } catch (err) {
         Alert.alert("Error", err.message || "Failed to save preferences");
      } finally {
         setSaving(false);
      }
   };

   return (
      <Modal
         visible={visible}
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={onClose}
      >
         <View style={modal.container}>
            <View style={modal.header}>
               <TouchableOpacity onPress={onClose}>
                  <Text style={modal.cancel}>Cancel</Text>
               </TouchableOpacity>
               <Text style={modal.title}>EDIT PREFERENCES</Text>
               <TouchableOpacity onPress={handleSave} disabled={saving}>
                  <Text style={[modal.save, saving && { opacity: 0.5 }]}>
                     {saving ? "Saving..." : "Save"}
                  </Text>
               </TouchableOpacity>
            </View>

            <ScrollView
               style={{ flex: 1 }}
               contentContainerStyle={modal.scroll}
            >
               {/* Age range */}
               <View style={modal.section}>
                  <Text style={modal.sectionLabel}>AGE RANGE</Text>
                  <Text style={modal.sectionValue}>
                     {minAge} – {maxAge} yrs
                  </Text>
                  <Text style={modal.sliderLabel}>Minimum age: {minAge}</Text>
                  <Slider
                     minimumValue={18}
                     maximumValue={maxAge - 1}
                     step={1}
                     value={minAge}
                     onValueChange={(v) => setMinAge(Math.round(v))}
                     minimumTrackTintColor={COLORS.gold}
                     maximumTrackTintColor={COLORS.border}
                     thumbTintColor={COLORS.gold}
                  />
                  <Text style={modal.sliderLabel}>Maximum age: {maxAge}</Text>
                  <Slider
                     minimumValue={minAge + 1}
                     maximumValue={70}
                     step={1}
                     value={maxAge}
                     onValueChange={(v) => setMaxAge(Math.round(v))}
                     minimumTrackTintColor={COLORS.gold}
                     maximumTrackTintColor={COLORS.border}
                     thumbTintColor={COLORS.gold}
                  />
               </View>

               {/* Min Guna score */}
               <View style={modal.section}>
                  <Text style={modal.sectionLabel}>MINIMUM GUNA SCORE</Text>
                  <Text style={modal.sectionValue}>{minGuna} / 36</Text>
                  <Text style={modal.hint}>
                     {minGuna < 18
                        ? "⚠️ Low threshold — many incompatible profiles may appear"
                        : minGuna < 24
                          ? "✅ Balanced — good compatibility baseline"
                          : minGuna < 30
                            ? "🌟 High standard — only strong matches"
                            : "💫 Very high — few profiles will qualify"}
                  </Text>
                  <Slider
                     minimumValue={0}
                     maximumValue={36}
                     step={1}
                     value={minGuna}
                     onValueChange={(v) => setMinGuna(Math.round(v))}
                     minimumTrackTintColor={COLORS.gold}
                     maximumTrackTintColor={COLORS.border}
                     thumbTintColor={COLORS.gold}
                  />
               </View>

               {/* Gender preference */}
               <View style={modal.section}>
                  <Text style={modal.sectionLabel}>SHOW ME</Text>
                  <View style={modal.pills}>
                     {GENDER_OPTIONS.map((opt) => (
                        <TouchableOpacity
                           key={opt}
                           style={[
                              modal.pill,
                              genderPref === opt && modal.pillActive,
                           ]}
                           onPress={() => setGenderPref(opt)}
                        >
                           <Text
                              style={[
                                 modal.pillText,
                                 genderPref === opt && modal.pillTextActive,
                              ]}
                           >
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                           </Text>
                        </TouchableOpacity>
                     ))}
                  </View>
               </View>

               {/* Looking for */}
               <View style={modal.section}>
                  <Text style={modal.sectionLabel}>LOOKING FOR</Text>
                  <View style={modal.pills}>
                     {LOOKING_OPTIONS.map((opt) => (
                        <TouchableOpacity
                           key={opt}
                           style={[
                              modal.pill,
                              lookingFor === opt && modal.pillActive,
                           ]}
                           onPress={() => setLookingFor(opt)}
                        >
                           <Text
                              style={[
                                 modal.pillText,
                                 lookingFor === opt && modal.pillTextActive,
                              ]}
                           >
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                           </Text>
                        </TouchableOpacity>
                     ))}
                  </View>
               </View>

               <View style={{ height: 40 }} />
            </ScrollView>
         </View>
      </Modal>
   );
}

// ── Main Profile Screen ─────────────────────────────────────────────────────
export default function ProfileScreen() {
   const dispatch = useDispatch();
   const user = useSelector(selectUser);
   const [loggingOut, setLoggingOut] = useState(false);
   const [editPrefs, setEditPrefs] = useState(false);

   console.log("[PROFILE] Rendering profile for:", user?.email);

   const handleLogout = () => {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
         { text: "Cancel", style: "cancel" },
         {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
               setLoggingOut(true);
               disconnectSocket();
               await dispatch(logout());
            },
         },
      ]);
   };

   const handlePrefsSaved = (updates) => {
      dispatch(updateUser(updates)); // update Redux immediately for instant UI refresh
      setEditPrefs(false);
      Alert.alert("✅ Saved", "Your preferences have been updated!");
   };

   const kundli = user?.kundli;
   const gc = kundli ? GANA_CONFIG[kundli.gana] || GANA_CONFIG.Manushya : null;

   return (
      <>
         <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
         >
            <View style={styles.header}>
               <Text style={styles.headerTitle}>PROFILE</Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
               <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                     {user?.name?.[0]?.toUpperCase() || "?"}
                  </Text>
               </View>
               <Text style={styles.userName}>{user?.name}</Text>
               <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            {/* Cosmic Identity Card */}
            {kundli && gc && (
               <View style={[styles.cosmicCard, { borderColor: gc.color }]}>
                  <Text style={styles.cosmicCardTitle}>
                     YOUR COSMIC IDENTITY
                  </Text>
                  <View style={styles.nakshatraHero}>
                     <Text style={styles.nakshatraSymbol}>
                        {kundli.nakshatraSymbol}
                     </Text>
                     <View>
                        <Text style={styles.nakshatraName}>
                           {kundli.nakshatra}
                        </Text>
                        <Text style={styles.nakshatraRashi}>
                           {kundli.rashi} Moon · Pada {kundli.pada}
                        </Text>
                     </View>
                  </View>
                  <View style={[styles.ganaBadge, { backgroundColor: gc.bg }]}>
                     <Text style={styles.ganaEmoji}>{gc.emoji}</Text>
                     <Text style={[styles.ganaTitle, { color: gc.color }]}>
                        {kundli.gana} — {gc.title}
                     </Text>
                  </View>
                  <View style={styles.statsGrid}>
                     {[
                        { emoji: "🐾", label: "Yoni", value: kundli.animal },
                        { emoji: "🌊", label: "Nadi", value: kundli.nadi },
                        { emoji: "📿", label: "Varna", value: kundli.varna },
                        { emoji: "💫", label: "Vashya", value: kundli.vashya },
                        {
                           emoji: "🪐",
                           label: "Lord Planet",
                           value: kundli.lordPlanet,
                        },
                        {
                           emoji: "🌙",
                           label: "Moon °",
                           value: `${kundli.moonLongitude?.toFixed(2)}°`,
                        },
                     ].map((s, i) => (
                        <View key={i} style={styles.statBox}>
                           <Text style={styles.statEmoji}>{s.emoji}</Text>
                           <Text style={styles.statValue}>{s.value}</Text>
                           <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                     ))}
                  </View>
                  <Text style={styles.kootaTitle}>KOOTA WEIGHTS</Text>
                  {KOOTA_NAMES.map((k) => (
                     <View key={k.key} style={styles.kootaRow}>
                        <Text style={styles.kootaEmoji}>{k.emoji}</Text>
                        <View style={{ flex: 1 }}>
                           <View style={styles.kootaRowHeader}>
                              <Text style={styles.kootaName}>{k.name}</Text>
                              <Text style={styles.kootaDesc}>{k.desc}</Text>
                              <Text style={styles.kootaMax}>{k.max} pts</Text>
                           </View>
                           <View style={styles.kootaBarTrack}>
                              <View
                                 style={[
                                    styles.kootaBarFill,
                                    {
                                       width: `${(k.max / 8) * 100}%`,
                                       backgroundColor: COLORS.gold,
                                       opacity: 0.3 + (k.max / 8) * 0.7,
                                    },
                                 ]}
                              />
                           </View>
                        </View>
                     </View>
                  ))}
               </View>
            )}

            {/* Preferences */}
            {user?.preferences && (
               <View style={styles.prefsCard}>
                  <View style={styles.prefsTitleRow}>
                     <Text style={styles.prefsTitle}>PREFERENCES</Text>
                     <TouchableOpacity
                        onPress={() => setEditPrefs(true)}
                        style={styles.editBtn}
                     >
                        <Text style={styles.editBtnText}>EDIT ✏️</Text>
                     </TouchableOpacity>
                  </View>
                  {[
                     {
                        label: "Age range",
                        value: `${user.preferences.minAge}–${user.preferences.maxAge} yrs`,
                     },
                     {
                        label: "Min Guna score",
                        value: `${user.preferences.minGunaScore}+ / 36`,
                     },
                     { label: "Looking for", value: user.lookingFor || "both" },
                     {
                        label: "Gender pref",
                        value: user.preferences.genderPref || "both",
                     },
                  ].map((row) => (
                     <View key={row.label} style={styles.prefRow}>
                        <Text style={styles.prefLabel}>{row.label}</Text>
                        <Text style={styles.prefValue}>{row.value}</Text>
                     </View>
                  ))}
               </View>
            )}

            <TouchableOpacity
               style={styles.logoutBtn}
               onPress={handleLogout}
               disabled={loggingOut}
            >
               <Text style={styles.logoutText}>
                  {loggingOut ? "Signing out..." : "Sign Out"}
               </Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
         </ScrollView>

         {/* Edit Preferences Modal */}
         {user && (
            <EditPrefsModal
               visible={editPrefs}
               user={user}
               onClose={() => setEditPrefs(false)}
               onSaved={handlePrefsSaved}
            />
         )}
      </>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   scroll: { paddingBottom: 40 },
   header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: 56,
      paddingBottom: SPACING.md,
   },
   headerTitle: {
      fontFamily: FONTS.headingBold,
      fontSize: 16,
      color: COLORS.gold,
      letterSpacing: 4,
   },
   avatarSection: { alignItems: "center", paddingVertical: SPACING.xl },
   avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.md,
      borderWidth: 2,
      borderColor: COLORS.gold,
   },
   avatarInitial: {
      fontFamily: FONTS.headingBold,
      fontSize: 32,
      color: COLORS.gold,
   },
   userName: {
      fontFamily: FONTS.heading,
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: 4,
   },
   userEmail: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   cosmicCard: {
      marginHorizontal: SPACING.xl,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      backgroundColor: COLORS.bgCard,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
   },
   cosmicCardTitle: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: SPACING.lg,
   },
   nakshatraHero: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      marginBottom: SPACING.md,
   },
   nakshatraSymbol: { fontSize: 48 },
   nakshatraName: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
   },
   nakshatraRashi: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   ganaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.lg,
      alignSelf: "flex-start",
   },
   ganaEmoji: { fontSize: 16 },
   ganaTitle: { fontFamily: FONTS.bodyMedium, fontSize: 13 },
   statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: SPACING.lg,
   },
   statBox: {
      width: "33.33%",
      alignItems: "center",
      paddingVertical: SPACING.sm,
   },
   statEmoji: { fontSize: 18, marginBottom: 2 },
   statValue: {
      fontFamily: FONTS.bodyBold,
      fontSize: 13,
      color: COLORS.textPrimary,
      textAlign: "center",
   },
   statLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      textAlign: "center",
   },
   kootaTitle: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 2,
      marginBottom: SPACING.md,
   },
   kootaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
   },
   kootaEmoji: { fontSize: 14, width: 20 },
   kootaRowHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
   },
   kootaName: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      color: COLORS.textPrimary,
      width: 80,
   },
   kootaDesc: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
      flex: 1,
   },
   kootaMax: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.gold },
   kootaBarTrack: {
      height: 4,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   kootaBarFill: { height: 4, borderRadius: 2 },
   prefsCard: {
      marginHorizontal: SPACING.xl,
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   prefsTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
   },
   prefsTitle: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
   },
   editBtn: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: COLORS.gold,
   },
   editBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 11,
      color: COLORS.gold,
   },
   prefRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   prefLabel: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   prefValue: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textPrimary,
   },
   logoutBtn: {
      marginHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.rose,
      alignItems: "center",
   },
   logoutText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 15,
      color: COLORS.rose,
   },
});

const modal = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
      paddingTop: 56,
      paddingBottom: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   title: {
      fontFamily: FONTS.headingBold,
      fontSize: 14,
      color: COLORS.gold,
      letterSpacing: 3,
   },
   cancel: {
      fontFamily: FONTS.body,
      fontSize: 16,
      color: COLORS.textSecondary,
   },
   save: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.gold },
   scroll: { padding: SPACING.xl },
   section: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   sectionLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: 4,
   },
   sectionValue: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: SPACING.md,
   },
   sliderLabel: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      marginBottom: 4,
   },
   hint: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginBottom: SPACING.md,
      fontStyle: "italic",
   },
   pills: {
      flexDirection: "row",
      gap: SPACING.sm,
      flexWrap: "wrap",
      marginTop: SPACING.sm,
   },
   pill: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   pillActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
   pillText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   pillTextActive: { color: COLORS.bg },
});
