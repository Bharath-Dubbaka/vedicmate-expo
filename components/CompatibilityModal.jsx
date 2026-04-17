// components/CompatibilityModal.jsx
// Shared modal — works for discover profiles AND matched users
// Profile shape from discover: { user, compatibility }
// Profile shape from matches: { name, nakshatra, gunaScore, verdict, gana, animal, nadi, rashi, pada, lordPlanet, breakdown, doshas, highlights }

// Shared modal — works for discover profiles AND matched users.
// Now theme-aware.
// FIX: No more "Full compatibility breakdown available after matching"
// If profile has a userId, we fetch live from /api/matching/compatibility/:userId
// This works for already-matched users too — the API doesn't require being matched.
// Also works for discover profile taps.

import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { matchingAPI } from "../services/api";
import { rf, rs, rp } from "../constants/responsive";

const KOOTA_LIST = [
  { key: "nadi", name: "Nadi", emoji: "🌊", max: 8 },
  { key: "bhakoot", name: "Bhakoot", emoji: "🌕", max: 7 },
  { key: "gana", name: "Gana", emoji: "✨", max: 6 },
  { key: "grahaMaitri", name: "Graha Maitri", emoji: "🪐", max: 5 },
  { key: "yoni", name: "Yoni", emoji: "🐾", max: 4 },
  { key: "tara", name: "Tara", emoji: "⭐", max: 3 },
  { key: "vashya", name: "Vashya", emoji: "💫", max: 2 },
  { key: "varna", name: "Varna", emoji: "📿", max: 1 },
];

// Normalize profile data from different sources (discover card, match object, etc.)
function normalizeProfile(profile) {
  if (!profile) return null;
  // From match object (matches tab)
  if (profile.gunaScore !== undefined || profile.userId) {
    return {
      name: profile.name,
      userId: profile.userId,
      nakshatra: profile.nakshatra,
      totalScore: profile.gunaScore,
      verdict: profile.verdict,
      breakdown: null, // will be fetched live
    };
  }
  // From discover profile card (has user + compatibility)
  if (profile.user && profile.compatibility) {
    return {
      name: profile.user.name,
      userId: profile.user.id,
      nakshatra: profile.user.cosmicCard?.nakshatra,
      totalScore: profile.compatibility.totalScore,
      verdict: profile.compatibility.verdict,
      breakdown: profile.compatibility.breakdown,
      doshas: profile.compatibility.doshas,
      highlights: profile.compatibility.highlights,
    };
  }
  // Direct profile object
  return {
    name: profile.name,
    userId: profile.userId || profile._id,
    nakshatra: profile.nakshatra || profile.kundli?.nakshatra,
    totalScore: profile.gunaScore ?? profile.totalScore,
    verdict: profile.verdict,
    breakdown: profile.breakdown,
    doshas: profile.doshas,
    highlights: profile.highlights,
  };
}

