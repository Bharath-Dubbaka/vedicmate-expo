// app/(tabs)/discover.jsx

// ─────────────────────────────────────────────────────────────────────────────
// CHANGES:
//   - Swipe gesture removed — buttons only
//   - Card is taller/scrollable — photo on top, ALL info below (no split)
//   - "View full compatibility" removed — info is already fully visible
//   - Responsive sizing throughout
//   - NetworkBanner removed
// ─────────────────────────────────────────────────────────────────────────────
// Informative — user spends time reading, not just swiping
// ─────────────────────────────────────────────────────────────────────────────

// UPDATED: Cosmic Identity — big Nakshatra banner, Rashi Moon, Deity/God, Pada
// UPDATED: Lord Planet + Gana as large icon cards side by side
// UPDATED: Ashta Koota cards bigger — more padding, taller bars, larger fonts
// RESTORED: TOP STRENGTHS highlights, cycling koota colors, VERDICT_BG tints

import { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import {
  fetchProfiles,
  likeProfile,
  passProfile,
  removeProfile,
  selectProfiles,
  selectDiscoverLoading,
  selectIsEmpty,
  selectSwipeLimitReached,
  resetSwipeLimit,
} from "../../store/slices/discoverSlice";
import { addMatch } from "../../store/slices/matchesSlice";
import { useTheme } from "../../context/ThemeContext";
import { matchingAPI } from "../../services/api";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "./paywall";
import SwipeLimitBanner from "../../components/SwipeLimitBanner";
import BrandHeader from "../../components/BrandHeader";
import CosmicMatchSheet from "../../components/CosmicMatchSheet";
import { rf, rs, rp } from "../../constants/responsive";

const { width: W, height: H } = Dimensions.get("window");

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

const VERDICT_BG = {
  "Excellent Match": "#FFD70018",
  "Good Match": "#4ADE8018",
  "Average Match": "#FB923C18",
  "Challenging Match": "#F8717118",
};

// ── Full Screen Profile ───────────────────────────────────────────────────────
function ProfilePage({ profile, onLike, onPass }) {
  const { COLORS, FONTS, RADIUS, VERDICT_CONFIG, GANA_CONFIG } = useTheme();
  const vc =
    VERDICT_CONFIG[profile.compatibility.verdict] ||
    VERDICT_CONFIG["Average Match"];
  const gc = GANA_CONFIG[profile.user.cosmicCard.gana] || GANA_CONFIG.Manushya;
  const pct = Math.round((profile.compatibility.totalScore / 36) * 100);
  const hasPhoto = !!profile.user.photos?.[0];
  const cc = profile.user.cosmicCard;

  // deity — backend may use either key
  const deity = cc.deity || cc.god || null;

  // cycling koota colors
  const getKootaColor = (idx, isPerfect, isZero) => {
    if (isPerfect) return COLORS.gold;
    if (isZero) return COLORS.rose;
    const cycle = [
      COLORS.gold,
      COLORS.deva || "#A78BFA",
      COLORS.manushya || "#60A5FA",
      COLORS.teal || "#4ECDC4",
    ];
    return cycle[idx % cycle.length];
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ paddingBottom: rp(120) }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* ── FULL SCREEN PHOTO ──────────────────────────────────────────────── */}
      <View style={{ width: W, height: H * 0.72, position: "relative" }}>
        {hasPhoto ? (
          <Image
            source={{ uri: profile.user.photos[0] }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: gc.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: rs(120),
                height: rs(120),
                borderRadius: rs(60),
                backgroundColor: gc.color + "30",
                borderWidth: 2,
                borderColor: gc.color + "60",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: rp(16),
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: rf(48),
                  color: gc.color,
                }}
              >
                {profile.user.name?.[0]?.toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: rf(16),
                color: COLORS.textSecondary,
              }}
            >
              No photo added yet
            </Text>
          </View>
        )}

        {/* Bottom overlay — name + gana + nakshatra */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: rp(20),
            paddingBottom: rp(90),
            paddingTop: rp(80),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: rp(8),
            }}
          >
            <View style={{ flex: 1, marginRight: rs(12) }}>
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: rf(30),
                  color: hasPhoto ? "#fff" : COLORS.textPrimary,
                  textShadowColor: hasPhoto ? "rgba(0,0,0,0.8)" : "transparent",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {profile.user.name}, {profile.user.age}
              </Text>
              {profile.user.lookingFor && (
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(13),
                    color: hasPhoto
                      ? "rgba(255,255,255,0.85)"
                      : COLORS.textSecondary,
                    marginTop: rp(2),
                  }}
                >
                  {profile.user.lookingFor === "marriage" ? "💍" : "💕"} Looking
                  for {profile.user.lookingFor}
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: rs(5),
                paddingHorizontal: rp(12),
                paddingVertical: rp(6),
                borderRadius: RADIUS.full,
                backgroundColor: gc.color + "30",
                borderWidth: 1.5,
                borderColor: gc.color + "70",
              }}
            >
              <Text style={{ fontSize: rf(16) }}>{gc.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(12),
                  color: gc.color,
                }}
              >
                {cc.gana}
              </Text>
            </View>
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: rs(6),
              backgroundColor: hasPhoto ? "rgba(255,255,255,0.15)" : gc.bg,
              borderRadius: RADIUS.full,
              paddingHorizontal: rp(12),
              paddingVertical: rp(5),
              borderWidth: 1,
              borderColor: hasPhoto ? "rgba(255,255,255,0.3)" : gc.color + "40",
            }}
          >
            <Text style={{ fontSize: rf(12) }}>✦</Text>
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: rf(13),
                color: hasPhoto ? "#fff" : gc.color,
              }}
            >
              {cc.nakshatra}
            </Text>
            {cc.rashi && (
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: hasPhoto
                    ? "rgba(255,255,255,0.7)"
                    : COLORS.textSecondary,
                }}
              >
                · {cc.rashi} Moon
              </Text>
            )}
          </View>
        </View>

        {/* Floating action buttons */}
        <View
          style={{
            position: "absolute",
            bottom: -rs(30),
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: rs(20),
          }}
        >
          <TouchableOpacity
            style={{
              width: rs(62),
              height: rs(62),
              borderRadius: rs(28),
              backgroundColor: COLORS.bg,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 12,
              borderWidth: 2,
              borderColor: COLORS.rose,
            }}
            onPress={onPass}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: rf(24) }}>✕</Text>
          </TouchableOpacity>
          <View
            style={{
              paddingHorizontal: rp(24),
              paddingVertical: rp(24),
              backgroundColor: COLORS.gold,
              borderRadius: RADIUS.full,
              borderWidth: 2,
              borderColor: vc.color,
              shadowColor: vc.color,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(18),
                color: COLORS.textPrimary,
                textAlign: "center",
              }}
            >
              {pct}%
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textPrimary,
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              {profile.compatibility.totalScore}/36
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: rs(62),
              height: rs(62),
              borderRadius: rs(28),
              backgroundColor: COLORS.gold,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: COLORS.gold,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 14,
              borderWidth: 2,
              borderColor: COLORS.gold,
            }}
            onPress={onLike}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: rf(24) }}>✦</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── INFO CARDS ──────────────────────────────────────────────────────── */}
      <View style={{ paddingTop: rp(48), paddingHorizontal: rp(20) }}>
        {/* Bio */}
        {profile.user.bio ? (
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              padding: rp(16),
              marginBottom: rp(16),
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(14),
                color: COLORS.textSecondary,
                lineHeight: rf(22),
              }}
            >
              {profile.user.bio}
            </Text>
          </View>
        ) : null}

        {/* ── EXPANDED COSMIC IDENTITY ──────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            padding: rp(18),
            marginBottom: rp(16),
            borderWidth: 1,
            borderColor: gc.color + "30",
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

          {/* Big Nakshatra banner with Rashi + Pada + Deity */}
          <View
            style={{
              backgroundColor: gc.bg,
              borderRadius: RADIUS.xl,
              borderWidth: 1.5,
              borderColor: gc.color + "50",
              padding: rp(18),
              marginBottom: rp(14),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: rs(14),
              }}
            >
              <Text style={{ fontSize: rf(44) }}>
                {cc.nakshatraSymbol || "🌟"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.headingBold,
                    fontSize: rf(22),
                    color: COLORS.textPrimary,
                  }}
                >
                  {cc.nakshatra}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(15),
                    color: gc.color,
                    marginTop: rp(3),
                  }}
                >
                  {cc.rashi ? `${cc.rashi} Moon` : ""}
                  {cc.pada ? `  ·  Pada ${cc.pada}` : ""}
                </Text>
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

          {/* Lord Planet + Gana side-by-side */}
          <View
            style={{ flexDirection: "row", gap: rs(10), marginBottom: rp(14) }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: rp(14),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: rf(26), marginBottom: rp(5) }}>🪐</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(16),
                  color: COLORS.gold,
                  textAlign: "center",
                }}
              >
                {cc.lordPlanet || "—"}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: COLORS.textDim,
                  marginTop: rp(3),
                }}
              >
                Lord Planet
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: gc.bg,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: gc.color + "50",
                padding: rp(14),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: rf(26), marginBottom: rp(5) }}>
                {gc.emoji}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(16),
                  color: gc.color,
                  textAlign: "center",
                }}
              >
                {cc.gana}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: COLORS.textDim,
                  marginTop: rp(3),
                }}
              >
                Gana
              </Text>
            </View>
          </View>

          {/* Attribute chips — larger */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: rs(10) }}>
            {[
              { emoji: "🐾", label: "Yoni", value: cc.animal },
              { emoji: "🌊", label: "Nadi", value: cc.nadi },
              { emoji: "📿", label: "Varna", value: cc.varna },
              { emoji: "💫", label: "Vashya", value: cc.vashya },
            ]
              .filter((a) => a.value)
              .map((a) => (
                <View
                  key={a.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: rs(6),
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.full,
                    paddingHorizontal: rp(14),
                    paddingVertical: rp(9),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: rf(15) }}>{a.emoji}</Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(12),
                      color: COLORS.textDim,
                    }}
                  >
                    {a.label}:
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: rf(13),
                      color: COLORS.textPrimary,
                    }}
                  >
                    {a.value}
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {/* ── Compatibility hero with VERDICT_BG tint ───────────────────────── */}
        <View
          style={{
            backgroundColor:
              VERDICT_BG[profile.compatibility.verdict] || COLORS.bgCard,
            borderRadius: RADIUS.xl,
            padding: rp(20),
            marginBottom: rp(16),
            borderWidth: 1.5,
            borderColor: vc.color + "40",
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
            COMPATIBILITY
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: rs(16),
              marginBottom: rp(14),
            }}
          >
            <View
              style={{
                width: rs(68),
                height: rs(68),
                borderRadius: rs(34),
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
                  fontSize: rf(19),
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
                  marginBottom: rp(3),
                }}
              >
                {vc.emoji} {profile.compatibility.verdict}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(14),
                  color: COLORS.textSecondary,
                }}
              >
                {profile.compatibility.totalScore}/36 Gunas · {gc.title}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: rs(6),
              backgroundColor: COLORS.border,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: rs(6),
                width: `${pct}%`,
                backgroundColor: vc.color,
                borderRadius: 3,
              }}
            />
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
              style={{ fontFamily: FONTS.bodyBold, color: COLORS.textPrimary }}
            >
              Ashtakoota Milan
            </Text>{" "}
            is the Vedic compatibility system used for thousands of years. Your
            birth Nakshatra determines 8 cosmic attributes (Kootas). Each Koota
            is compared between two people to produce a score out of 36 Gunas.
            {"\n\n"}
            <Text
              style={{ fontFamily: FONTS.bodyBold, color: COLORS.textPrimary }}
            >
              This score
            </Text>{" "}
            is a pairwise calculation — it changes with every person you view.{" "}
            <Text
              style={{ fontFamily: FONTS.bodyBold, color: COLORS.textPrimary }}
            >
              Their Chart
            </Text>{" "}
            (after matching) shows their fixed individual attributes used in
            this calculation.
          </Text>
        </View>

        {/* ── EXPANDED Ashta Koota with cycling colors ──────────────────────── */}
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: rp(16),
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
              ASHTA KOOTA BREAKDOWN
            </Text>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(14),
                color: COLORS.textSecondary,
              }}
            >
              {profile.compatibility.totalScore}/36
            </Text>
          </View>
          <View style={{ gap: rp(12) }}>
            {KOOTA_LIST.map((k, idx) => {
              const entry = profile.compatibility.breakdown?.[k.key];
              const score = entry?.score ?? 0;
              const maxVal = entry?.max ?? k.max;
              const detail = entry?.detail ?? "";
              const isPerfect = score === maxVal;
              const isZero = score === 0;
              const barColor = getKootaColor(idx, isPerfect, isZero);
              return (
                <View
                  key={k.key}
                  style={{
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.lg,
                    padding: rp(14),
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
                      alignItems: "center",
                      marginBottom: rp(10),
                    }}
                  >
                    <Text style={{ fontSize: rf(18), marginRight: rs(10) }}>
                      {k.emoji}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: rf(14),
                        color: COLORS.textPrimary,
                        flex: 1,
                      }}
                    >
                      {k.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        fontSize: rf(15),
                        color: barColor,
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
                      backgroundColor: COLORS.border,
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
        </View>

        {/* Doshas */}
        {profile.compatibility.doshas?.length > 0 && (
          <View
            style={{
              backgroundColor: "#FF980008",
              borderRadius: RADIUS.xl,
              padding: rp(18),
              marginBottom: rp(16),
              borderWidth: 1,
              borderColor: "#FF980030",
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
              DOSHAS
            </Text>
            <View style={{ gap: rp(10) }}>
              {profile.compatibility.doshas.map((d, i) => (
                <View key={i} style={{ flexDirection: "row", gap: rs(10) }}>
                  <Text style={{ fontSize: rf(16) }}>
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
                        fontSize: rf(13),
                        color: COLORS.textSecondary,
                        lineHeight: rf(19),
                      }}
                    >
                      {d.description}
                    </Text>
                    {d.cancellation && (
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: rf(12),
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
          </View>
        )}

        {/* TOP STRENGTHS */}
        {profile.compatibility.highlights?.length > 0 && (
          <View style={{ marginBottom: rp(16) }}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                letterSpacing: 3,
                marginBottom: rp(12),
              }}
            >
              TOP STRENGTHS
            </Text>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: rp(12) }}
            >
              {profile.compatibility.highlights.slice(0, 4).map((h) => (
                <View
                  key={h.name}
                  style={{
                    flex: 1,
                    minWidth: "44%",
                    backgroundColor:
                      h.score === h.max ? COLORS.gold + "12" : COLORS.bgCard,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor:
                      h.score === h.max ? COLORS.gold + "50" : COLORS.border,
                    padding: rp(16),
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.headingBold,
                      fontSize: rf(22),
                      color:
                        h.score === h.max ? COLORS.gold : COLORS.textSecondary,
                    }}
                  >
                    {h.score}/{h.max}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(12),
                      color: COLORS.textDim,
                      marginTop: rp(3),
                      textAlign: "center",
                    }}
                  >
                    {h.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Main Discover Screen ──────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { COLORS, FONTS, RADIUS } = useTheme();
  const profiles = useSelector(selectProfiles);
  const loading = useSelector(selectDiscoverLoading);
  const isEmpty = useSelector(selectIsEmpty);
  const swipeLimitReached = useSelector(selectSwipeLimitReached);

  const [showPaywall, setShowPaywall] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const { isPremium, swipesRemaining, swipesAllowed, decrementSwipe, refresh } =
    usePremium();

  useEffect(() => {
    dispatch(fetchProfiles());
  }, []);
  useEffect(() => {
    if (!loading && !isEmpty && profiles.length === 0)
      dispatch(fetchProfiles());
  }, [profiles.length, loading, isEmpty]);
  useEffect(() => {
    if (swipeLimitReached) {
      setShowPaywall(true);
      dispatch(resetSwipeLimit());
    }
  }, [swipeLimitReached]);

  const recordedViews = useRef(new Set());
  useEffect(() => {
    const id = profiles[0]?.user?.id;
    if (id && !recordedViews.current.has(id)) {
      recordedViews.current.add(id);
      matchingAPI.recordView(id).catch(() => {});
    }
  }, [profiles[0]?.user?.id]);

  const handleLike = useCallback(
    async (profile) => {
      if (!swipesAllowed && !isPremium) {
        setShowPaywall(true);
        return;
      }
      decrementSwipe();
      dispatch(removeProfile(profile.user.id));
      const result = await dispatch(likeProfile(profile.user.id));
      if (likeProfile.fulfilled.match(result) && result.payload.isMatch) {
        dispatch(
          addMatch({
            matchId: result.payload.matchId,
            matchedAt: new Date().toISOString(),
            unreadCount: 0,
            user: {
              id: profile.user.id,
              name: profile.user.name,
              age: profile.user.age,
              photo: profile.user.photos?.[0] || null,
              cosmicCard: {
                nakshatra: profile.user.cosmicCard.nakshatra,
                gana: profile.user.cosmicCard.gana,
                animal: profile.user.cosmicCard.animal,
                nadi: profile.user.cosmicCard.nadi,
                varna: profile.user.cosmicCard.varna,
                vashya: profile.user.cosmicCard.vashya,
                lordPlanet: profile.user.cosmicCard.lordPlanet,
                rashi: profile.user.cosmicCard.rashi,
                pada: profile.user.cosmicCard.pada,
              },
            },
            compatibility: {
              gunaScore: profile.compatibility.totalScore,
              verdict: profile.compatibility.verdict,
            },
          })
        );
        setMatchData({
          name: profile.user.name,
          score: profile.compatibility.totalScore,
          verdict: profile.compatibility.verdict,
          matchId: result.payload.matchId,
        });
      }
    },
    [dispatch, swipesAllowed, isPremium, decrementSwipe]
  );

  const handlePass = useCallback(
    (profile) => {
      if (!swipesAllowed && !isPremium) {
        setShowPaywall(true);
        return;
      }
      decrementSwipe();
      dispatch(removeProfile(profile.user.id));
      dispatch(passProfile(profile.user.id));
    },
    [dispatch, swipesAllowed, isPremium, decrementSwipe]
  );

  const currentProfile = profiles[0];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <BrandHeader
        title="DISCOVER"
        subtitle={
          profiles.length > 0 ? `${profiles.length} profiles nearby` : undefined
        }
        right={
          !loading &&
          profiles.length > 0 && (
            <View
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.full,
                paddingHorizontal: rp(10),
                paddingVertical: rp(4),
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(12),
                  color: COLORS.textSecondary,
                }}
              >
                {profiles.length} left
              </Text>
            </View>
          )
        }
      />

      <SwipeLimitBanner
        remaining={swipesRemaining}
        isPremium={isPremium}
        onUpgrade={() => setShowPaywall(true)}
      />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(15),
              color: COLORS.textSecondary,
              marginTop: rs(16),
            }}
          >
            Reading the stars...
          </Text>
        </View>
      ) : isEmpty ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: rp(32),
          }}
        >
          <Text style={{ fontSize: rf(56), marginBottom: rs(16) }}>🌌</Text>
          <Text
            style={{
              fontFamily: FONTS.heading,
              fontSize: rf(22),
              color: COLORS.textPrimary,
              marginBottom: rs(8),
              textAlign: "center",
            }}
          >
            You've seen everyone!
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(14),
              color: COLORS.textSecondary,
              textAlign: "center",
              marginBottom: rp(24),
            }}
          >
            Check back later as new cosmic souls join
          </Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: COLORS.gold,
              borderRadius: RADIUS.full,
              paddingHorizontal: rp(24),
              paddingVertical: rp(12),
            }}
            onPress={() => dispatch(fetchProfiles())}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: rf(14),
                color: COLORS.gold,
              }}
            >
              Refresh ✨
            </Text>
          </TouchableOpacity>
        </View>
      ) : profiles.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      ) : (
        <ProfilePage
          profile={currentProfile}
          onLike={() => handleLike(currentProfile)}
          onPass={() => handlePass(currentProfile)}
        />
      )}

      <CosmicMatchSheet
        data={matchData}
        onClose={() => setMatchData(null)}
        onChat={(matchId) => router.push(`/(tabs)/chat/${matchId}`)}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          refresh();
        }}
        triggerReason="swipe_limit"
      />
    </View>
  );
}
