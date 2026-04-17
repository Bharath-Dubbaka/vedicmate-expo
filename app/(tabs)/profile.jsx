// app/(tabs)/profile.jsx
//
// Profile screen with editable name, age, bio, and preferences.
// Users can tap "Edit Profile" to update their basic info after signup.

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
  Dimensions,
  TextInput,
  Modal,
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
import BrandHeader from "../../components/BrandHeader";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { rf, rs, rp } from "../../constants/responsive";

const { width: SCREEN_W } = Dimensions.get("window");

// Own Koota attribute cards — rich version with color + description + why it matters
const OWN_KOOTA_INFO = [
  {
    key: "nadi",
    name: "Nadi",
    emoji: "🌊",
    field: "nadi",
    maxPts: 8,
    colorKey: "gold",
    desc: "Body constitution — Vata / Pitta / Kapha",
    why: "Highest weight (8pts). If both partners share same Nadi = 0 pts. Different Nadi = full 8.",
  },
  {
    key: "gana",
    name: "Gana",
    emoji: "✨",
    field: "gana",
    maxPts: 6,
    colorKey: "deva",
    desc: "Soul temperament — Deva / Manushya / Rakshasa",
    why: "Same Gana or compatible pairs score 5-6 pts. Deva+Rakshasa = 0 pts.",
  },
  {
    key: "yoni",
    name: "Yoni",
    emoji: "🐾",
    field: "animal",
    maxPts: 4,
    colorKey: "manushya",
    desc: "Symbolic spirit animal — physical compatibility",
    why: "Friend animal pairs = 4 pts. Enemy pairs = 0. There are 14 yoni animals.",
  },
  {
    key: "vashya",
    name: "Vashya",
    emoji: "💫",
    field: "vashya",
    maxPts: 2,
    colorKey: "teal",
    desc: "Magnetic influence type — attraction pull",
    why: "If one person is naturally in the other's sphere of influence = higher score.",
  },
  {
    key: "varna",
    name: "Varna",
    emoji: "📿",
    field: "varna",
    maxPts: 1,
    colorKey: "gold",
    desc: "Spiritual class — Brahmin / Kshatriya / Vaishya / Shudra",
    why: "Groom's Varna should be equal or higher than Bride's for 1 point.",
  },
];

const GANA_DETAIL = {
  Deva: {
    color: "#A78BFA",
    desc: "Naturally compassionate, spiritually inclined, harmonious.",
  },
  Manushya: {
    color: "#60A5FA",
    desc: "Balanced heart and mind. Practical, warm, loyal.",
  },
  Rakshasa: {
    color: "#F87171",
    desc: "Intense, independent, magnetic. Pairs best with Rakshasa.",
  },
};

const NADI_DETAIL = {
  Vata: { element: "Air", desc: "Quick mind, creative, adaptable." },
  Pitta: { element: "Fire", desc: "Passionate, focused, driven." },
  Kapha: { element: "Water", desc: "Calm, nurturing, steadfast." },
  Antya: { element: "Water", desc: "Ending Nadi — pairs best with Aadi." },
  Madhya: {
    element: "Air",
    desc: "Middle Nadi — pairs best with Antya or Aadi.",
  },
  Aadi: { element: "Fire", desc: "Beginning Nadi — pairs best with Madhya." },
};

// ── Bio inline editor ─────────────────────────────────────────────────────────
function BioSection({ bio, onSaved }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
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
      Alert.alert("Error", err.message);
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
          padding: rp(10),
        }}
      >
        <TextInput
          style={{
            fontFamily: FONTS.body,
            fontSize: rf(14),
            color: COLORS.textPrimary,
            minHeight: rs(80),
            padding: rp(8),
            textAlignVertical: "top",
          }}
          value={value}
          onChangeText={setValue}
          multiline
          maxLength={300}
          autoFocus
          placeholderTextColor={COLORS.textDim}
          placeholder="Tell potential matches about yourself..."
          onBlur={handleSave}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: rp(4),
            paddingHorizontal: rp(8),
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(11),
              color: COLORS.textDim,
            }}
          >
            {value.length}/300
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: RADIUS.sm,
              paddingHorizontal: rp(12),
              paddingVertical: rp(5),
            }}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(13),
                  color: "#fff",
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
        padding: rp(14),
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: rs(56),
      }}
      onPress={() => setEditing(true)}
      activeOpacity={0.7}
    >
      {bio ? (
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: rf(14),
            color: COLORS.textPrimary,
            lineHeight: rf(20),
          }}
        >
          {bio}
        </Text>
      ) : (
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: rf(14),
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
          fontSize: rf(10),
          color: COLORS.textDim,
          marginTop: rp(6),
          letterSpacing: 1,
        }}
      >
        tap to edit
      </Text>
    </TouchableOpacity>
  );
}

