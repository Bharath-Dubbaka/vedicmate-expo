// app/(tabs)/profile.jsx
//
// Profile screen with editable name, age, bio, and preferences.
// Users can tap "Edit Profile" to update their basic info after signup.

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
   Switch,
   Image,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser, selectUser } from "../../store/slices/authSlice";
import { disconnectSocket } from "../../services/socket";
import { onboardingAPI, authAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "./paywall";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import * as ImagePicker from "expo-image-picker";

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

// ── Inline bio editor ─────────────────────────────────────────────────────────
function BioSection({ bio, onSaved }) {
   const [editing, setEditing] = useState(false);
   const [value, setValue] = useState(bio || "");
   const [saving, setSaving] = useState(false);

   const handleSave = async () => {
      if (value.trim() === (bio || "").trim()) {
         setEditing(false);
         return;
      }
      try {
         setSaving(true);
         await authAPI.updateMe({ bio: value.trim().slice(0, 300) });
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

// ── Edit basic profile info modal (name, age, gender) ─────────────────────────
function EditProfileModal({ visible, user, onClose, onSaved }) {
   const [name, setName] = useState(user?.name || "");
   const [age, setAge] = useState(String(user?.age || ""));
   const [gender, setGender] = useState(user?.gender || null);
   const [saving, setSaving] = useState(false);

   const GENDERS = [
      { label: "Man", value: "male", emoji: "👨" },
      { label: "Woman", value: "female", emoji: "👩" },
   ];

   const handleSave = async () => {
      if (!name.trim()) {
         Alert.alert("Required", "Please enter your name.");
         return;
      }
      const parsedAge = parseInt(age);
      if (!parsedAge || parsedAge < 18 || parsedAge > 100) {
         Alert.alert(
            "Invalid Age",
            "Please enter a valid age between 18 and 100.",
         );
         return;
      }
      try {
         setSaving(true);
         await authAPI.updateMe({ name: name.trim(), age: parsedAge });
         // If gender changed, save via onboarding/profile (re-save allowed)
         if (gender && gender !== user?.gender) {
            await onboardingAPI.saveProfile({
               gender,
               preferences: user?.preferences,
               lookingFor: user?.lookingFor,
            });
         }
         onSaved({ name: name.trim(), age: parsedAge, gender });
      } catch (err) {
         Alert.alert("Error", err.response?.data?.message || err.message);
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
         <View style={ep.container}>
            <View style={ep.header}>
               <TouchableOpacity onPress={onClose}>
                  <Text style={ep.cancel}>Cancel</Text>
               </TouchableOpacity>
               <Text style={ep.title}>EDIT PROFILE</Text>
               <TouchableOpacity onPress={handleSave} disabled={saving}>
                  <Text style={[ep.save, saving && { opacity: 0.5 }]}>
                     {saving ? "Saving..." : "Save"}
                  </Text>
               </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={ep.scroll}>
               {/* Name */}
               <View style={ep.section}>
                  <Text style={ep.sectionLabel}>DISPLAY NAME</Text>
                  <TextInput
                     style={ep.input}
                     value={name}
                     onChangeText={setName}
                     placeholder="Your name"
                     placeholderTextColor={COLORS.textDim}
                     autoCapitalize="words"
                     maxLength={50}
                  />
               </View>

               {/* Age */}
               <View style={ep.section}>
                  <Text style={ep.sectionLabel}>AGE</Text>
                  <TextInput
                     style={ep.input}
                     value={age}
                     onChangeText={setAge}
                     keyboardType="number-pad"
                     placeholder="Your age"
                     placeholderTextColor={COLORS.textDim}
                     maxLength={3}
                  />
               </View>

               {/* Gender */}
               <View style={ep.section}>
                  <Text style={ep.sectionLabel}>I AM A</Text>
                  <View style={ep.chipRow}>
                     {GENDERS.map((g) => (
                        <TouchableOpacity
                           key={g.value}
                           style={[
                              ep.chip,
                              gender === g.value && ep.chipActive,
                           ]}
                           onPress={() => setGender(g.value)}
                        >
                           <Text style={ep.chipEmoji}>{g.emoji}</Text>
                           <Text
                              style={[
                                 ep.chipText,
                                 gender === g.value && ep.chipTextActive,
                              ]}
                           >
                              {g.label}
                           </Text>
                        </TouchableOpacity>
                     ))}
                  </View>
               </View>

               <Text style={ep.hint}>
                  Birth details (Nakshatra, Rashi) cannot be changed after
                  onboarding. Contact support if you need a correction.
               </Text>

               <View style={{ height: 40 }} />
            </ScrollView>
         </View>
      </Modal>
   );
}

// ── Edit preferences modal ────────────────────────────────────────────────────
function EditPrefsModal({ visible, user, onClose, onSaved }) {
   const [minAge, setMinAge] = useState(user?.preferences?.minAge ?? 18);
   const [maxAge, setMaxAge] = useState(user?.preferences?.maxAge ?? 45);
   const [minGuna, setMinGuna] = useState(
      user?.preferences?.minGunaScore ?? 18,
   );

   const [genderPref, setGenderPref] = useState(
      user?.preferences?.genderPref ?? "female",
   );
   const [lookingFor, setLookingFor] = useState(user?.lookingFor ?? "both");
   const [saving, setSaving] = useState(false);

   const GENDER_PREF_OPTIONS = [
      { label: "Men", value: "male", emoji: "👨" },
      { label: "Women", value: "female", emoji: "👩" },
      { label: "Both", value: "both", emoji: "💫" },
   ];
   const LOOKING_OPTIONS = ["marriage", "dating", "both"];

   const handleSave = async () => {
      if (minAge > maxAge) {
         Alert.alert("Invalid range", "Min age must be less than max age.");
         return;
      }
      try {
         setSaving(true);
         const prefs = { minAge, maxAge, minGunaScore: minGuna, genderPref };
         await onboardingAPI.saveProfile({
            gender: user.gender,
            preferences: prefs,
            lookingFor,
         });
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
                          ? "⚠️ Low — many profiles may appear"
                          : minGuna < 24
                            ? "✅ Balanced baseline"
                            : "🌟 Only strong matches"}
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

               {/* <View style={modal.section}>
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
               </View> */}

               <View style={modal.section}>
                  <Text style={modal.sectionLabel}>SHOW ME</Text>
                  <View style={modal.pills}>
                     {GENDER_PREF_OPTIONS.map((opt) => (
                        <TouchableOpacity
                           key={opt.value}
                           style={[
                              modal.pill,
                              genderPref === opt.value && modal.pillActive,
                           ]}
                           onPress={() => setGenderPref(opt.value)}
                        >
                           <Text style={{ fontSize: 18, marginBottom: 4 }}>
                              {opt.emoji}
                           </Text>
                           <Text
                              style={[
                                 modal.pillText,
                                 genderPref === opt.value &&
                                    modal.pillTextActive,
                              ]}
                           >
                              {opt.label}
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
// Main Profile Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
   const dispatch = useDispatch();
   const user = useSelector(selectUser);

   const [loggingOut, setLoggingOut] = useState(false);
   const [editProfile, setEditProfile] = useState(false);
   const [editPrefs, setEditPrefs] = useState(false);
   const [notifMatch, setNotifMatch] = useState(true);
   const [notifMessage, setNotifMessage] = useState(true);
   const [notifLiked, setNotifLiked] = useState(true);

   const kundli = user?.kundli;
   const gc = kundli ? GANA_CONFIG[kundli.gana] || GANA_CONFIG.Manushya : null;
   const { isPremium, plan, expiresAt, refresh: refreshPremium } = usePremium();
   const [showPaywall, setShowPaywall] = useState(false);

   useFocusEffect(
      useCallback(() => {
         refreshPremium();
      }, []),
   );

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

   const handleProfileSaved = (updates) => {
      dispatch(updateUser(updates));
      setEditProfile(false);
      Alert.alert("✅ Saved", "Your profile has been updated!");
   };

   const handlePrefsSaved = (updates) => {
      dispatch(updateUser(updates));
      setEditPrefs(false);
      Alert.alert("✅ Saved", "Your preferences have been updated!");
   };

   const handleBioSaved = (newBio) => {
      dispatch(updateUser({ bio: newBio }));
   };

   const handlePhotoUpload = async () => {
      const { status } =
         await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
         Alert.alert(
            "Permission needed",
            "Please allow photo access in settings.",
         );
         return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ["images"],
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
         const uri = result.assets[0].uri;
         const filename = uri.split("/").pop();
         const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
         const mimeType =
            ext === "png"
               ? "image/png"
               : ext === "webp"
                 ? "image/webp"
                 : "image/jpeg";

         const formData = new FormData();
         formData.append("photo", { uri, name: filename, type: mimeType });

         try {
            const res = await authAPI.uploadPhoto(formData);
            if (res.data?.success) {
               dispatch(updateUser({ photos: [res.data.photoUrl] }));
               Alert.alert("✅ Photo updated!");
            }
         } catch (err) {
            Alert.alert(
               "Upload failed",
               err?.response?.data?.message || err.message,
            );
         }
      }
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

            {/* Cosmic Hero Card */}
            {kundli && gc && (
               <View style={[s.heroCard, { borderColor: gc.color + "60" }]}>
                  <View style={s.heroTop}>
                     {/* Replace the existing avatar View with this */}
                     <TouchableOpacity
                        style={[
                           s.avatar,
                           { borderColor: gc.color, overflow: "hidden" },
                        ]}
                        onPress={handlePhotoUpload}
                        activeOpacity={0.85}
                     >
                        {user.photos?.[0] ? (
                           <Image
                              source={{ uri: user.photos[0] }}
                              style={{
                                 width: "100%",
                                 height: "100%",
                                 borderRadius: 36,
                              }}
                              resizeMode="cover"
                           />
                        ) : (
                           <>
                              <Text
                                 style={[s.avatarInitial, { color: gc.color }]}
                              >
                                 {user.name?.[0]?.toUpperCase() || "?"}
                              </Text>
                              <Text style={s.avatarEditHint}>tap to add</Text>
                           </>
                        )}
                        {/* Camera overlay when photo exists */}
                        {user.photos?.[0] && (
                           <View style={s.avatarOverlay}>
                              <Text style={{ fontSize: 16 }}>📷</Text>
                           </View>
                        )}
                     </TouchableOpacity>
                     <View style={s.heroNameBlock}>
                        <Text style={s.heroName}>{user.name}</Text>
                        <Text style={s.heroEmail}>{user.email}</Text>
                        {user.age && (
                           <Text style={s.heroAge}>
                              {user.age} years old · {user.gender || "—"}
                           </Text>
                        )}
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

                  {/* Edit profile button */}
                  <TouchableOpacity
                     style={s.editProfileBtn}
                     onPress={() => setEditProfile(true)}
                  >
                     <Text style={s.editProfileBtnText}>
                        ✏️ Edit Name / Age / Gender
                     </Text>
                  </TouchableOpacity>

                  {/* Nakshatra row */}
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

                  {/* Bio */}
                  <View style={s.bioSection}>
                     <Text style={s.bioLabel}>BIO</Text>
                     <BioSection bio={user.bio} onSaved={handleBioSaved} />
                  </View>
               </View>
            )}

            {/* Subscription */}
            <View style={s.card}>
               <Text style={s.cardLabel}>SUBSCRIPTION</Text>
               {isPremium ? (
                  <View
                     style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: SPACING.sm,
                     }}
                  >
                     <View
                        style={{
                           flexDirection: "row",
                           alignItems: "center",
                           gap: SPACING.sm,
                        }}
                     >
                        <Text style={{ fontSize: 24 }}>👑</Text>
                        <View>
                           <Text
                              style={{
                                 fontFamily: FONTS.bodyBold,
                                 fontSize: 15,
                                 color: COLORS.gold,
                              }}
                           >
                              VedicFind Premium
                           </Text>
                           <Text
                              style={{
                                 fontFamily: FONTS.body,
                                 fontSize: 12,
                                 color: COLORS.textSecondary,
                              }}
                           >
                              {plan === "annual" ? "Annual" : "Monthly"} ·
                              Expires{" "}
                              {expiresAt
                                 ? new Date(expiresAt).toLocaleDateString(
                                      "en-IN",
                                      {
                                         day: "numeric",
                                         month: "short",
                                         year: "numeric",
                                      },
                                   )
                                 : "—"}
                           </Text>
                        </View>
                     </View>
                     <View
                        style={{
                           backgroundColor: "rgba(240,192,96,0.15)",
                           borderRadius: RADIUS.full,
                           paddingHorizontal: 10,
                           paddingVertical: 4,
                           borderWidth: 1,
                           borderColor: COLORS.gold + "40",
                        }}
                     >
                        <Text
                           style={{
                              fontFamily: FONTS.bodyMedium,
                              fontSize: 11,
                              color: COLORS.gold,
                           }}
                        >
                           ACTIVE
                        </Text>
                     </View>
                  </View>
               ) : (
                  <TouchableOpacity
                     style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: SPACING.sm,
                     }}
                     onPress={() => setShowPaywall(true)}
                     activeOpacity={0.8}
                  >
                     <View
                        style={{
                           flexDirection: "row",
                           alignItems: "center",
                           gap: SPACING.sm,
                        }}
                     >
                        <Text style={{ fontSize: 24 }}>⭐</Text>
                        <View>
                           <Text
                              style={{
                                 fontFamily: FONTS.bodyMedium,
                                 fontSize: 15,
                                 color: COLORS.textPrimary,
                              }}
                           >
                              Free Plan
                           </Text>
                           <Text
                              style={{
                                 fontFamily: FONTS.body,
                                 fontSize: 12,
                                 color: COLORS.textSecondary,
                              }}
                           >
                              15 swipes/day · Upgrade for unlimited
                           </Text>
                        </View>
                     </View>
                     <View
                        style={{
                           backgroundColor: COLORS.gold,
                           borderRadius: RADIUS.md,
                           paddingHorizontal: 12,
                           paddingVertical: 5,
                        }}
                     >
                        <Text
                           style={{
                              fontFamily: FONTS.bodyBold,
                              fontSize: 12,
                              color: COLORS.bg,
                           }}
                        >
                           Upgrade ✨
                        </Text>
                     </View>
                  </TouchableOpacity>
               )}
            </View>

            {/* Cosmic Attributes */}
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
                     ].map((item, i) => (
                        <View key={i} style={s.statBox}>
                           <Text style={s.statEmoji}>{item.emoji}</Text>
                           <Text style={s.statValue}>{item.value}</Text>
                           <Text style={s.statLabel}>{item.label}</Text>
                        </View>
                     ))}
                  </View>
               </View>
            )}

            {/* Koota Weights */}
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

            {/* Preferences */}
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
                  ].map((row) => (
                     <View key={row.label} style={s.prefRow}>
                        <Text style={s.prefLabel}>{row.label}</Text>
                        <Text style={s.prefValue}>{row.value}</Text>
                     </View>
                  ))}
               </View>
            )}

            {/* Notifications */}
            <View style={s.card}>
               <Text style={s.cardLabel}>NOTIFICATIONS</Text>
               {[
                  {
                     label: "New matches",
                     sub: "Alert on mutual match",
                     val: notifMatch,
                     set: setNotifMatch,
                  },
                  {
                     label: "New messages",
                     sub: "Alert when a match messages",
                     val: notifMessage,
                     set: setNotifMessage,
                  },
                  {
                     label: "Likes",
                     sub: "Alert when someone likes you",
                     val: notifLiked,
                     set: setNotifLiked,
                  },
               ].map((row) => (
                  <View key={row.label} style={s.prefRow}>
                     <View style={{ flex: 1 }}>
                        <Text style={s.prefLabel}>{row.label}</Text>
                        <Text
                           style={[
                              s.prefLabel,
                              {
                                 fontSize: 11,
                                 color: COLORS.textDim,
                                 marginTop: 1,
                              },
                           ]}
                        >
                           {row.sub}
                        </Text>
                     </View>
                     <Switch
                        value={row.val}
                        onValueChange={row.set}
                        trackColor={{ false: COLORS.border, true: COLORS.gold }}
                        thumbColor="#fff"
                     />
                  </View>
               ))}
            </View>

            {/* Account */}
            <View style={s.card}>
               <Text style={s.cardLabel}>ACCOUNT</Text>
               <TouchableOpacity
                  style={s.prefRow}
                  onPress={handleLogout}
                  disabled={loggingOut}
               >
                  <Text style={[s.prefLabel, { color: COLORS.rose }]}>
                     {loggingOut ? "Signing out..." : "Sign Out"}
                  </Text>
                  <Text style={{ color: COLORS.rose, fontSize: 18 }}>›</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={s.prefRow}
                  onPress={() =>
                     Alert.alert(
                        "Delete Account",
                        "Not yet available. Contact support.",
                     )
                  }
               >
                  <View style={{ flex: 1 }}>
                     <Text style={[s.prefLabel, { color: COLORS.rose }]}>
                        Delete Account
                     </Text>
                     <Text
                        style={[
                           s.prefLabel,
                           {
                              fontSize: 11,
                              color: COLORS.textDim,
                              marginTop: 1,
                           },
                        ]}
                     >
                        This action is permanent
                     </Text>
                  </View>
                  <Text style={{ color: COLORS.rose, fontSize: 18 }}>›</Text>
               </TouchableOpacity>
            </View>

            <Text
               style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.textDim,
                  textAlign: "center",
                  marginTop: 8,
               }}
            >
               VedicFind · v1.0
            </Text>
            <View style={{ height: 48 }} />
         </ScrollView>
         <PaywallModal
            visible={showPaywall}
            onClose={() => {
               setShowPaywall(false);
               refreshPremium();
            }}
            triggerReason="default"
         />
         {user && (
            <EditProfileModal
               visible={editProfile}
               user={user}
               onClose={() => setEditProfile(false)}
               onSaved={handleProfileSaved}
            />
         )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
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
   avatarEditHint: {
      fontFamily: FONTS.body,
      fontSize: 9,
      color: COLORS.textDim,
      position: "absolute",
      bottom: 4,
   },
   avatarOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: COLORS.gold,
      alignItems: "center",
      justifyContent: "center",
   },
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
   },
   heroAge: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginBottom: 4,
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
   editProfileBtn: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      marginBottom: SPACING.md,
   },
   editProfileBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
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
   lordValue: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.gold },
   bioSection: { gap: 6 },
   bioLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
   },
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
   statsGrid: { flexDirection: "row", flexWrap: "wrap" },
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

// Edit Profile modal styles
const ep = StyleSheet.create({
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
      marginBottom: SPACING.sm,
   },
   input: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontFamily: FONTS.bodyMedium,
      fontSize: 16,
      color: COLORS.textPrimary,
   },
   chipRow: { flexDirection: "row", gap: SPACING.sm },
   chip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.bgElevated,
   },
   chipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.bgCard },
   chipEmoji: { fontSize: 22, marginBottom: 4 },
   chipText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   chipTextActive: { color: COLORS.gold },
   hint: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textDim,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: SPACING.xl,
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
