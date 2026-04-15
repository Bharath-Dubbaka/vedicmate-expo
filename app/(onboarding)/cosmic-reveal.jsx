// app/(onboarding)/cosmic-reveal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// COSMIC REVEAL — The "wow" screen that shows users their Nakshatra
//
// This is 100% live data from your API — no mocks.
// The Nakshatra was computed on the backend using the Meeus algorithm.
//
// About the calculation authenticity:
//   Your backend uses Lahiri Ayanamsa — the SAME standard used by:
//     - Drik Panchang (most popular Indian astrology site)
//     - Astrosage
//     - Government of India's published panchang
//   The Gana, Nadi, Yoni, Varna attributes are canonical Vedic lookup tables
//   that have been standardized for centuries — no variation across regions.
//   The main regional variation is which AYANAMSA is used (Lahiri vs Krishnamurti).
//   Lahiri (also called Chitrapaksha) is the most widely accepted.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { updateUser } from "../../store/slices/authSlice";
import { onboardingAPI, authAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

const GANA_DISPLAY = {
  Deva: {
    emoji: "✨",
    title: "Divine Soul",
    description:
      "You carry celestial grace. Naturally compassionate, spiritually inclined, and harmonious in relationships.",
  },
  Manushya: {
    emoji: "🤝",
    title: "Human Soul",
    description:
      "Balanced between heart and mind. Practical, warm, and deeply loyal to those you love.",
  },
  Rakshasa: {
    emoji: "🔥",
    title: "Fierce Soul",
    description:
      "Intense, passionate, and independent. Magnetic energy that challenges everyone around you to grow.",
  },
};

const NADI_INFO = {
  Vata: {
    emoji: "🌬️",
    element: "Air",
    desc: "Quick mind, creative, adaptable",
  },
  Pitta: { emoji: "🔥", element: "Fire", desc: "Passionate, focused, driven" },
  Kapha: { emoji: "🌊", element: "Water", desc: "Calm, nurturing, steadfast" },
};

const KOOTA_ORDER = [
  {
    key: "nadi",
    name: "Nadi",
    max: 8,
    emoji: "🌊",
    desc: "Health & genetics — most critical",
  },
  {
    key: "bhakoot",
    name: "Bhakoot",
    max: 7,
    emoji: "🌕",
    desc: "Emotional & financial compatibility",
  },
  {
    key: "gana",
    name: "Gana",
    max: 6,
    emoji: "✨",
    desc: "Temperament & personality",
  },
  {
    key: "grahaMaitri",
    name: "Graha Maitri",
    max: 5,
    emoji: "🪐",
    desc: "Mental & intellectual bond",
  },
  {
    key: "yoni",
    name: "Yoni",
    max: 4,
    emoji: "🐾",
    desc: "Physical compatibility",
  },
  {
    key: "tara",
    name: "Tara",
    max: 3,
    emoji: "⭐",
    desc: "Destiny & birth star harmony",
  },
  {
    key: "vashya",
    name: "Vashya",
    max: 2,
    emoji: "💫",
    desc: "Mutual attraction",
  },
  {
    key: "varna",
    name: "Varna",
    max: 1,
    emoji: "📿",
    desc: "Spiritual alignment",
  },
];

export default function CosmicRevealScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { COLORS, FONTS, SPACING, RADIUS, GANA_CONFIG } = useTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const orbitAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await onboardingAPI.getCosmicProfile();
      setProfile(res.data.cosmicProfile);
      setLoading(false);
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(cardSlide, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);
    } catch (err) {
      Alert.alert(
        "Calculation Error",
        "Unable to compute your Kundli. Please go back and re-enter your birth details.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await onboardingAPI.complete();
      router.replace("/(onboarding)/photo-upload");
      const meRes = await authAPI.getMe();
      const freshUser = meRes.data.user;
      await dispatch(updateUser(freshUser));
    } catch (err) {
      router.replace("/(onboarding)/photo-upload");
      await dispatch(updateUser({ onboardingComplete: true }));
    } finally {
      setCompleting(false);
    }
  };

  const orbitRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const nakshatraOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: SPACING.xl,
        }}
      >
        <ActivityIndicator color={COLORS.gold} size="large" />
        <Text
          style={{
            fontFamily: FONTS.heading,
            fontSize: 20,
            color: COLORS.textPrimary,
            marginTop: SPACING.lg,
            textAlign: "center",
          }}
        >
          Reading the stars...
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textSecondary,
            marginTop: SPACING.sm,
            textAlign: "center",
          }}
        >
          Computing your Nakshatra using Meeus algorithm + Lahiri ayanamsa
        </Text>
      </View>
    );
  }
  if (!profile) return null;

  const gc = GANA_CONFIG[profile.gana] || GANA_CONFIG.Manushya;
  const gd = GANA_DISPLAY[profile.gana] || GANA_DISPLAY.Manushya;
  const nadiInfo = NADI_INFO[profile.nadi] || {};

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          paddingTop: 60,
          paddingHorizontal: SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Orbit animation */}
        <View
          style={{
            width: 150,
            height: 150,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: SPACING.xl,
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              width: 140,
              height: 140,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ rotate: orbitRotate }],
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: COLORS.gold,
                  opacity: 0.7,
                  transform: [{ rotate: `${i * 45}deg` }, { translateY: -65 }],
                }}
              />
            ))}
          </Animated.View>
          <Animated.View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: gc.color,
              backgroundColor: gc.bg,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Text style={{ fontSize: 44 }}>🔮</Text>
          </Animated.View>
        </View>

        {/* Nakshatra reveal */}
        <Animated.View
          style={{
            alignItems: "center",
            marginBottom: SPACING.xl,
            opacity: fadeAnim,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: COLORS.gold,
              letterSpacing: 4,
              marginBottom: SPACING.sm,
            }}
          >
            YOUR NAKSHATRA
          </Text>
          <Animated.Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: 36,
              color: COLORS.textPrimary,
              textAlign: "center",
              letterSpacing: 2,
              opacity: nakshatraOpacity,
            }}
          >
            {profile.nakshatra}
          </Animated.Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 15,
              color: COLORS.textSecondary,
              marginTop: SPACING.xs,
              marginBottom: SPACING.md,
            }}
          >
            {profile.rashi} Moon · Pada {profile.pada}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.sm,
              paddingVertical: SPACING.sm,
              paddingHorizontal: SPACING.lg,
              borderRadius: RADIUS.full,
              borderWidth: 1,
              borderColor: gc.color,
              backgroundColor: gc.bg,
            }}
          >
            <Text style={{ fontSize: 18 }}>{gd.emoji}</Text>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: gc.color,
              }}
            >
              {gd.title}
            </Text>
          </View>
        </Animated.View>

        {/* Info card */}
        <Animated.View
          style={{
            width: "100%",
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: gc.color,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
            opacity: fadeAnim,
            transform: [{ translateY: cardSlide }],
          }}
        >
          <View
            style={{
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              backgroundColor: gc.bg,
              marginBottom: SPACING.lg,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyMedium,
                fontSize: 14,
                color: gc.color,
                lineHeight: 21,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              {gd.description}
            </Text>
          </View>
          {/* Stats grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: SPACING.lg,
            }}
          >
            {[
              { emoji: "🐾", label: "Yoni Animal", value: profile.animal },
              {
                emoji: nadiInfo.emoji || "🌊",
                label: "Nadi (Dosha type)",
                value: `${profile.nadi} · ${nadiInfo.element || ""}`,
              },
              { emoji: "📿", label: "Varna", value: profile.varna },
              {
                emoji: "🪐",
                label: "Ruling Planet",
                value: profile.lordPlanet,
              },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  width: "50%",
                  alignItems: "center",
                  paddingVertical: SPACING.md,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>
                  {stat.emoji}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: 15,
                    color: COLORS.textPrimary,
                    textAlign: "center",
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                    textAlign: "center",
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
          {/* Personality */}
          <View
            style={{
              backgroundColor: COLORS.bgElevated,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.md,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.gold,
                letterSpacing: 2,
                marginBottom: SPACING.sm,
                textAlign: "center",
              }}
            >
              ✦ YOUR COSMIC PERSONALITY
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 22,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              {profile.personality}
            </Text>
          </View>
          {/* Nadi info */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: COLORS.bgElevated,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              gap: SPACING.sm,
            }}
          >
            <Text style={{ fontSize: 18 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 13,
                  color: COLORS.textPrimary,
                  marginBottom: 2,
                }}
              >
                About Nadi ({profile.nadi})
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  lineHeight: 18,
                }}
              >
                {nadiInfo.desc}. Nadi Koota carries 8 points — highest weight in
                Guna Milan. Partners with different Nadis score full marks here.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Koota weights */}
        <Animated.View
          style={{
            width: "100%",
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
            opacity: fadeAnim,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: COLORS.gold,
              letterSpacing: 3,
              marginBottom: SPACING.xs,
            }}
          >
            HOW YOUR SCORE IS CALCULATED
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.textSecondary,
              marginBottom: SPACING.lg,
              lineHeight: 18,
            }}
          >
            Ashta Koota — 8 dimensions of cosmic compatibility (36 points total)
          </Text>
          {KOOTA_ORDER.map((k) => (
            <View
              key={k.key}
              style={{
                flexDirection: "row",
                gap: SPACING.sm,
                marginBottom: SPACING.md,
              }}
            >
              <Text style={{ fontSize: 18, width: 24, marginTop: 2 }}>
                {k.emoji}
              </Text>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 2,
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
                      fontFamily: FONTS.body,
                      fontSize: 12,
                      color: COLORS.gold,
                    }}
                  >
                    {k.max} pts
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    marginBottom: SPACING.xs,
                  }}
                >
                  {k.desc}
                </Text>
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
                      width: `${(k.max / 8) * 100}%`,
                      backgroundColor: COLORS.gold,
                      opacity: 0.3 + (k.max / 8) * 0.7,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View
          style={{ width: "100%", alignItems: "center", opacity: fadeAnim }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.md + 4,
              paddingHorizontal: SPACING.xxl,
              alignItems: "center",
              elevation: 8,
              marginBottom: SPACING.md,
              width: "100%",
              opacity: completing ? 0.6 : 1,
            }}
            onPress={handleComplete}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 17,
                  color: COLORS.bg,
                }}
              >
                Find My Cosmic Match 🔮
              </Text>
            )}
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textDim,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Your Kundli is ready. The stars will guide you to your match.
          </Text>
        </Animated.View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}
