// components/ProfileViewer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full profile viewer modal — used when premium user taps a profile in
// Liked You / Viewed You tabs. Shows full discover-style profile with
// Send Like button. Fetches compatibility live.
// ─────────────────────────────────────────────────────────────────────────────

// UPDATED: Cosmic Identity — big Nakshatra banner, Rashi Moon, Deity/God, Pada all shown
// UPDATED: Lord Planet + Gana as large icon cards side by side
// UPDATED: Attribute chips larger padding/font
// UPDATED: Ashta Koota cards bigger — more padding, taller bars (7px), larger fonts
// KEPT:    CosmicMatchSheet, name pill on no-photo, gender line
// KEPT:    CosmicMatchSheet, name pill on no-photo, gender line

import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { matchingAPI } from "../services/api";
import { rf, rs, rp } from "../constants/responsive";
import { useRouter } from "expo-router";
import CosmicMatchSheet from "./CosmicMatchSheet";

const { height: SCREEN_H } = Dimensions.get("window");

const KOOTA_LIST = [
  {
    key: "nadi",
    name: "Nadi",
    emoji: "🌊",
    max: 8,
    desc: "Health & body constitution",
  },
  {
    key: "bhakoot",
    name: "Bhakoot",
    emoji: "🌕",
    max: 7,
    desc: "Emotional compatibility",
  },
  { key: "gana", name: "Gana", emoji: "✨", max: 6, desc: "Temperament match" },
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
    desc: "Spiritual alignment",
  },
];

