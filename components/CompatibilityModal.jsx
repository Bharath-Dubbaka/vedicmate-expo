// components/CompatibilityModal.jsx
// Shared modal — works for discover profiles AND matched users
// Profile shape from discover: { user, compatibility }
// Profile shape from matches: { name, nakshatra, gunaScore, verdict, gana, animal, nadi, rashi, pada, lordPlanet, breakdown, doshas, highlights }

// Shared modal — works for discover profiles AND matched users.
// Now theme-aware.

import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

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

function normalizeProfile(profile) {
  if (!profile) return null;
  if (profile.user && profile.compatibility) {
    return {
      name: profile.user.name,
      age: profile.user.age,
      nakshatra: profile.user.cosmicCard?.nakshatra,
      rashi: profile.user.cosmicCard?.rashi,
      pada: profile.user.cosmicCard?.pada,
      gana: profile.user.cosmicCard?.gana,
      animal: profile.user.cosmicCard?.animal,
      nadi: profile.user.cosmicCard?.nadi,
      lordPlanet: profile.user.cosmicCard?.lordPlanet,
      totalScore: profile.compatibility.totalScore,
      verdict: profile.compatibility.verdict,
      breakdown: profile.compatibility.breakdown,
      doshas: profile.compatibility.doshas,
      highlights: profile.compatibility.highlights,
    };
  }
  return {
    name: profile.name,
    age: profile.age,
    nakshatra: profile.nakshatra || profile.kundli?.nakshatra,
    rashi: profile.rashi || profile.kundli?.rashi,
    pada: profile.pada || profile.kundli?.pada,
    gana: profile.gana || profile.kundli?.gana,
    animal: profile.animal || profile.kundli?.animal,
    nadi: profile.nadi || profile.kundli?.nadi,
    lordPlanet: profile.lordPlanet || profile.kundli?.lordPlanet,
    totalScore:
      profile.gunaScore ??
      profile.totalScore ??
      profile.compatibility?.gunaScore,
    verdict:
      profile.verdict ?? profile.compatibility?.verdict ?? "Average Match",
    breakdown: profile.breakdown ?? profile.compatibility?.breakdown,
    doshas: profile.doshas ?? profile.compatibility?.doshas,
    highlights: profile.highlights ?? profile.compatibility?.highlights,
  };
}

