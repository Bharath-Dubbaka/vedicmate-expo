// app/(tabs)/discover.jsx
import { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
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
import CompatibilityModal from "../../components/CompatibilityModal";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 32 * 2;
const CARD_HEIGHT = height * 0.72;
const SWIPE_THRESHOLD = width * 0.35;

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

function SwipeCard({ profile, onLike, onPass, isTop, onOpenReport }) {
  const { COLORS, FONTS, SPACING, RADIUS, GANA_CONFIG, VERDICT_CONFIG } =
    useTheme();
  const pan = useRef(new Animated.ValueXY()).current;

  const rotate = pan.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const passOpacity = pan.x.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(pan, {
            toValue: { x: width * 1.5, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => onLike(profile));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(pan, {
            toValue: { x: -width * 1.5, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => onPass(profile));
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const vc =
    VERDICT_CONFIG[profile.compatibility.verdict] ||
    VERDICT_CONFIG["Average Match"];
  const gc = GANA_CONFIG[profile.user.cosmicCard.gana] || GANA_CONFIG.Manushya;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: RADIUS.xl,
          overflow: "hidden",
          backgroundColor: COLORS.bgCard,
          shadowColor: COLORS.textPrimary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        },
        isTop && {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
          zIndex: 10,
        },
      ]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {/* Photo */}
      <View
        style={{
          width: "100%",
          height: "55%",
          backgroundColor: gc.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {profile.user.photos?.[0] ? (
          <Image
            source={{ uri: profile.user.photos[0] }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            resizeMode="cover"
          />
        ) : (
          <>
            <Text style={{ fontSize: 80, opacity: 0.4 }}>👤</Text>
            <Text style={{ fontSize: 36, marginTop: 6 }}>
              {profile.user.cosmicCard.nakshatra?.split(" ")[0] || "🌟"}
            </Text>
          </>
        )}
      </View>

      {/* LIKE/PASS overlays */}
      {isTop && (
        <>
          <Animated.View
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 3,
              borderRadius: RADIUS.md,
              borderColor: "#4CAF50",
              transform: [{ rotate: "-15deg" }],
              opacity: likeOpacity,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: 22,
                letterSpacing: 2,
                color: "#4CAF50",
              }}
            >
              LIKE ✨
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              top: 40,
              left: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 3,
              borderRadius: RADIUS.md,
              borderColor: "#E05C5C",
              transform: [{ rotate: "15deg" }],
              opacity: passOpacity,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: 22,
                letterSpacing: 2,
                color: "#E05C5C",
              }}
            >
              PASS
            </Text>
          </Animated.View>
        </>
      )}

      {/* Card info — scrollable */}
      <ScrollView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "55%",
          backgroundColor: COLORS.cardOverlay,
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.sm,
        }}
        contentContainerStyle={{ paddingBottom: SPACING.md }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={isTop}
        nestedScrollEnabled
      >
        {/* Name + score */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: SPACING.sm,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: 22,
              color: COLORS.textPrimary,
            }}
          >
            {profile.user.name}, {profile.user.age}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              borderWidth: 1.5,
              borderRadius: RADIUS.full,
              paddingHorizontal: SPACING.sm,
              paddingVertical: 4,
              borderColor: vc.color,
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <Text style={{ fontSize: 12 }}>{vc.emoji}</Text>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 14,
                color: vc.color,
              }}
            >
              {profile.compatibility.totalScore}/36
            </Text>
          </View>
        </View>

        {/* Cosmic panel */}
        <View
          style={{
            borderWidth: 1,
            borderRadius: RADIUS.lg,
            padding: SPACING.sm,
            marginBottom: SPACING.sm,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderColor: gc.color + "40",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.sm,
              marginBottom: SPACING.xs,
            }}
          >
            <Text style={{ fontSize: 28 }}>
              {profile.user.cosmicCard.nakshatra?.split(" ")[0]}
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 14,
                  color: COLORS.textPrimary,
                  lineHeight: 18,
                }}
              >
                {profile.user.cosmicCard.nakshatra
                  ?.split(" ")
                  .slice(1)
                  .join(" ") || profile.user.cosmicCard.nakshatra}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.textSecondary,
                }}
              >
                {profile.user.cosmicCard.rashi} Moon · Pada{" "}
                {profile.user.cosmicCard.pada}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: RADIUS.md,
                backgroundColor: gc.bg,
              }}
            >
              <Text style={{ fontSize: 12 }}>{gc.emoji}</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 11,
                  color: gc.color,
                }}
              >
                {profile.user.cosmicCard.gana}
              </Text>
            </View>
          </View>
          {/* Tags */}
          <View
            style={{
              flexDirection: "row",
              gap: SPACING.xs,
              marginBottom: SPACING.sm,
              flexWrap: "wrap",
            }}
          >
            {[
              `🐾 ${profile.user.cosmicCard.animal}`,
              `🌊 ${profile.user.cosmicCard.nadi}`,
              `🪐 ${profile.user.cosmicCard.lordPlanet}`,
            ].map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: RADIUS.sm,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                  }}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          {/* Koota bars */}
          <View style={{ gap: 5, marginBottom: SPACING.sm }}>
            {KOOTA_LIST.map((k) => {
              const entry = profile.compatibility.breakdown?.[k.key];
              const score = entry?.score ?? 0;
              const maxVal = entry?.max ?? k.max;
              const barColor =
                score === maxVal
                  ? COLORS.gold
                  : score === 0
                  ? "#E05C5C"
                  : vc.color;
              return (
                <View
                  key={k.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: SPACING.sm,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      width: 80,
                    }}
                  >
                    {k.emoji} {k.name}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 3,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 3,
                        width: `${(score / maxVal) * 100}%`,
                        backgroundColor: barColor,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: 11,
                      color: barColor,
                      width: 28,
                      textAlign: "right",
                    }}
                  >
                    {score}/{maxVal}
                  </Text>
                </View>
              );
            })}
          </View>
          <TouchableOpacity
            style={{ alignItems: "center", paddingVertical: 4 }}
            onPress={() => isTop && onOpenReport(profile)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 11,
                color: COLORS.gold,
                opacity: 0.8,
              }}
            >
              View full compatibility report ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guna bar */}
        <View
          style={{
            height: 2,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 2,
              width: `${(profile.compatibility.totalScore / 36) * 100}%`,
              backgroundColor: vc.color,
              borderRadius: 1,
            }}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const dispatch = useDispatch();
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const profiles = useSelector(selectProfiles);
  const loading = useSelector(selectDiscoverLoading);
  const isEmpty = useSelector(selectIsEmpty);
  const swipeLimitReached = useSelector(selectSwipeLimitReached);
  const [showPaywall, setShowPaywall] = useState(false);
  const [reportProfile, setReportProfile] = useState(null);
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
              name: profile.user.name,
              photo: profile.user.photos?.[0] || null,
              cosmicCard: { nakshatra: profile.user.cosmicCard.nakshatra },
            },
            compatibility: {
              gunaScore: profile.compatibility.totalScore,
              verdict: profile.compatibility.verdict,
            },
          })
        );
        Alert.alert(
          "💫 Cosmic Match!",
          `You and ${profile.user.name} are cosmically connected!\n\n${profile.compatibility.totalScore}/36 Gunas — ${profile.compatibility.verdict}`,
          [{ text: "Amazing! ✨" }]
        );
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

  const visibleProfiles = profiles.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: SPACING.xl,
          paddingTop: 56,
          paddingBottom: SPACING.md,
          gap: SPACING.sm,
        }}
      >
        <Text style={{ fontSize: 22 }}>🔮</Text>
        <Text
          style={{
            fontFamily: FONTS.headingBold,
            fontSize: 16,
            color: COLORS.gold,
            letterSpacing: 4,
            flex: 1,
          }}
        >
          DISCOVER
        </Text>
      </View>

      <SwipeLimitBanner
        remaining={swipesRemaining}
        isPremium={isPremium}
        onUpgrade={() => setShowPaywall(true)}
      />

      {/* Deck */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {loading ? (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 15,
                color: COLORS.textSecondary,
                marginTop: SPACING.md,
              }}
            >
              Reading the stars...
            </Text>
          </View>
        ) : isEmpty ? (
          <View style={{ alignItems: "center", paddingHorizontal: SPACING.xl }}>
            <Text style={{ fontSize: 64, marginBottom: SPACING.md }}>🌌</Text>
            <Text
              style={{
                fontFamily: FONTS.heading,
                fontSize: 22,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              You've seen everyone!
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.textSecondary,
                textAlign: "center",
                marginBottom: SPACING.xl,
              }}
            >
              Check back later as new cosmic souls join
            </Text>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: COLORS.gold,
                borderRadius: RADIUS.full,
                paddingHorizontal: SPACING.xl,
                paddingVertical: SPACING.md,
              }}
              onPress={() => dispatch(fetchProfiles())}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 14,
                  color: COLORS.gold,
                }}
              >
                Refresh ✨
              </Text>
            </TouchableOpacity>
          </View>
        ) : profiles.length === 0 ? (
          <ActivityIndicator color={COLORS.gold} size="large" />
        ) : (
          [...visibleProfiles]
            .reverse()
            .map((profile, i, arr) => (
              <SwipeCard
                key={profile.user.id}
                profile={profile}
                onLike={handleLike}
                onPass={handlePass}
                isTop={i === arr.length - 1}
                onOpenReport={setReportProfile}
              />
            ))
        )}
      </View>

      {/* Action buttons */}
      {!loading && !isEmpty && profiles.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: SPACING.xl,
            paddingVertical: SPACING.lg,
            paddingBottom: SPACING.xl,
          }}
        >
          <TouchableOpacity
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              elevation: 8,
              backgroundColor: COLORS.bgElevated,
              borderWidth: 2,
              borderColor: "#E05C5C",
            }}
            onPress={() => handlePass(profiles[0])}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24, color: "#E05C5C" }}>✕</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 20,
                color: COLORS.gold,
              }}
            >
              {profiles.length}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.textDim,
                letterSpacing: 1,
              }}
            >
              profiles
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.gold,
              elevation: 12,
            }}
            onPress={() => handleLike(profiles[0])}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24, color: COLORS.bg }}>✦</Text>
          </TouchableOpacity>
        </View>
      )}

      <CompatibilityModal
        visible={!!reportProfile}
        profile={reportProfile}
        onClose={() => setReportProfile(null)}
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