export default function ProfileViewer({ visible, user, onClose, onLiked }) {
  const { COLORS, FONTS, RADIUS, VERDICT_CONFIG, GANA_CONFIG } = useTheme();
  const router = useRouter();
  const [compatData, setCompatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    if (visible && user?._id && !compatData) {
      setLoading(true);
      setLiked(false);
      matchingAPI
        .getCompatibility(user._id)
        .then((res) => {
          if (res.data?.compatibility) setCompatData(res.data.compatibility);
        })
        .catch((err) => console.warn("[PROFILE VIEWER] compat:", err.message))
        .finally(() => setLoading(false));
    }
    if (!visible) {
      setCompatData(null);
      setLiked(false);
      setMatchData(null);
    }
  }, [visible, user?._id]);

  const handleLike = async () => {
    if (!user?._id || liked) return;
    setLiking(true);
    try {
      const res = await matchingAPI.like(user._id);
      setLiked(true);
      if (res.data?.isMatch) {
        setMatchData({
          name: user.name,
          score: res.data.gunaScore ?? compatData?.totalScore ?? 0,
          verdict: res.data.verdict ?? compatData?.verdict ?? "Average Match",
          matchId: res.data.matchId,
        });
      } else {
        onLiked?.();
      }
    } catch (err) {
      console.error("[PROFILE VIEWER] like error:", err.message);
    } finally {
      setLiking(false);
    }
  };

  if (!user) return null;

  const kundli = user.kundli;
  const gana = kundli?.gana;
  const gc = gana ? GANA_CONFIG[gana] || GANA_CONFIG.Manushya : null;
  const vc = compatData
    ? VERDICT_CONFIG[compatData.verdict] || VERDICT_CONFIG["Average Match"]
    : null;
  const pct = compatData ? Math.round((compatData.totalScore / 36) * 100) : 0;

  // deity field — backend may use either key
  const deity = kundli?.deity || kundli?.god || null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: rp(20),
              paddingTop: rs(48),
              paddingBottom: rp(16),
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <TouchableOpacity onPress={onClose} style={{ padding: rp(8) }}>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(22),
                  color: COLORS.textPrimary,
                }}
              >
                ←
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(17),
                color: COLORS.textPrimary,
                marginLeft: rs(8),
                flex: 1,
              }}
            >
              {user.name}
              {user.age ? `, ${user.age}` : ""}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: rp(120) }}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo */}
            <View
              style={{
                width: "100%",
                height: SCREEN_H * 0.45,
                backgroundColor: gc?.bg || COLORS.bgElevated,
              }}
            >
              {user.photos?.[0] ? (
                <Image
                  source={{ uri: user.photos[0] }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: rs(12),
                  }}
                >
                  <Text style={{ fontSize: rf(72), opacity: 0.2 }}>👤</Text>
                  <View
                    style={{
                      paddingHorizontal: rp(16),
                      paddingVertical: rp(8),
                      backgroundColor: gc?.color
                        ? gc.color + "20"
                        : COLORS.bgCard,
                      borderRadius: RADIUS.full,
                      borderWidth: 1,
                      borderColor: gc?.color ? gc.color + "40" : COLORS.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        fontSize: rf(16),
                        color: gc?.color || COLORS.gold,
                      }}
                    >
                      {user.name}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Name + bio */}
            <View
              style={{
                paddingHorizontal: rp(20),
                paddingTop: rp(18),
                paddingBottom: rp(18),
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: rp(8),
                }}
              >
                <View style={{ flex: 1, marginRight: rs(12) }}>
                  <Text
                    style={{
                      fontFamily: FONTS.headingBold,
                      fontSize: rf(26),
                      color: COLORS.textPrimary,
                    }}
                  >
                    {user.name}
                    {user.age ? `, ${user.age}` : ""}
                  </Text>
                  {user.gender ? (
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(14),
                        color: COLORS.textSecondary,
                        marginTop: rp(2),
                      }}
                    >
                      {user.gender}
                    </Text>
                  ) : null}
                </View>
                {gc && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: rs(5),
                      paddingHorizontal: rp(12),
                      paddingVertical: rp(6),
                      borderRadius: RADIUS.full,
                      backgroundColor: gc.bg,
                      borderWidth: 1.5,
                      borderColor: gc.color + "60",
                    }}
                  >
                    <Text style={{ fontSize: rf(14) }}>{gc.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: rf(12),
                        color: gc.color,
                      }}
                    >
                      {gana}
                    </Text>
                  </View>
                )}
              </View>
              {user.bio ? (
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(14),
                    color: COLORS.textSecondary,
                    lineHeight: rf(22),
                  }}
                >
                  {user.bio}
                </Text>
              ) : null}
            </View>

            {/* ── EXPANDED COMPATIBILITY ───────────────────────────────────── */}

            <View
              style={{
                paddingHorizontal: rp(20),
                paddingTop: rp(22),
                paddingBottom: rp(16),
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(10),
                  color: COLORS.textDim,
                  letterSpacing: 3,
                  marginBottom: rp(16),
                }}
              >
                COMPATIBILITY WITH YOU
              </Text>
              {loading ? (
                <View style={{ alignItems: "center", padding: rp(32) }}>
                  <ActivityIndicator color={COLORS.gold} size="large" />
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(13),
                      color: COLORS.textSecondary,
                      marginTop: rs(12),
                    }}
                  >
                    Computing...
                  </Text>
                </View>
              ) : compatData && vc ? (
                <>
                  {/* Score hero */}
                  <View
                    style={{
                      backgroundColor: vc.color + "12",
                      borderRadius: RADIUS.xl,
                      borderWidth: 1.5,
                      borderColor: vc.color + "40",
                      padding: rp(20),
                      flexDirection: "row",
                      alignItems: "center",
                      gap: rs(16),
                      marginBottom: rp(20),
                    }}
                  >
                    <View
                      style={{
                        width: rs(72),
                        height: rs(72),
                        borderRadius: rs(36),
                        borderWidth: 2.5,
                        borderColor: vc.color,
                        backgroundColor: COLORS.bgCard,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.headingBold,
                          fontSize: rf(20),
                          color: vc.color,
                        }}
                      >
                        {pct}%
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          fontSize: rf(19),
                          color: vc.color,
                          marginBottom: rp(4),
                        }}
                      >
                        {vc.emoji} {compatData.verdict}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: rf(14),
                          color: COLORS.textSecondary,
                        }}
                      >
                        {compatData.totalScore}/36 Gunas
                      </Text>
                    </View>
                  </View>
                  {/* Guna Milan explanation */}
                  <View
                    style={{
                      backgroundColor: COLORS.bgElevated,
                      borderRadius: RADIUS.xl,
                      padding: rp(16),
                      marginBottom: rp(14),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        fontSize: rf(13),
                        color: COLORS.textPrimary,
                        marginBottom: rp(6),
                      }}
                    >
                      📜 What is Guna Milan?
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(12),
                        color: COLORS.textSecondary,
                        lineHeight: rf(19),
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          color: COLORS.textPrimary,
                        }}
                      >
                        Ashtakoota Milan
                      </Text>{" "}
                      is the Vedic compatibility system used for thousands of
                      years. Your birth Nakshatra determines 8 cosmic attributes
                      (Kootas). Each Koota is compared between two people to
                      produce a score out of 36 Gunas.{"\n\n"}
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          color: COLORS.textPrimary,
                        }}
                      >
                        This score
                      </Text>{" "}
                      is a pairwise calculation — it changes with every person
                      you view.{" "}
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          color: COLORS.textPrimary,
                        }}
                      >
                        Their Chart
                      </Text>{" "}
                      (after matching) shows their fixed individual attributes
                      used in this calculation.
                    </Text>
                  </View>
                  {/* ── EXPANDED Ashta Koota bars ─────────────────────────── */}
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: COLORS.textDim,
                      letterSpacing: 3,
                      marginBottom: rp(12),
                    }}
                  >
                    ASHTA KOOTA BREAKDOWN
                  </Text>
                  <View style={{ gap: rp(12) }}>
                    {KOOTA_LIST.map((k) => {
                      const entry = compatData.breakdown?.[k.key];
                      const score = entry?.score ?? 0;
                      const maxVal = entry?.max ?? k.max;
                      const detail = entry?.detail ?? "";
                      const isPerfect = score === maxVal;
                      const isZero = score === 0;
                      const barColor = isPerfect
                        ? COLORS.gold
                        : isZero
                        ? COLORS.rose
                        : vc.color;
                      return (
                        <View
                          key={k.key}
                          style={{
                            backgroundColor: COLORS.bgCard,
                            borderRadius: RADIUS.lg,
                            padding: rp(16),
                            borderWidth: 1,
                            borderColor: isPerfect
                              ? COLORS.gold + "40"
                              : isZero
                              ? COLORS.rose + "30"
                              : COLORS.border,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "flex-start",
                              marginBottom: rp(10),
                            }}
                          >
                            <Text
                              style={{
                                fontSize: rf(20),
                                marginRight: rs(10),
                                marginTop: rp(2),
                              }}
                            >
                              {k.emoji}
                            </Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontFamily: FONTS.bodyMedium,
                                  fontSize: rf(15),
                                  color: COLORS.textPrimary,
                                }}
                              >
                                {k.name}
                              </Text>
                              {/* desc subtitle */}
                              <Text
                                style={{
                                  fontFamily: FONTS.body,
                                  fontSize: rf(11),
                                  color: COLORS.textDim,
                                  marginTop: rp(1),
                                }}
                              >
                                {k.desc}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontFamily: FONTS.bodyBold,
                                fontSize: rf(16),
                                color: barColor,
                                marginTop: rp(2),
                              }}
                            >
                              {score}/{maxVal}
                              {isPerfect ? " ✓" : isZero ? " ✕" : ""}
                            </Text>
                          </View>
                          {/* Taller bar — 7px */}
                          <View
                            style={{
                              height: rs(7),
                              backgroundColor: COLORS.bgElevated,
                              borderRadius: 4,
                              overflow: "hidden",
                              marginBottom: detail ? rp(8) : 0,
                            }}
                          >
                            <View
                              style={{
                                height: rs(7),
                                width: `${(score / maxVal) * 100}%`,
                                backgroundColor: barColor,
                                borderRadius: 4,
                              }}
                            />
                          </View>
                          {/* API detail text e.g. "Ashva × Ashva — same yoni" */}
                          {detail ? (
                            <Text
                              style={{
                                fontFamily: FONTS.body,
                                fontSize: rf(12),
                                color: COLORS.textSecondary,
                                fontStyle: "italic",
                                lineHeight: rf(17),
                              }}
                            >
                              {detail}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    padding: rp(24),
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.xl,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(13),
                      color: COLORS.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    Could not compute compatibility. Try again later.
                  </Text>
                </View>
              )}
            </View>

            {/* ── EXPANDED COSMIC IDENTITY ─────────────────────────────────── */}

            {kundli && (
              <View
                style={{
                  paddingHorizontal: rp(20),
                  paddingTop: rp(22),
                  paddingBottom: rp(22),
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(10),
                    color: COLORS.textDim,
                    letterSpacing: 3,
                    marginBottom: rp(16),
                  }}
                >
                  COSMIC IDENTITY
                </Text>
                {/* Their Chart explanation */}
                <View
                  style={{
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.md,
                    padding: rp(12),
                    marginBottom: rp(14),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(12),
                      color: COLORS.textSecondary,
                      lineHeight: rf(18),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        color: COLORS.textPrimary,
                      }}
                    >
                      Their Chart
                    </Text>{" "}
                    shows user's fixed cosmic fingerprint — their Nakshatra,
                    Rashi, Gana, Nadi and other attributes derived at birth.
                    These values were used to compute your Guna Milan score in
                    the Compatibility tab.
                  </Text>
                </View>
                {/* ── Big Nakshatra banner with Rashi + Pada + Deity ──────── */}
                <View
                  style={{
                    backgroundColor: gc?.bg || COLORS.bgElevated,
                    borderRadius: RADIUS.xl,
                    borderWidth: 1.5,
                    borderColor: gc?.color ? gc.color + "50" : COLORS.border,
                    padding: rp(20),
                    marginBottom: rp(14),
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: rs(16),
                    }}
                  >
                    <Text style={{ fontSize: rf(48) }}>
                      {kundli.nakshatraSymbol || "🌟"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      {/* Nakshatra name — largest */}
                      <Text
                        style={{
                          fontFamily: FONTS.headingBold,
                          fontSize: rf(24),
                          color: COLORS.textPrimary,
                        }}
                      >
                        {kundli.nakshatra}
                      </Text>
                      {/* Rashi Moon + Pada */}
                      <Text
                        style={{
                          fontFamily: FONTS.bodyMedium,
                          fontSize: rf(16),
                          color: gc?.color || COLORS.gold,
                          marginTop: rp(3),
                        }}
                      >
                        {kundli.rashi ? `${kundli.rashi} Moon` : ""}
                        {kundli.pada ? `  ·  Pada ${kundli.pada}` : ""}
                      </Text>
                      {/* Deity / God */}
                      {deity ? (
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: rf(13),
                            color: COLORS.textSecondary,
                            marginTop: rp(4),
                          }}
                        >
                          🙏 {deity}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* ── Lord Planet + Gana side-by-side cards ───────────────── */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: rs(10),
                    marginBottom: rp(14),
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.bgElevated,
                      borderRadius: RADIUS.lg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      padding: rp(16),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: rf(28), marginBottom: rp(6) }}>
                      🪐
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        fontSize: rf(17),
                        color: COLORS.gold,
                        textAlign: "center",
                      }}
                    >
                      {kundli.lordPlanet || "—"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(12),
                        color: COLORS.textDim,
                        marginTop: rp(3),
                      }}
                    >
                      Lord Planet
                    </Text>
                  </View>
                  {gc && (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: gc.bg,
                        borderRadius: RADIUS.lg,
                        borderWidth: 1,
                        borderColor: gc.color + "50",
                        padding: rp(16),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: rf(28), marginBottom: rp(6) }}>
                        {gc.emoji}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          fontSize: rf(17),
                          color: gc.color,
                          textAlign: "center",
                        }}
                      >
                        {kundli.gana}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: rf(12),
                          color: COLORS.textDim,
                          marginTop: rp(3),
                        }}
                      >
                        Gana
                      </Text>
                    </View>
                  )}
                </View>

                {/* ── Attribute chips — larger ─────────────────────────────── */}
                <View
                  style={{
                    backgroundColor: COLORS.bgCard,
                    borderRadius: RADIUS.xl,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    overflow: "hidden",
                    marginTop: rp(4),
                  }}
                >
                  {[
                    {
                      emoji: "🌟",
                      label: "Nakshatra",
                      desc: "Birth star",
                      why: "The root of all 8 Koota calculations.",
                      value: kundli.nakshatra || "—",
                    },
                    {
                      emoji: "🌙",
                      label: "Moon Sign",
                      desc: "Rashi — lunar position",
                      why: "Used for Bhakoot Koota (7pts). Certain Rashi combos cause Bhakoot dosha.",
                      value: kundli.rashi || "—",
                    },
                    {
                      emoji: "🔢",
                      label: "Pada",
                      desc: "Quarter of Nakshatra",
                      why: "Refines the Nakshatra position within a 3°20′ arc.",
                      value: kundli.pada ? `Pada ${kundli.pada}` : "—",
                    },
                    {
                      emoji: "✨",
                      label: "Gana",
                      desc: "Soul temperament — Deva / Manushya / Rakshasa",
                      why: "Used for Gana Koota (6pts). Deva + Rakshasa = 0.",
                      value: kundli.gana || "—",
                    },
                    {
                      emoji: "🐾",
                      label: "Yoni Animal",
                      desc: "Symbolic spirit animal",
                      why: "Used for Yoni Koota (4pts). Friend animals = 4, enemies = 0.",
                      value: kundli.animal || "—",
                    },
                    {
                      emoji: "🌊",
                      label: "Nadi",
                      desc: "Body constitution — Vata / Pitta / Kapha",
                      why: "Highest weight (8pts). Same Nadi = 0.",
                      value: kundli.nadi || "—",
                    },
                    {
                      emoji: "📿",
                      label: "Varna",
                      desc: "Spiritual class",
                      why: "Groom Varna ≥ Bride Varna = 1pt.",
                      value: kundli.varna || "—",
                    },
                    {
                      emoji: "💫",
                      label: "Vashya",
                      desc: "Magnetic influence type",
                      why: "Measures natural attraction sphere (2pts).",
                      value: kundli.vashya || "—",
                    },
                    {
                      emoji: "🪐",
                      label: "Lord Planet",
                      desc: "Ruling planet of Nakshatra",
                      why: "Used for Graha Maitri Koota (5pts). Lord planet friendship determines score.",
                      value: kundli.lordPlanet || "—",
                    },
                  ].map((attr, idx, arr) => {
                    const hasValue = attr.value !== "—";
                    return (
                      <View
                        key={attr.label}
                        style={{
                          paddingHorizontal: rp(16),
                          paddingVertical: rp(14),
                          borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                          borderBottomColor: COLORS.border,
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: rf(18),
                            width: rs(28),
                            marginTop: rp(2),
                          }}
                        >
                          {attr.emoji}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.bodyMedium,
                              fontSize: rf(13),
                              color: COLORS.textPrimary,
                            }}
                          >
                            {attr.label}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(11),
                              color: COLORS.textDim,
                              marginTop: rp(1),
                            }}
                          >
                            {attr.desc}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(11),
                              color: COLORS.textSecondary,
                              fontStyle: "italic",
                              marginTop: rp(3),
                              lineHeight: rf(16),
                            }}
                          >
                            {attr.why}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: FONTS.bodyBold,
                            fontSize: rf(14),
                            marginTop: rp(2),
                            color: hasValue
                              ? COLORS.textPrimary
                              : COLORS.textDim,
                          }}
                        >
                          {attr.value}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Fixed bottom — Send Like */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: COLORS.bg,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              paddingHorizontal: rp(20),
              paddingVertical: rp(14),
              paddingBottom: rp(32),
              flexDirection: "row",
              gap: rp(12),
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: RADIUS.lg,
                paddingVertical: rp(14),
                alignItems: "center",
              }}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(15),
                  color: COLORS.textSecondary,
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 2,
                backgroundColor: liked ? COLORS.bgElevated : COLORS.gold,
                borderRadius: RADIUS.lg,
                paddingVertical: rp(14),
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: rs(8),
                opacity: liking ? 0.6 : 1,
                shadowColor: COLORS.gold,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: liked ? 0 : 0.4,
                shadowRadius: 10,
                elevation: liked ? 0 : 8,
              }}
              onPress={handleLike}
              disabled={liking || liked}
              activeOpacity={0.85}
            >
              {liking ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: rf(18) }}>{liked ? "✓" : "✦"}</Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: rf(15),
                      color: liked ? COLORS.textSecondary : "#fff",
                    }}
                  >
                    {liked ? "Like Sent!" : "Send Like"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CosmicMatchSheet
        data={matchData}
        onClose={() => {
          setMatchData(null);
          onClose();
        }}
        onChat={(matchId) => {
          setMatchData(null);
          onClose();
          router.push(`/(tabs)/chat/${matchId}`);
        }}
      />
    </>
  );
}
