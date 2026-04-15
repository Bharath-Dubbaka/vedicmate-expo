// app/(tabs)/profile.jsx
//
// Profile screen with editable name, age, bio, and preferences.
// Users can tap "Edit Profile" to update their basic info after signup.

import { useState, useCallback } from "react";
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
import { useTheme } from "../../context/ThemeContext";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "./paywall";
import ThemeToggle from "../../components/ThemeToggle";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const KOOTA_INFO = [
  { key: "nadi", name: "Nadi", emoji: "🌊", max: 8, desc: "Health & genetics" },
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

function BioSection({ bio, onSaved }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
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
      <View
        style={{
          backgroundColor: COLORS.bgElevated,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          borderColor: COLORS.gold,
          padding: SPACING.sm,
        }}
      >
        <TextInput
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: COLORS.textPrimary,
            minHeight: 80,
            padding: SPACING.sm,
          }}
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
            paddingHorizontal: SPACING.sm,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: COLORS.textDim,
            }}
          >
            {value.length}/300
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: RADIUS.sm,
              paddingHorizontal: SPACING.md,
              paddingVertical: 5,
            }}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 13,
                  color: COLORS.bg,
                }}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={{
        backgroundColor: COLORS.bgElevated,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 56,
      }}
      onPress={() => setEditing(true)}
      activeOpacity={0.7}
    >
      {bio ? (
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: COLORS.textPrimary,
            lineHeight: 20,
          }}
        >
          {bio}
        </Text>
      ) : (
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: COLORS.textDim,
            fontStyle: "italic",
          }}
        >
          Tap to add a bio... ✏️
        </Text>
      )}
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 10,
          color: COLORS.textDim,
          marginTop: 6,
          letterSpacing: 1,
        }}
      >
        tap to edit
      </Text>
    </TouchableOpacity>
  );
}