// ── Edit Preferences Modal ────────────────────────────────────────────────────
function EditPrefsModal({ visible, user, onClose, onSaved }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const [minAge, setMinAge] = useState(user?.preferences?.minAge ?? 18);
  const [maxAge, setMaxAge] = useState(user?.preferences?.maxAge ?? 45);
  const [minGuna, setMinGuna] = useState(user?.preferences?.minGunaScore ?? 18);
  const [genderPref, setGenderPref] = useState(
    user?.preferences?.genderPref ?? "both"
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
            paddingHorizontal: rp(20),
            paddingTop: rs(56),
            paddingBottom: rp(16),
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(16),
                color: COLORS.textSecondary,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: rf(14),
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
                fontSize: rf(16),
                color: COLORS.gold,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: rp(20) }}>
          {/* Age range */}
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: rp(18),
              marginBottom: rp(16),
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(4),
              }}
            >
              AGE RANGE
            </Text>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(22),
                color: COLORS.textPrimary,
                marginBottom: rp(14),
              }}
            >
              {minAge} – {maxAge} yrs
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(13),
                color: COLORS.textSecondary,
                marginBottom: rp(4),
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
                fontSize: rf(13),
                color: COLORS.textSecondary,
                marginTop: rp(8),
                marginBottom: rp(4),
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
              padding: rp(18),
              marginBottom: rp(16),
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(4),
              }}
            >
              MINIMUM GUNA SCORE
            </Text>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(22),
                color: COLORS.textPrimary,
                marginBottom: rp(6),
              }}
            >
              {minGuna <= 1 ? "Any score" : `${minGuna} / 36`}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(12),
                color: COLORS.textSecondary,
                marginBottom: rp(10),
                fontStyle: "italic",
              }}
            >
              {minGuna <= 1
                ? "⚠️ All profiles appear regardless of score"
                : minGuna < 18
                ? "⚠️ Low — many profiles will appear"
                : minGuna < 24
                ? "✅ Balanced — good starting point"
                : "🌟 High — only strong matches"}
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
              padding: rp(18),
              marginBottom: rp(16),
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(12),
              }}
            >
              SHOW ME
            </Text>
            <View style={{ flexDirection: "row", gap: rp(10) }}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: rp(12),
                    borderRadius: RADIUS.full,
                    borderWidth: 1,
                    borderColor:
                      genderPref === opt.value ? COLORS.gold : COLORS.border,
                    backgroundColor:
                      genderPref === opt.value
                        ? COLORS.gold + "15"
                        : "transparent",
                  }}
                  onPress={() => setGenderPref(opt.value)}
                >
                  <Text style={{ fontSize: rf(20), marginBottom: rp(4) }}>
                    {opt.emoji}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: rf(13),
                      color:
                        genderPref === opt.value
                          ? COLORS.gold
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
              padding: rp(18),
              marginBottom: rp(16),
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(12),
              }}
            >
              LOOKING FOR
            </Text>
            <View style={{ flexDirection: "row", gap: rp(10) }}>
              {LOOKING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: rp(10),
                    borderRadius: RADIUS.full,
                    borderWidth: 1,
                    borderColor:
                      lookingFor === opt ? COLORS.gold : COLORS.border,
                    backgroundColor:
                      lookingFor === opt ? COLORS.gold + "15" : "transparent",
                  }}
                  onPress={() => setLookingFor(opt)}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: rf(14),
                      color:
                        lookingFor === opt ? COLORS.gold : COLORS.textSecondary,
                    }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ height: rp(40) }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { COLORS, FONTS, RADIUS, GANA_CONFIG } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [editPrefs, setEditPrefs] = useState(false);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifLiked, setNotifLiked] = useState(true);

  const kundli = user?.kundli;
  const gc = kundli ? GANA_CONFIG[kundli.gana] || GANA_CONFIG.Manushya : null;
  const gd = kundli ? GANA_DETAIL[kundli.gana] || GANA_DETAIL.Manushya : null;
  const nd = kundli ? NADI_DETAIL[kundli.nadi] || null : null;
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

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      const filename = uri.split("/").pop();
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
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

  if (!user) return null;

  const photoUri = user.photos?.[0];

  const getKootaColor = (colorKey) => {
    const map = {
      gold: COLORS.gold,
      deva: COLORS.deva || "#A78BFA",
      manushya: COLORS.manushya || "#60A5FA",
      teal: COLORS.teal || "#4ECDC4",
    };
    return map[colorKey] || COLORS.gold;
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ paddingBottom: rp(40) }}
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader title="PROFILE" showLogo />

        {/* ── Big Photo Hero ─────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleChangePhoto}
          activeOpacity={0.9}
          style={{
            marginHorizontal: rp(20),
            marginTop: rp(16),
            marginBottom: rp(20),
          }}
        >
          <View
            style={{
              width: "100%",
              height: SCREEN_W * 0.85,
              borderRadius: rs(24),
              overflow: "hidden",
              backgroundColor: gc?.bg || COLORS.bgElevated,
              borderWidth: 1.5,
              borderColor: gc?.color ? gc.color + "60" : COLORS.border,
              shadowColor: gc?.color || COLORS.gold,
              shadowOffset: { width: 0, height: rs(8) },
              shadowOpacity: 0.25,
              shadowRadius: rs(20),
              elevation: 14,
            }}
          >
            {uploadingPhoto ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(14),
                    color: COLORS.textSecondary,
                    marginTop: rs(12),
                  }}
                >
                  Uploading...
                </Text>
              </View>
            ) : photoUri ? (
              <>
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: rp(20),
                    paddingBottom: rp(20),
                    paddingTop: rp(60),
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.headingBold,
                      fontSize: rf(26),
                      color: "#fff",
                      marginBottom: rp(2),
                    }}
                  >
                    {user.name}
                  </Text>
                  {user.age && (
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(14),
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {user.age} · {user.gender || ""}
                    </Text>
                  )}
                  {kundli && gc && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: rs(6),
                        marginTop: rp(8),
                        alignSelf: "flex-start",
                        paddingHorizontal: rp(10),
                        paddingVertical: rp(4),
                        borderRadius: RADIUS.full,
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <Text style={{ fontSize: rf(14) }}>{gc.emoji}</Text>
                      <Text
                        style={{
                          fontFamily: FONTS.bodyMedium,
                          fontSize: rf(12),
                          color: "#fff",
                        }}
                      >
                        {kundli.nakshatra} · {gc.title}
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  style={{
                    position: "absolute",
                    top: rp(14),
                    right: rp(14),
                    width: rs(36),
                    height: rs(36),
                    borderRadius: rs(18),
                    backgroundColor: "rgba(0,0,0,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: rf(18) }}>📷</Text>
                </View>
              </>
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: rs(12),
                }}
              >
                <Text style={{ fontSize: rf(64), opacity: 0.3 }}>👤</Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(16),
                    color: gc?.color || COLORS.gold,
                  }}
                >
                  Add your photo
                </Text>
                <View
                  style={{
                    backgroundColor: gc?.color || COLORS.gold,
                    borderRadius: RADIUS.lg,
                    paddingHorizontal: rp(20),
                    paddingVertical: rp(10),
                    marginTop: rp(8),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: rf(14),
                      color: "#fff",
                    }}
                  >
                    Upload Photo
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: rp(20), marginBottom: rp(16) }}>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(10),
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: rp(8),
            }}
          >
            BIO
          </Text>
          <BioSection
            bio={user.bio}
            onSaved={(b) => dispatch(updateUser({ bio: b }))}
          />
        </View>

        {/* ── Subscription ─────────────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: rp(20),
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: rp(18),
            marginBottom: rp(16),
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(10),
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: rp(14),
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
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: rs(10),
                }}
              >
                <Text style={{ fontSize: rf(24) }}>👑</Text>
                <View>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: rf(15),
                      color: COLORS.gold,
                    }}
                  >
                    VedicFind Premium
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(12),
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
                  paddingHorizontal: rp(10),
                  paddingVertical: rp(4),
                  borderWidth: 1,
                  borderColor: COLORS.gold + "40",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(11),
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
              }}
              onPress={() => setShowPaywall(true)}
              activeOpacity={0.8}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: rs(10),
                }}
              >
                <Text style={{ fontSize: rf(24) }}>⭐</Text>
                <View>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: rf(15),
                      color: COLORS.textPrimary,
                    }}
                  >
                    Free Plan
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(12),
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
                  paddingHorizontal: rp(12),
                  paddingVertical: rp(6),
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: rf(12),
                    color: "#fff",
                  }}
                >
                  Upgrade ✨
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Cosmic Identity ────────────────────────────────────────────────── */}
        {kundli && gc && (
          <View
            style={{
              marginHorizontal: rp(20),
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: gc.color + "40",
              padding: rp(18),
              marginBottom: rp(16),
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(14),
              }}
            >
              COSMIC IDENTITY
            </Text>
            {/* Nakshatra banner */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: rs(12),
                backgroundColor: gc.bg,
                borderRadius: RADIUS.lg,
                padding: rp(14),
                marginBottom: rp(14),
                borderWidth: 1,
                borderColor: gc.color + "30",
              }}
            >
              <Text style={{ fontSize: rf(40) }}>
                {kundli.nakshatraSymbol || "🌟"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.headingBold,
                    fontSize: rf(20),
                    color: COLORS.textPrimary,
                  }}
                >
                  {kundli.nakshatra}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(12),
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {kundli.rashi} Moon · Pada {kundli.pada}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(9),
                    color: COLORS.textDim,
                    letterSpacing: 2,
                  }}
                >
                  LORD
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: rf(14),
                    color: COLORS.gold,
                  }}
                >
                  {kundli.lordPlanet}
                </Text>
              </View>
            </View>
            {/* Attribute chips */}
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: rs(8) }}
            >
              {[
                { emoji: "🐾", label: "Yoni", value: kundli.animal },
                { emoji: "🌊", label: "Nadi", value: kundli.nadi },
                { emoji: "📿", label: "Varna", value: kundli.varna },
                { emoji: "💫", label: "Vashya", value: kundli.vashya },
              ].map((a) => (
                <View
                  key={a.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: rs(5),
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.full,
                    paddingHorizontal: rp(10),
                    paddingVertical: rp(6),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: rf(13) }}>{a.emoji}</Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(11),
                      color: COLORS.textDim,
                    }}
                  >
                    {a.label}:
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: rf(12),
                      color: COLORS.textPrimary,
                    }}
                  >
                    {a.value || "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── MY ASHTA KOOTA ATTRIBUTES — rich cards ──────────────────────── */}
        {kundli && (
          <View
            style={{
              marginHorizontal: rp(20),
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: rp(18),
              marginBottom: rp(16),
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(4),
              }}
            >
              MY ASHTA KOOTA ATTRIBUTES
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(12),
                color: COLORS.textSecondary,
                marginBottom: rp(14),
                lineHeight: rf(18),
              }}
            >
              Your personal cosmic values — used to compute compatibility with
              matches. The "max pts" shown is the maximum that Koota contributes
              in any match.
            </Text>

            <View style={{ gap: rp(10) }}>
              {OWN_KOOTA_INFO.map((k) => {
                const myValue =
                  k.field === "nadi"
                    ? kundli.nadi
                    : k.field === "gana"
                    ? kundli.gana
                    : k.field === "animal"
                    ? kundli.animal
                    : k.field === "vashya"
                    ? kundli.vashya
                    : k.field === "varna"
                    ? kundli.varna
                    : "—";
                const accent = getKootaColor(k.colorKey);

                return (
                  <View
                    key={k.key}
                    style={{
                      backgroundColor: accent + "08",
                      borderRadius: RADIUS.lg,
                      padding: rp(14),
                      borderWidth: 1,
                      borderColor: accent + "30",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: rp(6),
                      }}
                    >
                      <Text style={{ fontSize: rf(20), marginRight: rs(10) }}>
                        {k.emoji}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.bodyMedium,
                          fontSize: rf(15),
                          color: COLORS.textPrimary,
                          flex: 1,
                        }}
                      >
                        {k.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: rs(8),
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: accent + "20",
                            borderRadius: RADIUS.full,
                            paddingHorizontal: rp(10),
                            paddingVertical: rp(4),
                            borderWidth: 1,
                            borderColor: accent + "50",
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: FONTS.bodyBold,
                              fontSize: rf(13),
                              color: accent,
                            }}
                          >
                            {myValue}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: rf(11),
                            color: COLORS.textDim,
                          }}
                        >
                          max {k.maxPts}pts
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(12),
                        color: COLORS.textSecondary,
                        marginBottom: rp(4),
                      }}
                    >
                      {k.desc}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(11),
                        color: COLORS.textDim,
                        fontStyle: "italic",
                        lineHeight: rf(16),
                      }}
                    >
                      {k.why}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View
              style={{
                marginTop: rp(14),
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.md,
                padding: rp(12),
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(13),
                  color: COLORS.textSecondary,
                }}
              >
                Total matching weight
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: rf(18),
                  color: COLORS.gold,
                }}
              >
                36 points
              </Text>
            </View>
          </View>
        )}

        {/* ── Preferences ───────────────────────────────────────────────────── */}
        {user.preferences && (
          <View
            style={{
              marginHorizontal: rp(20),
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: rp(18),
              marginBottom: rp(16),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: rp(14),
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(10),
                  color: COLORS.textDim,
                  letterSpacing: 3,
                }}
              >
                PREFERENCES
              </Text>
              <TouchableOpacity
                onPress={() => setEditPrefs(true)}
                style={{
                  paddingHorizontal: rp(10),
                  paddingVertical: rp(4),
                  borderRadius: RADIUS.sm,
                  borderWidth: 1,
                  borderColor: COLORS.gold,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(11),
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
              {
                label: "Show me",
                value:
                  user.preferences.genderPref === "male"
                    ? "Men"
                    : user.preferences.genderPref === "female"
                    ? "Women"
                    : "Both",
              },
              { label: "Looking for", value: user.lookingFor || "both" },
            ].map((row) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: rp(10),
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(14),
                    color: COLORS.textSecondary,
                  }}
                >
                  {row.label}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(14),
                    color: COLORS.textPrimary,
                  }}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: rp(20),
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: rp(18),
            marginBottom: rp(16),
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(10),
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: rp(10),
            }}
          >
            SETTINGS
          </Text>
          <ThemeToggle
            style={{
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
              paddingBottom: rp(12),
              marginBottom: rp(4),
            }}
          />
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
                paddingVertical: rp(10),
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(14),
                    color: COLORS.textSecondary,
                  }}
                >
                  {row.label}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(11),
                    color: COLORS.textDim,
                    marginTop: rp(1),
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

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: rp(20),
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: rp(18),
            marginBottom: rp(16),
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(10),
              color: COLORS.textDim,
              letterSpacing: 3,
              marginBottom: rp(10),
            }}
          >
            ACCOUNT
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: rp(10),
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(14),
                color: COLORS.rose,
              }}
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </Text>
            <Text style={{ color: COLORS.rose, fontSize: rf(18) }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: rp(10),
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
                  fontSize: rf(14),
                  color: COLORS.rose,
                }}
              >
                Delete Account
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: COLORS.textDim,
                  marginTop: rp(1),
                }}
              >
                This action is permanent
              </Text>
            </View>
            <Text style={{ color: COLORS.rose, fontSize: rf(18) }}>›</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: rf(11),
            color: COLORS.textDim,
            textAlign: "center",
            marginTop: rp(8),
          }}
        >
          VedicFind · v1.4
        </Text>
        <View style={{ height: rp(48) }} />
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
