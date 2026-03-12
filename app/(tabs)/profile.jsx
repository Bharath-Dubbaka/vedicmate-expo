// app/(tabs)/profile.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN
// Sections:
//   1. Cosmic hero — nakshatra, rashi, gana, bio (inline editable)
//   2. Stats grid  — animal, nadi, varna, vashya, lord, moon°
//   3. Koota weights — each koota's max points explained
//   4. Preferences  — age range, guna min, gender pref, looking for (+ edit modal)
//   5. Logout
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Alert,
   Modal,
   TextInput,
   ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser, selectUser } from "../../store/slices/authSlice";
import { disconnectSocket } from "../../services/socket";
import { onboardingAPI, authAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

// ── Cosmic config ────────────────────────────────────────────────────────────
const GANA_CONFIG = {
   Deva: {
      color: "#A78BFA",
      emoji: "✨",
      title: "Divine Soul",
      bg: "rgba(167,139,250,0.12)",
   },
   Manushya: {
      color: "#60A5FA",
      emoji: "🤝",
      title: "Human Heart",
      bg: "rgba(96,165,250,0.12)",
   },
   Rakshasa: {
      color: "#F87171",
      emoji: "🔥",
      title: "Fierce Spirit",
      bg: "rgba(248,113,113,0.12)",
   },
};

const KOOTA_INFO = [
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

// ── Save preferences via onboarding/profile (re-save allowed) ────────────────
const savePreferences = async (prefs, lookingFor, gender) => {
   return onboardingAPI.saveProfile({ gender, preferences: prefs, lookingFor });
};

// ── Save bio via PATCH /auth/me ───────────────────────────────────────────────
const saveBio = async (bio) => {
   // Calls the new PATCH /api/auth/me route
   // Returns updated user object
   return authAPI.updateMe({ bio: bio.trim().slice(0, 300) });
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE BIO EDITOR
// Tapping the bio area switches it to a TextInput.
// On blur or pressing "Save" it patches the server and updates Redux.
// ─────────────────────────────────────────────────────────────────────────────
function BioSection({ bio, onSaved }) {
   const [editing, setEditing] = useState(false);
   const [value, setValue] = useState(bio || "");
   const [saving, setSaving] = useState(false);

   const handleSave = async () => {
      if (value.trim() === (bio || "").trim()) {
         // No change — just close
         setEditing(false);
         return;
      }
      try {
         setSaving(true);
         await saveBio(value);
         onSaved(value.trim());
         setEditing(false);
      } catch (err) {
         Alert.alert("Error", err.message || "Failed to save bio");
      } finally {
         setSaving(false);
      }
   };

   if (editing) {
      return (
         <View style={bio_s.editWrap}>
            <TextInput
               style={bio_s.input}
               value={value}
               onChangeText={setValue}
               multiline
               maxLength={300}
               autoFocus
               textAlignVertical="top"
               placeholderTextColor={COLORS.textDim}
               placeholder="Tell potential matches about yourself..."
               onBlur={handleSave}
            />
            <View style={bio_s.editRow}>
               <Text style={bio_s.charCount}>{value.length}/300</Text>
               <TouchableOpacity
                  style={bio_s.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
               >
                  {saving ? (
                     <ActivityIndicator size="small" color={COLORS.bg} />
                  ) : (
                     <Text style={bio_s.saveBtnText}>Save</Text>
                  )}
               </TouchableOpacity>
            </View>
         </View>
      );
   }

   return (
      <TouchableOpacity
         style={bio_s.displayWrap}
         onPress={() => setEditing(true)}
         activeOpacity={0.7}
      >
         {bio ? (
            <Text style={bio_s.bioText}>{bio}</Text>
         ) : (
            <Text style={bio_s.bioPlaceholder}>Tap to add a bio... ✏️</Text>
         )}
         <Text style={bio_s.editHint}>tap to edit</Text>
      </TouchableOpacity>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT PREFERENCES MODAL
// Full-screen sheet — age sliders, guna slider, gender pref pills, looking for
// ─────────────────────────────────────────────────────────────────────────────
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
               <Text style={modal.title}>PREFERENCES</Text>
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
                  <Text style={modal.sliderLabel}>Min: {minAge}</Text>
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
                  <Text style={modal.sliderLabel}>Max: {maxAge}</Text>
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

               {/* Min Guna — min=1 so "Any" = 1, never 0 */}
               <View style={modal.section}>
                  <Text style={modal.sectionLabel}>MINIMUM GUNA SCORE</Text>
                  <Text style={modal.sectionValue}>
                     {minGuna === 1 ? "Any" : `${minGuna} / 36`}
                  </Text>
                  <Text style={modal.hint}>
                     {minGuna <= 1
                        ? "⚠️ Any score — all profiles appear"
                        : minGuna < 18
                          ? "⚠️ Low — many incompatible profiles may appear"
                          : minGuna < 24
                            ? "✅ Balanced — good compatibility baseline"
                            : minGuna < 30
                              ? "🌟 High — only strong matches"
                              : "💫 Very high — few profiles will qualify"}
                  </Text>
                  <Slider
                     minimumValue={1}
                     maximumValue={36}
                     step={1}
                     value={minGuna}
                     onValueChange={(v) => setMinGuna(Math.round(v))}
                     minimumTrackTintColor={COLORS.gold}
                     maximumTrackTintColor={COLORS.border}
                     thumbTintColor={COLORS.gold}
                  />
               </View>

               {/* Gender pref */}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROFILE SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
   const dispatch = useDispatch();
   const user = useSelector(selectUser);
   const [loggingOut, setLoggingOut] = useState(false);
   const [editPrefs, setEditPrefs] = useState(false);

   const kundli = user?.kundli;
   const gc = kundli ? GANA_CONFIG[kundli.gana] || GANA_CONFIG.Manushya : null;

   const handleLogout = () => {
      Alert.alert("Sign Out", "Are you sure?", [
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
      dispatch(updateUser(updates));
      setEditPrefs(false);
      Alert.alert("✅ Saved", "Your preferences have been updated!");
   };

   const handleBioSaved = (newBio) => {
      dispatch(updateUser({ bio: newBio }));
   };

   if (!user) return null;

   return (
      <>
         <ScrollView
            style={s.container}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
         >
            {/* ── Header ── */}
            <View style={s.header}>
               <Text style={s.headerTitle}>PROFILE</Text>
            </View>

            {/* ── Cosmic Hero Card ── */}
            {kundli && gc && (
               <View style={[s.heroCard, { borderColor: gc.color + "60" }]}>
                  {/* Top row: avatar + name block */}
                  <View style={s.heroTop}>
                     <View style={[s.avatar, { borderColor: gc.color }]}>
                        <Text style={[s.avatarInitial, { color: gc.color }]}>
                           {user.name?.[0]?.toUpperCase() || "?"}
                        </Text>
                     </View>
                     <View style={s.heroNameBlock}>
                        <Text style={s.heroName}>{user.name}</Text>
                        <Text style={s.heroEmail}>{user.email}</Text>
                        {/* Gana badge */}
                        <View
                           style={[
                              s.ganaBadge,
                              {
                                 backgroundColor: gc.bg,
                                 borderColor: gc.color + "50",
                              },
                           ]}
                        >
                           <Text style={s.ganaEmoji}>{gc.emoji}</Text>
                           <Text style={[s.ganaText, { color: gc.color }]}>
                              {kundli.gana} · {gc.title}
                           </Text>
                        </View>
                     </View>
                  </View>

                  {/* Nakshatra hero row */}
                  <View
                     style={[
                        s.nakshatraRow,
                        {
                           backgroundColor: gc.bg,
                           borderColor: gc.color + "30",
                        },
                     ]}
                  >
                     <Text style={s.nakshatraSymbol}>
                        {kundli.nakshatraSymbol}
                     </Text>
                     <View style={{ flex: 1 }}>
                        <Text style={s.nakshatraName}>{kundli.nakshatra}</Text>
                        <Text style={s.nakshatraRashi}>
                           {kundli.rashi} Moon · Pada {kundli.pada}
                        </Text>
                     </View>
                     <View style={s.lordBadge}>
                        <Text style={s.lordLabel}>LORD</Text>
                        <Text style={s.lordValue}>{kundli.lordPlanet}</Text>
                     </View>
                  </View>

                  {/* Bio — inline editable */}
                  <View style={s.bioSection}>
                     <Text style={s.bioLabel}>BIO</Text>
                     <BioSection bio={user.bio} onSaved={handleBioSaved} />
                  </View>
               </View>
            )}

            {/* ── Stats Grid ── */}
            {kundli && (
               <View style={s.card}>
                  <Text style={s.cardLabel}>COSMIC ATTRIBUTES</Text>
                  <View style={s.statsGrid}>
                     {[
                        {
                           emoji: "🐾",
                           label: "Yoni Animal",
                           value: kundli.animal,
                        },
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
                           value: `${kundli.moonLongitude?.toFixed(1)}°`,
                        },
                     ].map((s_item, i) => (
                        <View key={i} style={s.statBox}>
                           <Text style={s.statEmoji}>{s_item.emoji}</Text>
                           <Text style={s.statValue}>{s_item.value}</Text>
                           <Text style={s.statLabel}>{s_item.label}</Text>
                        </View>
                     ))}
                  </View>
               </View>
            )}

            {/* ── Koota Weights ── */}
            <View style={s.card}>
               <Text style={s.cardLabel}>ASHTA KOOTA WEIGHTS</Text>
               <Text style={s.cardHint}>
                  Maximum points each koota can contribute
               </Text>
               {KOOTA_INFO.map((k, idx) => (
                  <View
                     key={k.key}
                     style={[
                        s.kootaRow,
                        idx < KOOTA_INFO.length - 1 && s.kootaRowBorder,
                     ]}
                  >
                     <Text style={s.kootaEmoji}>{k.emoji}</Text>
                     <View style={{ flex: 1 }}>
                        <View style={s.kootaTopRow}>
                           <Text style={s.kootaName}>{k.name}</Text>
                           <Text style={s.kootaDesc}>{k.desc}</Text>
                           <Text style={s.kootaMax}>{k.max} pts</Text>
                        </View>
                        <View style={s.kootaBarTrack}>
                           <View
                              style={[
                                 s.kootaBarFill,
                                 {
                                    width: `${(k.max / 8) * 100}%`,
                                    backgroundColor: COLORS.gold,
                                    opacity: 0.25 + (k.max / 8) * 0.75,
                                 },
                              ]}
                           />
                        </View>
                     </View>
                  </View>
               ))}
            </View>

            {/* ── Preferences ── */}
            {user.preferences && (
               <View style={s.card}>
                  <View style={s.cardTitleRow}>
                     <Text style={s.cardLabel}>PREFERENCES</Text>
                     <TouchableOpacity
                        onPress={() => setEditPrefs(true)}
                        style={s.editBtn}
                     >
                        <Text style={s.editBtnText}>EDIT ✏️</Text>
                     </TouchableOpacity>
                  </View>
                  {[
                     {
                        label: "Age range",
                        value: `${user.preferences.minAge}–${user.preferences.maxAge} yrs`,
                     },
                     {
                        label: "Min Guna score",
                        value:
                           user.preferences.minGunaScore <= 1
                              ? "Any"
                              : `${user.preferences.minGunaScore}+ / 36`,
                     },
                     { label: "Looking for", value: user.lookingFor || "both" },
                     {
                        label: "Show me",
                        value: user.preferences.genderPref || "both",
                     },
                  ].map((row) => (
                     <View key={row.label} style={s.prefRow}>
                        <Text style={s.prefLabel}>{row.label}</Text>
                        <Text style={s.prefValue}>{row.value}</Text>
                     </View>
                  ))}
               </View>
            )}

            {/* ── Sign Out ── */}
            <TouchableOpacity
               style={s.logoutBtn}
               onPress={handleLogout}
               disabled={loggingOut}
            >
               <Text style={s.logoutText}>
                  {loggingOut ? "Signing out..." : "Sign Out"}
               </Text>
            </TouchableOpacity>

            <View style={{ height: 48 }} />
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

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
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

   // Hero card
   heroCard: {
      marginHorizontal: SPACING.xl,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      backgroundColor: COLORS.bgCard,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
   },
   heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      marginBottom: SPACING.md,
   },
   avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      flexShrink: 0,
   },
   avatarInitial: { fontFamily: FONTS.headingBold, fontSize: 28 },
   heroNameBlock: { flex: 1, gap: 2 },
   heroName: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
   },
   heroEmail: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      marginBottom: 6,
   },
   ganaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      alignSelf: "flex-start",
   },
   ganaEmoji: { fontSize: 13 },
   ganaText: { fontFamily: FONTS.bodyMedium, fontSize: 12 },

   // Nakshatra row
   nakshatraRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      padding: SPACING.md,
      marginBottom: SPACING.md,
   },
   nakshatraSymbol: { fontSize: 36 },
   nakshatraName: {
      fontFamily: FONTS.headingBold,
      fontSize: 18,
      color: COLORS.textPrimary,
   },
   nakshatraRashi: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginTop: 2,
   },
   lordBadge: { alignItems: "center", paddingLeft: SPACING.sm },
   lordLabel: {
      fontFamily: FONTS.body,
      fontSize: 9,
      color: COLORS.textDim,
      letterSpacing: 2,
   },
   lordValue: {
      fontFamily: FONTS.bodyBold,
      fontSize: 13,
      color: COLORS.gold,
   },

   // Bio
   bioSection: { gap: 6 },
   bioLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
   },

   // Shared card
   card: {
      marginHorizontal: SPACING.xl,
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
   },
   cardLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: SPACING.md,
   },
   cardHint: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginTop: -SPACING.sm,
      marginBottom: SPACING.md,
   },
   cardTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
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

   // Stats grid
   statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
   },
   statBox: {
      width: "33.33%",
      alignItems: "center",
      paddingVertical: SPACING.sm,
   },
   statEmoji: { fontSize: 18, marginBottom: 3 },
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
      marginTop: 2,
   },

   // Koota rows
   kootaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
   },
   kootaRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
   kootaEmoji: { fontSize: 14, width: 20 },
   kootaTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
   kootaName: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      color: COLORS.textPrimary,
      width: 88,
   },
   kootaDesc: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
      flex: 1,
   },
   kootaMax: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.gold },
   kootaBarTrack: {
      height: 3,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   kootaBarFill: { height: 3, borderRadius: 2 },

   // Preferences
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

   // Logout
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

// Bio inline editor styles
const bio_s = StyleSheet.create({
   displayWrap: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      minHeight: 56,
   },
   bioText: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textPrimary,
      lineHeight: 20,
   },
   bioPlaceholder: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textDim,
      fontStyle: "italic",
   },
   editHint: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      marginTop: 6,
      letterSpacing: 1,
   },
   editWrap: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.gold,
      padding: SPACING.sm,
   },
   input: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textPrimary,
      minHeight: 80,
      padding: SPACING.sm,
   },
   editRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
      paddingHorizontal: SPACING.sm,
   },
   charCount: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textDim },
   saveBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
   },
   saveBtnText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.bg },
});

// Modal styles
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
      flex: 1,
      alignItems: "center",
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