function EditProfileModal({ visible, user, onClose, onSaved }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    try {
      setSaving(true);
      await authAPI.updateMe({ name: name.trim() });
      onSaved({ name: name.trim() });
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
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: SPACING.xl,
            paddingTop: 56,
            paddingBottom: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 16,
                color: COLORS.textSecondary,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: 14,
              color: COLORS.gold,
              letterSpacing: 3,
            }}
          >
            EDIT PROFILE
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: COLORS.gold,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: SPACING.xl }}>
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: SPACING.sm,
              }}
            >
              DISPLAY NAME
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.md,
                fontFamily: FONTS.bodyMedium,
                fontSize: 16,
                color: COLORS.textPrimary,
              }}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={COLORS.textDim}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.textDim,
              textAlign: "center",
              lineHeight: 18,
              paddingHorizontal: SPACING.xl,
            }}
          >
            Only your display name can be changed. Age, gender and birth details
            are permanent.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function EditPrefsModal({ visible, user, onClose, onSaved }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const [minAge, setMinAge] = useState(user?.preferences?.minAge ?? 18);
  const [maxAge, setMaxAge] = useState(user?.preferences?.maxAge ?? 45);
  const [minGuna, setMinGuna] = useState(user?.preferences?.minGunaScore ?? 18);
  const [genderPref, setGenderPref] = useState(
    user?.preferences?.genderPref ?? "female"
  );
  const [lookingFor, setLookingFor] = useState(user?.lookingFor ?? "both");
  const [saving, setSaving] = useState(false);

  const GENDER_OPTIONS = [
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
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: SPACING.xl,
            paddingTop: 56,
            paddingBottom: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 16,
                color: COLORS.textSecondary,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: 14,
              color: COLORS.gold,
              letterSpacing: 3,
            }}
          >
            PREFERENCES
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: COLORS.gold,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: SPACING.xl }}>
          {/* Age range */}
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: 4,
              }}
            >
              AGE RANGE
            </Text>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: 22,
                color: COLORS.textPrimary,
                marginBottom: SPACING.md,
              }}
            >
              {minAge} – {maxAge} yrs
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textSecondary,
                marginBottom: 4,
              }}
            >
              Min: {minAge}
            </Text>
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
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textSecondary,
                marginBottom: 4,
              }}
            >
              Max: {maxAge}
            </Text>
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
          {/* Min Guna */}
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: 4,
              }}
            >
              MINIMUM GUNA SCORE
            </Text>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: 22,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              {minGuna === 1 ? "Any" : `${minGuna} / 36`}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 12,
                color: COLORS.textSecondary,
                marginBottom: SPACING.md,
                fontStyle: "italic",
              }}
            >
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
          {/* Show me */}
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: SPACING.sm,
              }}
            >
              SHOW ME
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.full,
                    borderWidth: 1,
                    borderColor:
                      genderPref === opt.value ? COLORS.gold : COLORS.border,
                    backgroundColor:
                      genderPref === opt.value ? COLORS.gold : "transparent",
                  }}
                  onPress={() => setGenderPref(opt.value)}
                >
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>
                    {opt.emoji}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 13,
                      color:
                        genderPref === opt.value
                          ? COLORS.bg
                          : COLORS.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Looking for */}
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: SPACING.sm,
              }}
            >
              LOOKING FOR
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              {LOOKING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.full,
                    borderWidth: 1,
                    borderColor:
                      lookingFor === opt ? COLORS.gold : COLORS.border,
                    backgroundColor:
                      lookingFor === opt ? COLORS.gold : "transparent",
                  }}
                  onPress={() => setLookingFor(opt)}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 14,
                      color:
                        lookingFor === opt ? COLORS.bg : COLORS.textSecondary,
                    }}
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

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { COLORS, FONTS, SPACING, RADIUS, GANA_CONFIG } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [editPrefs, setEditPrefs] = useState(false);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifLiked, setNotifLiked] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const kundli = user?.kundli;
  const gc = kundli ? GANA_CONFIG[kundli.gana] || GANA_CONFIG.Manushya : null;
  const { isPremium, plan, expiresAt, refresh: refreshPremium } = usePremium();

  useFocusEffect(
    useCallback(() => {
      refreshPremium();
    }, [])
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

  const handleAddPhoto = async () => {
    if ((user.photos?.length ?? 0) >= 3) {
      Alert.alert("Limit reached", "Maximum 3 photos. Delete one first.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
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
      setUploadingPhoto(true);
      try {
        const res = await authAPI.uploadPhoto(formData);
        if (res.data?.success) {
          dispatch(updateUser({ photos: res.data.photos }));
          const meRes = await authAPI.getMe();
          if (meRes.data?.user) dispatch(updateUser(meRes.data.user));
        }
      } catch (err) {
        Alert.alert(
          "Upload failed",
          err?.response?.data?.message || err.message
        );
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleDeletePhoto = (photoUrl) => {
    Alert.alert("Delete Photo", "Remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await authAPI.deletePhoto(photoUrl);
            if (res.data?.success)
              dispatch(updateUser({ photos: res.data.photos }));
          } catch (err) {
            Alert.alert("Error", err?.response?.data?.message || err.message);
          }
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: SPACING.xl,
            paddingTop: 56,
            paddingBottom: SPACING.md,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: 16,
              color: COLORS.gold,
              letterSpacing: 4,
            }}
          >
            PROFILE
          </Text>
        </View>

        {/* Hero card */}
        {kundli && gc && (
          <View
            style={{
              marginHorizontal: SPACING.xl,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: gc.color + "60",
              backgroundColor: COLORS.bgCard,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
            }}
          >
            {/* Top row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.md,
                marginBottom: SPACING.md,
              }}
            >
              <TouchableOpacity
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: COLORS.bgElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: gc.color,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
                onPress={() =>
                  user.photos?.[0]
                    ? handleDeletePhoto(user.photos[0])
                    : handleAddPhoto()
                }
                activeOpacity={0.85}
              >
                {user.photos?.[0] ? (
                  <>
                    <Image
                      source={{ uri: user.photos[0] }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 36,
                      }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: COLORS.gold,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>📷</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        fontFamily: FONTS.headingBold,
                        fontSize: 28,
                        color: gc.color,
                      }}
                    >
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 9,
                        color: COLORS.textDim,
                        position: "absolute",
                        bottom: 4,
                      }}
                    >
                      tap to add
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: FONTS.headingBold,
                    fontSize: 22,
                    color: COLORS.textPrimary,
                  }}
                >
                  {user.name}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.textSecondary,
                  }}
                >
                  {user.email}
                </Text>
                {user.age && (
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    {user.age} years old · {user.gender || "—"}
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: RADIUS.full,
                    borderWidth: 1,
                    borderColor: gc.color + "50",
                    backgroundColor: gc.bg,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{gc.emoji}</Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 12,
                      color: gc.color,
                    }}
                  >
                    {kundli.gana} · {gc.title}
                  </Text>
                </View>
              </View>
            </View>

            {/* Photo grid — 3 slots */}
            <View
              style={{
                flexDirection: "row",
                gap: SPACING.sm,
                marginBottom: SPACING.md,
              }}
            >
              {[0, 1, 2].map((index) => {
                const photo = user.photos?.[index];
                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      flex: 1,
                      height: 100,
                      borderRadius: RADIUS.md,
                      borderWidth: 1.5,
                      overflow: "hidden",
                      backgroundColor: COLORS.bgElevated,
                      borderColor: photo ? gc.color + "60" : COLORS.border,
                    }}
                    onPress={() =>
                      photo ? handleDeletePhoto(photo) : handleAddPhoto()
                    }
                    activeOpacity={0.8}
                  >
                    {photo ? (
                      <>
                        <Image
                          source={{ uri: photo }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: FONTS.bodyBold,
                              fontSize: 11,
                              color: "#fff",
                            }}
                          >
                            ✕
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        {uploadingPhoto &&
                        index === (user.photos?.length ?? 0) ? (
                          <ActivityIndicator size="small" color={COLORS.gold} />
                        ) : (
                          <>
                            <Text
                              style={{
                                fontFamily: FONTS.headingBold,
                                fontSize: 24,
                                color: COLORS.textDim,
                              }}
                            >
                              +
                            </Text>
                            <Text
                              style={{
                                fontFamily: FONTS.body,
                                fontSize: 10,
                                color: COLORS.textDim,
                                letterSpacing: 1,
                              }}
                            >
                              {index === 0 ? "Main" : `Photo ${index + 1}`}
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Edit name button */}
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingVertical: SPACING.sm,
                alignItems: "center",
                marginBottom: SPACING.md,
              }}
              onPress={() => setEditProfile(true)}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                }}
              >
                ✏️ Edit Name
              </Text>
            </TouchableOpacity>

            {/* Nakshatra row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: gc.color + "30",
                backgroundColor: gc.bg,
                padding: SPACING.md,
                marginBottom: SPACING.md,
              }}
            >
              <Text style={{ fontSize: 36 }}>{kundli.nakshatraSymbol}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.headingBold,
                    fontSize: 18,
                    color: COLORS.textPrimary,
                  }}
                >
                  {kundli.nakshatra}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {kundli.rashi} Moon · Pada {kundli.pada}
                </Text>
              </View>
              <View style={{ alignItems: "center", paddingLeft: SPACING.sm }}>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 9,
                    color: COLORS.textDim,
                    letterSpacing: 2,
                  }}
                >
                  LORD
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: 13,
                    color: COLORS.gold,
                  }}
                >
                  {kundli.lordPlanet}
                </Text>
              </View>
            </View>

            {/* Bio */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  letterSpacing: 3,
                }}
              >
                BIO
              </Text>
              <BioSection
                bio={user.bio}
                onSaved={(b) => dispatch(updateUser({ bio: b }))}
              />
            </View>
          </View>
        )}

        {/* Subscription */}
        <View
          style={{
            marginHorizontal: SPACING.xl,
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: SPACING.md,
            }}
          >
            SUBSCRIPTION
          </Text>
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
                    {plan === "annual" ? "Annual" : "Monthly"} · Expires{" "}
                    {expiresAt
                      ? new Date(expiresAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: COLORS.gold + "25",
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

        {/* Cosmic attributes */}
        {kundli && (
          <View
            style={{
              marginHorizontal: SPACING.xl,
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: SPACING.md,
              }}
            >
              COSMIC ATTRIBUTES
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {[
                { emoji: "🐾", label: "Yoni Animal", value: kundli.animal },
                { emoji: "🌊", label: "Nadi", value: kundli.nadi },
                { emoji: "📿", label: "Varna", value: kundli.varna },
                { emoji: "💫", label: "Vashya", value: kundli.vashya },
                { emoji: "🪐", label: "Lord Planet", value: kundli.lordPlanet },
                {
                  emoji: "🌙",
                  label: "Moon °",
                  value: `${kundli.moonLongitude?.toFixed(1)}°`,
                },
              ].map((item, i) => (
                <View
                  key={i}
                  style={{
                    width: "33.33%",
                    alignItems: "center",
                    paddingVertical: SPACING.sm,
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 3 }}>
                    {item.emoji}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: 13,
                      color: COLORS.textPrimary,
                      textAlign: "center",
                    }}
                  >
                    {item.value}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 10,
                      color: COLORS.textDim,
                      textAlign: "center",
                      marginTop: 2,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Koota weights */}
        <View
          style={{
            marginHorizontal: SPACING.xl,
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: 4,
            }}
          >
            ASHTA KOOTA WEIGHTS
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.textSecondary,
              marginBottom: SPACING.md,
            }}
          >
            Maximum points each koota can contribute
          </Text>
          {KOOTA_INFO.map((k, idx) => (
            <View
              key={k.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
                paddingVertical: SPACING.sm,
                borderBottomWidth: idx < KOOTA_INFO.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 14, width: 20 }}>{k.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 12,
                      color: COLORS.textPrimary,
                      width: 88,
                    }}
                  >
                    {k.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      flex: 1,
                    }}
                  >
                    {k.desc}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: 11,
                      color: COLORS.gold,
                    }}
                  >
                    {k.max} pts
                  </Text>
                </View>
                <View
                  style={{
                    height: 3,
                    backgroundColor: COLORS.border,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: 3,
                      width: `${(k.max / 8) * 100}%`,
                      backgroundColor: COLORS.gold,
                      opacity: 0.25 + (k.max / 8) * 0.75,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Preferences */}
        {user.preferences && (
          <View
            style={{
              marginHorizontal: SPACING.xl,
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: SPACING.md,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  letterSpacing: 3,
                }}
              >
                PREFERENCES
              </Text>
              <TouchableOpacity
                onPress={() => setEditPrefs(true)}
                style={{
                  paddingHorizontal: SPACING.sm,
                  paddingVertical: 4,
                  borderRadius: RADIUS.sm,
                  borderWidth: 1,
                  borderColor: COLORS.gold,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: 11,
                    color: COLORS.gold,
                  }}
                >
                  EDIT ✏️
                </Text>
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
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: SPACING.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                  }}
                >
                  {row.label}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: 14,
                    color: COLORS.textPrimary,
                  }}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Settings — Notifications + Theme toggle */}
        <View
          style={{
            marginHorizontal: SPACING.xl,
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: SPACING.md,
            }}
          >
            SETTINGS
          </Text>

          {/* Theme toggle */}
          <ThemeToggle
            style={{
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
              paddingBottom: SPACING.md,
              marginBottom: 4,
            }}
          />

          {/* Notifications */}
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
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: SPACING.sm,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                  }}
                >
                  {row.label}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.textDim,
                    marginTop: 1,
                  }}
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
        <View
          style={{
            marginHorizontal: SPACING.xl,
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: SPACING.sm,
            }}
          >
            ACCOUNT
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: SPACING.sm,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.rose,
              }}
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </Text>
            <Text style={{ color: COLORS.rose, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: SPACING.sm,
            }}
            onPress={() =>
              Alert.alert(
                "Delete Account",
                "Not yet available. Contact support."
              )
            }
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.rose,
                }}
              >
                Delete Account
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.textDim,
                  marginTop: 1,
                }}
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
          VedicFind · v1.3
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
          onSaved={(u) => {
            dispatch(updateUser(u));
            setEditProfile(false);
            Alert.alert("✅ Saved", "Profile updated!");
          }}
        />
      )}
      {user && (
        <EditPrefsModal
          visible={editPrefs}
          user={user}
          onClose={() => setEditPrefs(false)}
          onSaved={(u) => {
            dispatch(updateUser(u));
            setEditPrefs(false);
            Alert.alert("✅ Saved", "Preferences updated!");
          }}
        />
      )}
    </>
  );
}
