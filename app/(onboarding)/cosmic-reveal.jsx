// app/(onboarding)/cosmic-reveal.jsx
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width } = Dimensions.get("window");

// Nakshatra lookup by birth month (simplified mock)
const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const ANIMALS   = ["Horse","Elephant","Sheep","Snake","Dog","Cat","Rat","Cow","Buffalo","Tiger","Hare","Mongoose","Monkey","Lion","Tiger","Tiger","Deer","Hare","Dog","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant"];
const GANAS     = ["Deva","Manushya","Rakshasa"];
const RASHIS    = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function getMockProfile(user) {
  // Generate deterministic mock based on user id or random
  const seed = user?.id?.charCodeAt(0) || 7;
  const nIdx  = seed % 27;
  const rIdx  = seed % 12;
  const gIdx  = seed % 3;

  const nakshatra = NAKSHATRAS[nIdx];
  const rashi     = RASHIS[rIdx];
  const gana      = GANAS[gIdx];
  const animal    = ANIMALS[nIdx];

  const ganaEmoji = gana === "Deva" ? "👼" : gana === "Manushya" ? "🧑" : "🔥";
  const ganaTitle = gana === "Deva" ? "Divine Soul" : gana === "Manushya" ? "Human Soul" : "Fierce Soul";

  return {
    nakshatra, rashi, pada: (seed % 4) + 1,
    gana, ganaTitle, ganaEmoji,
    animal, nadi: ["Vata","Pitta","Kapha"][seed % 3],
    varna: ["Brahmin","Kshatriya","Vaishya","Shudra"][seed % 4],
    lordPlanet: ["Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury","Ketu","Venus"][nIdx % 9],
    personality: `A ${nakshatra} native in ${rashi} is known for remarkable intuition, natural leadership, and a deep spiritual connection. Your ${gana} gana brings ${gana === "Deva" ? "divine grace and compassion" : gana === "Manushya" ? "balance between heart and mind" : "intense passion and drive"} to all relationships.`,
  };
}

export default function CosmicRevealScreen() {
  const { user, token, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);

  const orbitAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const cardAnim  = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    // Start orbit spin
    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();

    loadProfile();
  }, []);

  const loadProfile = async () => {
    const isDev = !token || token.startsWith("dev_token");

    if (isDev) {
      console.log("DEV: using mock cosmic profile");
      const mock = getMockProfile(user);
      setProfile(mock);
      setTimeout(() => revealAnimation(), 800);
      return;
    }

    try {
      const { onboardingAPI } = await import("../../services/api");
      const res = await onboardingAPI.getCosmicProfile();
      setProfile(res.data.cosmicProfile);
      setTimeout(() => revealAnimation(), 800);
    } catch (err) {
      console.log("API failed, using mock:", err.message);
      const mock = getMockProfile(user);
      setProfile(mock);
      setTimeout(() => revealAnimation(), 800);
    }
  };

  const revealAnimation = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(cardAnim,  { toValue: 0, friction: 7,  tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleComplete = async () => {
    const isDev = !token || token.startsWith("dev_token");
    if (!isDev) {
      try {
        const { onboardingAPI } = await import("../../services/api");
        await onboardingAPI.complete();
      } catch (e) { console.log("complete API failed:", e.message); }
    }
    // Mark onboarding done → NavigationGuard sends to tabs
    await updateUser({ onboardingComplete: true });
  };

  const orbitRotate = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Animated.Text style={{ fontSize: 56 }}>🔮</Animated.Text>
        <Text style={styles.loadingText}>Reading the stars...</Text>
      </View>
    );
  }

  const ganaColors = {
    Deva:     { color: "#C9A84C", bg: "rgba(201,168,76,0.15)" },
    Manushya: { color: "#7B8CDE", bg: "rgba(123,140,222,0.15)" },
    Rakshasa: { color: "#E05C5C", bg: "rgba(224,92,92,0.15)" },
  };
  const gc = ganaColors[profile.gana] || ganaColors.Deva;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Orbit */}
        <View style={styles.orbitWrap}>
          <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <View key={i} style={[styles.orbitDot, { transform: [{ rotate: `${i*45}deg` }, { translateY: -58 }] }]} />
            ))}
          </Animated.View>
          <Animated.View style={[styles.centerOrb, { backgroundColor: gc.bg, transform: [{ scale: scaleAnim }] }]}>
            <Text style={{ fontSize: 44 }}>🔮</Text>
          </Animated.View>
        </View>

        {/* Nakshatra name */}
        <Animated.View style={[styles.revealHead, { opacity: fadeAnim }]}>
          <Text style={styles.revealLabel}>YOUR NAKSHATRA</Text>
          <Text style={styles.nakshatraName}>{profile.nakshatra}</Text>
          <Text style={styles.rashiText}>{profile.rashi} • Pada {profile.pada}</Text>
        </Animated.View>

        {/* Stats card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: cardAnim }], borderColor: gc.color }]}>
          <View style={[styles.ganaBadge, { backgroundColor: gc.bg }]}>
            <Text style={{ fontSize: 18 }}>{profile.ganaEmoji}</Text>
            <Text style={[styles.ganaText, { color: gc.color }]}>{profile.ganaTitle}</Text>
          </View>

          <View style={styles.grid}>
            {[
              { label: "Animal",  value: profile.animal,     emoji: "🐾" },
              { label: "Nadi",    value: profile.nadi,       emoji: "🌊" },
              { label: "Varna",   value: profile.varna,      emoji: "📿" },
              { label: "Lord",    value: profile.lordPlanet, emoji: "🪐" },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</Text>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.blurb}>
            <Text style={styles.blurbText}>{profile.personality}</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleComplete}>
            <Text style={styles.ctaBtnText}>Find My Cosmic Match 🔮</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>Your Kundli is ready. Let the stars guide you.</Text>
        </Animated.View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { alignItems: "center", paddingTop: 60 },
  loadingText:  { fontFamily: FONTS.body, fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.md },
  orbitWrap:    { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: SPACING.xl },
  orbitRing:    { position: "absolute", width: 130, height: 130, alignItems: "center", justifyContent: "center" },
  orbitDot:     { position: "absolute", width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold, opacity: 0.6 },
  centerOrb:    { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.gold },
  revealHead:   { alignItems: "center", marginBottom: SPACING.xl },
  revealLabel:  { fontFamily: FONTS.body, fontSize: 11, color: COLORS.gold, letterSpacing: 4, marginBottom: 6 },
  nakshatraName:{ fontFamily: FONTS.headingBold, fontSize: 32, color: COLORS.textPrimary, textAlign: "center" },
  rashiText:    { fontFamily: FONTS.body, fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  card:         { width: width - SPACING.xl * 2, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.xl },
  ganaBadge:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.full, alignSelf: "center", marginBottom: SPACING.lg },
  ganaText:     { fontFamily: FONTS.bodyBold, fontSize: 15 },
  grid:         { flexDirection: "row", flexWrap: "wrap", marginBottom: SPACING.lg },
  statItem:     { width: "50%", alignItems: "center", paddingVertical: SPACING.md },
  statVal:      { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.textPrimary },
  statLbl:      { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  blurb:        { backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md },
  blurbText:    { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, textAlign: "center", fontStyle: "italic" },
  ctaWrap:      { width: "100%", paddingHorizontal: SPACING.xl },
  ctaBtn:       { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4, alignItems: "center", elevation: 8, marginBottom: SPACING.md },
  ctaBtnText:   { fontFamily: FONTS.bodyBold, fontSize: 17, color: COLORS.bg },
  ctaSub:       { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textDim, textAlign: "center" },
});