export default function CompatibilityModal({ visible, profile, onClose }) {
  const { COLORS, FONTS, SPACING, RADIUS, isDark } = useTheme();

  const VERDICT_CONFIG = {
    "Excellent Match": { color: COLORS.excellent, emoji: "🌟" },
    "Good Match": { color: COLORS.good, emoji: "💚" },
    "Average Match": { color: "#7B8CDE", emoji: "💙" },
    "Challenging Match": { color: COLORS.average, emoji: "⚠️" },
  };

  const GANA_CONFIG = {
    Deva: {
      color: COLORS.deva,
      bg: COLORS.deva + "20",
      emoji: "✨",
      label: "Divine Soul",
    },
    Manushya: {
      color: COLORS.manushya,
      bg: COLORS.manushya + "20",
      emoji: "🤝",
      label: "Human Heart",
    },
    Rakshasa: {
      color: COLORS.rakshasa,
      bg: COLORS.rakshasa + "20",
      emoji: "🔥",
      label: "Fierce Spirit",
    },
  };

  const data = normalizeProfile(profile);
  if (!data) return null;

  const vc = VERDICT_CONFIG[data.verdict] || VERDICT_CONFIG["Average Match"];
  const gc = GANA_CONFIG[data.gana] || GANA_CONFIG.Manushya;
  const pct = data.totalScore ? Math.round((data.totalScore / 36) * 100) : 0;

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
            width: 40,
            height: 4,
            backgroundColor: COLORS.border,
            borderRadius: 2,
            alignSelf: "center",
            marginTop: 12,
            marginBottom: 4,
          }}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: SPACING.lg,
            }}
          >
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: 22,
                  color: COLORS.textPrimary,
                  marginBottom: 2,
                }}
              >
                {data.name}
                {data.age ? `, ${data.age}` : ""}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                }}
              >
                {data.nakshatra}
                {data.rashi ? ` · ${data.rashi} Moon` : ""}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
                borderWidth: 1.5,
                borderRadius: RADIUS.lg,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                backgroundColor: isDark
                  ? "rgba(0,0,0,0.3)"
                  : "rgba(255,255,255,0.8)",
                borderColor: vc.color,
              }}
            >
              <Text style={{ fontSize: 18 }}>{vc.emoji}</Text>
              <View>
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: 16,
                    color: vc.color,
                  }}
                >
                  {data.totalScore ?? "—"}/36
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: vc.color,
                  }}
                >
                  {data.verdict}
                </Text>
              </View>
            </View>
          </View>

          {/* Score circle */}
          <View style={{ alignItems: "center", marginBottom: SPACING.xl }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 2.5,
                borderColor: vc.color,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: SPACING.md,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: 26,
                  color: vc.color,
                }}
              >
                {pct}%
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.textSecondary,
                }}
              >
                compatible
              </Text>
            </View>
            {/* Gana chip */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: SPACING.md,
                paddingVertical: 6,
                borderRadius: RADIUS.full,
                borderWidth: 1,
                borderColor: gc.color,
                backgroundColor: gc.bg,
                marginBottom: SPACING.sm,
              }}
            >
              <Text style={{ fontSize: 14 }}>{gc.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color: gc.color,
                }}
              >
                {data.gana} · {gc.label}
              </Text>
            </View>
            {/* Cosmic tags */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
              }}
            >
              {data.animal && (
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.textSecondary,
                  }}
                >
                  🐾 {data.animal}
                </Text>
              )}
              {data.rashi && (
                <>
                  <Text style={{ color: COLORS.textDim }}>·</Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textSecondary,
                    }}
                  >
                    🌙 {data.rashi}
                  </Text>
                </>
              )}
              {data.nadi && (
                <>
                  <Text style={{ color: COLORS.textDim }}>·</Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textSecondary,
                    }}
                  >
                    💫 {data.nadi}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Koota breakdown */}
          {data.breakdown ? (
            <>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  letterSpacing: 3,
                  marginBottom: SPACING.sm,
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
                  marginBottom: SPACING.xl,
                  overflow: "hidden",
                }}
              >
                {KOOTA_LIST.map((k, idx) => {
                  const entry = data.breakdown?.[k.key];
                  const score = entry?.score ?? 0;
                  const maxVal = entry?.max ?? k.max;
                  const isPerfect = score === maxVal;
                  const isZero = score === 0;
                  const barColor = isPerfect
                    ? COLORS.gold
                    : isZero
                    ? "#E05C5C"
                    : vc.color;
                  return (
                    <View
                      key={k.key}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SPACING.sm,
                        paddingHorizontal: SPACING.md,
                        paddingVertical: 10,
                        borderBottomWidth: idx < KOOTA_LIST.length - 1 ? 1 : 0,
                        borderBottomColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 16, width: 22 }}>{k.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 5,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: FONTS.bodyMedium,
                              fontSize: 13,
                              color: COLORS.textPrimary,
                            }}
                          >
                            {k.name}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.bodyBold,
                              fontSize: 13,
                              color: isPerfect
                                ? COLORS.gold
                                : isZero
                                ? "#E05C5C"
                                : COLORS.textSecondary,
                            }}
                          >
                            {score}/{maxVal}
                            {isPerfect ? " ✓" : isZero ? " ✕" : ""}
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 4,
                            backgroundColor: COLORS.border,
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: 4,
                              width: `${(score / maxVal) * 100}%`,
                              backgroundColor: barColor,
                              borderRadius: 2,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.xl,
                padding: SPACING.xl,
                alignItems: "center",
                marginBottom: SPACING.xl,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Full compatibility breakdown available after matching ✨
              </Text>
            </View>
          )}

          {/* Doshas */}
          {data.doshas?.length > 0 && (
            <>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  letterSpacing: 3,
                  marginBottom: SPACING.sm,
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
                  marginBottom: SPACING.xl,
                  overflow: "hidden",
                }}
              >
                {data.doshas.map((d, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      gap: SPACING.sm,
                      padding: SPACING.md,
                      borderBottomWidth: i < data.doshas.length - 1 ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {d.severity === "high" ? "⚠️" : "ℹ️"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bodyMedium,
                          fontSize: 13,
                          color: COLORS.textPrimary,
                          marginBottom: 2,
                        }}
                      >
                        {d.name}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          lineHeight: 18,
                        }}
                      >
                        {d.description}
                      </Text>
                      {d.cancellation && (
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 11,
                            color: "#4CAF50",
                            marginTop: 4,
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
          {data.highlights?.length > 0 && (
            <>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 10,
                  color: COLORS.textDim,
                  letterSpacing: 3,
                  marginBottom: SPACING.sm,
                }}
              >
                TOP STRENGTHS
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: SPACING.sm,
                  marginBottom: SPACING.xl,
                }}
              >
                {data.highlights.slice(0, 4).map((h) => (
                  <View
                    key={h.name}
                    style={{
                      flex: 1,
                      minWidth: "44%",
                      backgroundColor: COLORS.bgCard,
                      borderRadius: RADIUS.lg,
                      borderWidth: 1,
                      borderColor:
                        h.score === h.max ? COLORS.gold : COLORS.border,
                      padding: SPACING.md,
                      alignItems: "center",
                      backgroundColor:
                        h.score === h.max ? COLORS.gold + "12" : COLORS.bgCard,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.headingBold,
                        fontSize: 18,
                        color:
                          h.score === h.max
                            ? COLORS.gold
                            : COLORS.textSecondary,
                        marginBottom: 2,
                      }}
                    >
                      {h.score}/{h.max}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        color: COLORS.textDim,
                      }}
                    >
                      {h.name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            padding: SPACING.xl,
            paddingBottom: 40,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.md,
              alignItems: "center",
            }}
            onPress={onClose}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: 15,
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
