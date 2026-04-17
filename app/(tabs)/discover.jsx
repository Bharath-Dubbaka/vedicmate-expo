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

const { width, height } = Dimensions.get("window");

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

function ProfilePage({ profile }) {
  const { COLORS, FONTS, RADIUS, VERDICT_CONFIG, GANA_CONFIG } = useTheme();
  const vc =
    VERDICT_CONFIG[profile.compatibility.verdict] ||
    VERDICT_CONFIG["Average Match"];
  const gc = GANA_CONFIG[profile.user.cosmicCard.gana] || GANA_CONFIG.Manushya;
  const pct = Math.round((profile.compatibility.totalScore / 36) * 100);

  const KOOTA_COLORS = [
    COLORS.gold,
    COLORS.deva || "#A78BFA",
    COLORS.manushya || "#60A5FA",
    COLORS.teal || "#4ECDC4",
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: rp(120) }}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo */}
      <View
        style={{ width: "100%", height: height * 0.5, backgroundColor: gc.bg }}
      >
        {profile.user.photos?.[0] ? (
          <Image
            source={{ uri: profile.user.photos[0] }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: rs(8),
            }}
          >
            <Text style={{ fontSize: rf(80), opacity: 0.2 }}>👤</Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(14),
                color: COLORS.textDim,
              }}
            >
              No photo added
            </Text>
          </View>
        )}
      </View>

      {/* Name + Bio */}
      <View
        style={{
          paddingHorizontal: rp(20),
          paddingTop: rp(18),
          paddingBottom: rp(16),
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
                fontSize: rf(28),
                color: COLORS.textPrimary,
                lineHeight: rf(34),
              }}
            >
              {profile.user.name}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(15),
                color: COLORS.textSecondary,
                marginTop: rp(2),
              }}
            >
              {profile.user.age} years old
              {profile.user.gender ? ` · ${profile.user.gender}` : ""}
            </Text>
          </View>
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
              {profile.user.cosmicCard.gana}
            </Text>
          </View>
        </View>
        {profile.user.bio ? (
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
        ) : null}
        {profile.user.lookingFor ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: rs(6),
              marginTop: rp(10),
            }}
          >
            <Text style={{ fontSize: rf(14) }}>
              {profile.user.lookingFor === "marriage"
                ? "💍"
                : profile.user.lookingFor === "dating"
                ? "💕"
                : "✨"}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: rf(13),
                color: COLORS.textSecondary,
              }}
            >
              Looking for {profile.user.lookingFor}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Cosmic Identity */}
      <View
        style={{
          paddingHorizontal: rp(20),
          paddingTop: rp(18),
          paddingBottom: rp(18),
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
            marginBottom: rp(12),
          }}
        >
          COSMIC IDENTITY
        </Text>
        <View
          style={{ flexDirection: "row", gap: rp(12), marginBottom: rp(12) }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: gc.bg,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: gc.color + "40",
              padding: rp(14),
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(17),
                color: COLORS.textPrimary,
                marginBottom: rp(2),
              }}
            >
              {profile.user.cosmicCard.nakshatra}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(12),
                color: COLORS.textSecondary,
              }}
            >
              {profile.user.cosmicCard.rashi} Moon · Pada{" "}
              {profile.user.cosmicCard.pada}
            </Text>
          </View>
          <View
            style={{
              width: rs(82),
              backgroundColor: COLORS.bgElevated,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: rp(12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: rf(22), marginBottom: rp(4) }}>🪐</Text>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(13),
                color: COLORS.gold,
                textAlign: "center",
              }}
            >
              {profile.user.cosmicCard.lordPlanet}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(10),
                color: COLORS.textDim,
                marginTop: 2,
              }}
            >
              Lord
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: rs(8) }}>
          {[
            {
              emoji: "🐾",
              label: "Yoni",
              value: profile.user.cosmicCard.animal,
            },
            { emoji: "🌊", label: "Nadi", value: profile.user.cosmicCard.nadi },
            {
              emoji: "📿",
              label: "Varna",
              value: profile.user.cosmicCard.varna,
            },
            {
              emoji: "💫",
              label: "Vashya",
              value: profile.user.cosmicCard.vashya,
            },
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
                paddingVertical: rp(5),
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: rf(12) }}>{a.emoji}</Text>
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
                  fontSize: rf(11),
                  color: COLORS.textPrimary,
                }}
              >
                {a.value || "—"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Compatibility Score */}
      <View
        style={{
          paddingHorizontal: rp(20),
          paddingTop: rp(18),
          paddingBottom: rp(18),
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
            marginBottom: rp(14),
          }}
        >
          COMPATIBILITY
        </Text>
        <View
          style={{
            backgroundColor:
              VERDICT_BG[profile.compatibility.verdict] || COLORS.bgElevated,
            borderRadius: RADIUS.xl,
            padding: rp(18),
            borderWidth: 1,
            borderColor: vc.color + "40",
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: rs(16) }}
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
                  fontSize: rf(18),
                  color: vc.color,
                  marginBottom: rp(2),
                }}
              >
                {vc.emoji} {profile.compatibility.verdict}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(13),
                  color: COLORS.textSecondary,
                }}
              >
                {profile.compatibility.totalScore}/36 Gunas · {gc.title}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: rs(4),
              backgroundColor: COLORS.border,
              borderRadius: 2,
              overflow: "hidden",
              marginTop: rp(14),
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
      </View>

      {/* Ashta Koota */}
      <View
        style={{
          paddingHorizontal: rp(20),
          paddingTop: rp(18),
          paddingBottom: rp(4),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
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
        <View style={{ gap: rp(8) }}>
          {KOOTA_LIST.map((k, idx) => {
            const entry = profile.compatibility.breakdown?.[k.key];
            const score = entry?.score ?? 0;
            const maxVal = entry?.max ?? k.max;
            const detail = entry?.detail ?? "";
            const isPerfect = score === maxVal;
            const isZero = score === 0;
            const barColor = isPerfect
              ? COLORS.gold
              : isZero
              ? COLORS.rose
              : KOOTA_COLORS[idx % KOOTA_COLORS.length];

            function KOOTA_COLORS(i) {
              const colors = [
                COLORS.gold,
                COLORS.deva || "#A78BFA",
                COLORS.manushya || "#60A5FA",
                COLORS.teal || "#4ECDC4",
              ];
              return colors[i % colors.length];
            }

            return (
              <View
                key={k.key}
                style={{
                  backgroundColor: COLORS.bgCard,
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
                    marginBottom: rp(8),
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: rs(4),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.headingBold,
                        fontSize: rf(16),
                        color: barColor,
                      }}
                    >
                      {score}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(12),
                        color: COLORS.textDim,
                      }}
                    >
                      /{maxVal}
                    </Text>
                    {isPerfect && <Text style={{ fontSize: rf(12) }}>✓</Text>}
                    {isZero && <Text style={{ fontSize: rf(12) }}>✕</Text>}
                  </View>
                </View>
                <View
                  style={{
                    height: rs(5),
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: 3,
                    overflow: "hidden",
                    marginBottom: detail ? rp(8) : 0,
                  }}
                >
                  <View
                    style={{
                      height: rs(5),
                      width: `${(score / maxVal) * 100}%`,
                      backgroundColor: barColor,
                      borderRadius: 3,
                    }}
                  />
                </View>
                {detail ? (
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(11),
                      color: COLORS.textSecondary,
                      lineHeight: rf(16),
                    }}
                  >
                    {detail}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Doshas */}
        {profile.compatibility.doshas?.length > 0 && (
          <View style={{ marginTop: rp(16) }}>
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
            <View style={{ gap: rp(8) }}>
              {profile.compatibility.doshas.map((d, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: "#FF980010",
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: "#FF980030",
                    padding: rp(12),
                    flexDirection: "row",
                    gap: rs(10),
                  }}
                >
                  <Text style={{ fontSize: rf(16) }}>
                    {d.severity === "high" ? "⚠️" : "ℹ️"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: rf(13),
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
          </View>
        )}

        {/* Highlights */}
        {profile.compatibility.highlights?.length > 0 && (
          <View style={{ marginTop: rp(16), marginBottom: rp(8) }}>
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
              style={{ flexDirection: "row", flexWrap: "wrap", gap: rp(10) }}
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
                    padding: rp(12),
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.headingBold,
                      fontSize: rf(18),
                      color:
                        h.score === h.max ? COLORS.gold : COLORS.textSecondary,
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
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function DiscoverScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { COLORS, FONTS, RADIUS } = useTheme();
  const profiles = useSelector(selectProfiles);
  const loading = useSelector(selectDiscoverLoading);
  const isEmpty = useSelector(selectIsEmpty);
  const swipeLimitReached = useSelector(selectSwipeLimitReached);

  const [showPaywall, setShowPaywall] = useState(false);
  const [matchData, setMatchData] = useState(null); // drives CosmicMatchSheet
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
        // Store full cosmicCard in match
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
        // Show beautiful bottom sheet instead of Alert.alert
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
          profiles.length > 0
            ? `${profiles.length} profiles nearby`
            : "Finding your cosmic matches"
        }
        right={
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
        <ProfilePage profile={currentProfile} />
      )}

      {/* Fixed bottom buttons */}
      {!loading && !isEmpty && profiles.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: COLORS.bg,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingVertical: rp(14),
            paddingHorizontal: rp(24),
            paddingBottom: rp(24),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: rp(12),
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: rp(14),
              borderRadius: RADIUS.lg,
              backgroundColor: COLORS.bgCard,
              borderWidth: 2,
              borderColor: COLORS.rose,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: rs(8),
            }}
            onPress={() => handlePass(currentProfile)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: rf(20) }}>✕</Text>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(15),
                color: COLORS.rose,
              }}
            >
              Pass
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", minWidth: rs(48) }}>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(20),
                color: COLORS.gold,
              }}
            >
              {profiles.length}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(9),
                color: COLORS.textDim,
                letterSpacing: 1,
              }}
            >
              LEFT
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: rp(14),
              borderRadius: RADIUS.lg,
              backgroundColor: COLORS.gold,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: rs(8),
              shadowColor: COLORS.gold,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 8,
            }}
            onPress={() => handleLike(currentProfile)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: rf(20) }}>✦</Text>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(15),
                color: "#fff",
              }}
            >
              Connect
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Beautiful match sheet */}
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