export default function CompatibilityModal({ visible, profile, onClose }) {
  const { COLORS, FONTS, RADIUS, VERDICT_CONFIG, GANA_CONFIG } = useTheme();
  const [liveData, setLiveData] = useState(null);
  const [fetching, setFetching] = useState(false);

  const data = normalizeProfile(profile);

  useEffect(() => {
    // If we have a userId and no breakdown yet, fetch live
    if (visible && data?.userId && !data?.breakdown && !liveData) {
      setFetching(true);
      matchingAPI
        .getCompatibility(data.userId)
        .then((res) => {
          if (res.data?.compatibility) setLiveData(res.data.compatibility);
        })
        .catch((err) =>
          console.warn("[COMPAT MODAL] fetch error:", err.message)
        )
        .finally(() => setFetching(false));
    }
    if (!visible) setLiveData(null);
  }, [visible, data?.userId]);

  if (!data) return null;

  // Merge: live data takes priority over passed-in data
  const compat =
    liveData ||
    (data.breakdown
      ? {
          totalScore: data.totalScore,
          verdict: data.verdict,
          breakdown: data.breakdown,
          doshas: data.doshas,
          highlights: data.highlights,
        }
      : null);

  const vc = compat
    ? VERDICT_CONFIG[compat.verdict] || VERDICT_CONFIG["Average Match"]
    : null;
  const pct = compat ? Math.round((compat.totalScore / 36) * 100) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Handle */}
        <View
          style={{
            width: rs(40),
            height: rs(4),
            backgroundColor: COLORS.border,
            borderRadius: 2,
            alignSelf: "center",
            marginTop: rp(12),
            marginBottom: rp(4),
          }}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: rp(20) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: rp(16),
            }}
          >
            <View style={{ flex: 1, marginRight: rp(12) }}>
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: rf(22),
                  color: COLORS.textPrimary,
                  marginBottom: 2,
                }}
              >
                {data.name}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(13),
                  color: COLORS.textSecondary,
                }}
              >
                {data.nakshatra || "—"}
              </Text>
            </View>
            {compat && vc && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: rs(5),
                  borderWidth: 1.5,
                  borderRadius: RADIUS.lg,
                  paddingHorizontal: rp(12),
                  paddingVertical: rp(6),
                  borderColor: vc.color,
                  backgroundColor: vc.color + "10",
                }}
              >
                <Text style={{ fontSize: rf(16) }}>{vc.emoji}</Text>
                <View>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: rf(16),
                      color: vc.color,
                    }}
                  >
                    {compat.totalScore}/36
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: vc.color,
                    }}
                  >
                    {compat.verdict}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {fetching ? (
            <View style={{ alignItems: "center", padding: rp(40) }}>
              <ActivityIndicator color={COLORS.gold} size="large" />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(14),
                  color: COLORS.textSecondary,
                  marginTop: rs(12),
                }}
              >
                Computing compatibility...
              </Text>
            </View>
          ) : compat && vc ? (
            <>
              {/* Score circle */}
              <View style={{ alignItems: "center", marginBottom: rp(20) }}>
                <View
                  style={{
                    width: rs(88),
                    height: rs(88),
                    borderRadius: rs(44),
                    borderWidth: 2.5,
                    borderColor: vc.color,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: rp(10),
                    backgroundColor: vc.color + "12",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.headingBold,
                      fontSize: rf(24),
                      color: vc.color,
                    }}
                  >
                    {pct}%
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: COLORS.textSecondary,
                    }}
                  >
                    compatible
                  </Text>
                </View>
                <View
                  style={{
                    height: rs(4),
                    backgroundColor: COLORS.border,
                    borderRadius: 2,
                    overflow: "hidden",
                    width: "70%",
                  }}
                >
                  <View
                    style={{
                      height: rs(4),
                      width: `${pct}%`,
                      backgroundColor: vc.color,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>

              {/* Koota breakdown */}
              {compat.breakdown ? (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: COLORS.textDim,
                      letterSpacing: 3,
                      marginBottom: rp(10),
                    }}
                  >
                    ASHTA KOOTA BREAKDOWN
                  </Text>
                  <View
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: RADIUS.xl,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      overflow: "hidden",
                      marginBottom: rp(16),
                    }}
                  >
                    {KOOTA_LIST.map((k, idx) => {
                      const entry = compat.breakdown?.[k.key];
                      const score = entry?.score ?? 0;
                      const maxVal = entry?.max ?? k.max;
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
                            flexDirection: "row",
                            alignItems: "center",
                            gap: rs(8),
                            paddingHorizontal: rp(14),
                            paddingVertical: rp(10),
                            borderBottomWidth:
                              idx < KOOTA_LIST.length - 1 ? 1 : 0,
                            borderBottomColor: COLORS.border,
                          }}
                        >
                          <Text style={{ fontSize: rf(16), width: rs(22) }}>
                            {k.emoji}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: rp(4),
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: FONTS.bodyMedium,
                                  fontSize: rf(13),
                                  color: COLORS.textPrimary,
                                }}
                              >
                                {k.name}
                              </Text>
                              <Text
                                style={{
                                  fontFamily: FONTS.bodyBold,
                                  fontSize: rf(13),
                                  color: isPerfect
                                    ? COLORS.gold
                                    : isZero
                                    ? COLORS.rose
                                    : COLORS.textSecondary,
                                }}
                              >
                                {score}/{maxVal}
                                {isPerfect ? " ✓" : isZero ? " ✕" : ""}
                              </Text>
                            </View>
                            <View
                              style={{
                                height: rs(4),
                                backgroundColor: COLORS.border,
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                            >
                              <View
                                style={{
                                  height: rs(4),
                                  width: `${(score / maxVal) * 100}%`,
                                  backgroundColor: barColor,
                                  borderRadius: 2,
                                }}
                              />
                            </View>
                            {entry?.detail ? (
                              <Text
                                style={{
                                  fontFamily: FONTS.body,
                                  fontSize: rf(11),
                                  color: COLORS.textSecondary,
                                  marginTop: rp(3),
                                  fontStyle: "italic",
                                }}
                              >
                                {entry.detail}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {/* Doshas */}
              {compat.doshas?.length > 0 && (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: COLORS.textDim,
                      letterSpacing: 3,
                      marginBottom: rp(10),
                    }}
                  >
                    DOSHAS
                  </Text>
                  <View
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: RADIUS.xl,
                      borderWidth: 1,
                      borderColor: "#FF980040",
                      overflow: "hidden",
                      marginBottom: rp(16),
                    }}
                  >
                    {compat.doshas.map((d, i) => (
                      <View
                        key={i}
                        style={{
                          flexDirection: "row",
                          gap: rs(10),
                          padding: rp(14),
                          borderBottomWidth:
                            i < compat.doshas.length - 1 ? 1 : 0,
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        <Text style={{ fontSize: rf(18) }}>
                          {d.severity === "high" ? "⚠️" : "ℹ️"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.bodyMedium,
                              fontSize: rf(14),
                              color: COLORS.textPrimary,
                              marginBottom: rp(2),
                            }}
                          >
                            {d.name}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(12),
                              color: COLORS.textSecondary,
                              lineHeight: rf(18),
                            }}
                          >
                            {d.description}
                          </Text>
                          {d.cancellation && (
                            <Text
                              style={{
                                fontFamily: FONTS.body,
                                fontSize: rf(11),
                                color: COLORS.good || "#4ADE80",
                                marginTop: rp(4),
                              }}
                            >
                              ✓ {d.cancellation}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Highlights */}
              {compat.highlights?.length > 0 && (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: COLORS.textDim,
                      letterSpacing: 3,
                      marginBottom: rp(10),
                    }}
                  >
                    TOP STRENGTHS
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: rp(10),
                      marginBottom: rp(16),
                    }}
                  >
                    {compat.highlights.slice(0, 4).map((h) => (
                      <View
                        key={h.name}
                        style={{
                          flex: 1,
                          minWidth: "44%",
                          backgroundColor:
                            h.score === h.max
                              ? COLORS.gold + "12"
                              : COLORS.bgCard,
                          borderRadius: RADIUS.lg,
                          borderWidth: 1,
                          borderColor:
                            h.score === h.max
                              ? COLORS.gold + "50"
                              : COLORS.border,
                          padding: rp(12),
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.headingBold,
                            fontSize: rf(18),
                            color:
                              h.score === h.max
                                ? COLORS.gold
                                : COLORS.textSecondary,
                          }}
                        >
                          {h.score}/{h.max}
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: rf(11),
                            color: COLORS.textDim,
                            marginTop: 2,
                            textAlign: "center",
                          }}
                        >
                          {h.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            // No data and not fetching — this means no userId was passed
            // (old legacy usage without userId)
            <View
              style={{
                alignItems: "center",
                padding: rp(40),
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: rf(40), marginBottom: rs(12) }}>🔯</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(15),
                  color: COLORS.textPrimary,
                  marginBottom: rp(8),
                  textAlign: "center",
                }}
              >
                Score: {data.totalScore ?? "—"}/36
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(13),
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  lineHeight: rf(20),
                }}
              >
                Detailed breakdown not available for this match.{"\n"}New
                matches will show the full report.
              </Text>
            </View>
          )}

          <View style={{ height: rp(20) }} />
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            padding: rp(20),
            paddingBottom: rp(32),
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: RADIUS.lg,
              paddingVertical: rp(14),
              alignItems: "center",
            }}
            onPress={onClose}
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
        </View>
      </View>
    </Modal>
  );
}
