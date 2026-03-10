// app/(tabs)/discover.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Animated,
   PanResponder,
   Dimensions,
   ActivityIndicator,
   Alert,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { DEV_MATCH_STORE } from "./matches";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - SPACING.xl * 2;
const CARD_HEIGHT = height * 0.62;
const SWIPE_THRESHOLD = width * 0.35;

// ── Mock profiles for dev mode ─────────────────────────────
const MOCK_PROFILES = [
   {
      user: {
         id: "u1",
         name: "Priya",
         age: 26,
         photos: [],
         cosmicCard: {
            nakshatra: "🌸 Rohini",
            gana: "Manushya",
            animal: "Serpent",
            rashi: "Taurus",
         },
      },
      compatibility: {
         totalScore: 28,
         verdict: "Great Match",
         hasDoshas: false,
         highlights: [
            { name: "Nadi", score: 8, max: 8 },
            { name: "Bhakoot", score: 7, max: 7 },
         ],
      },
   },
   {
      user: {
         id: "u2",
         name: "Kavitha",
         age: 24,
         photos: [],
         cosmicCard: {
            nakshatra: "⭐ Pushya",
            gana: "Deva",
            animal: "Goat",
            rashi: "Cancer",
         },
      },
      compatibility: {
         totalScore: 32,
         verdict: "Excellent Match",
         hasDoshas: false,
         highlights: [
            { name: "Gana", score: 6, max: 6 },
            { name: "Graha Maitri", score: 5, max: 5 },
         ],
      },
   },
   {
      user: {
         id: "u3",
         name: "Ananya",
         age: 27,
         photos: [],
         cosmicCard: {
            nakshatra: "🌙 Hasta",
            gana: "Deva",
            animal: "Buffalo",
            rashi: "Virgo",
         },
      },
      compatibility: {
         totalScore: 22,
         verdict: "Good Match",
         hasDoshas: true,
         highlights: [
            { name: "Varna", score: 1, max: 1 },
            { name: "Vasya", score: 2, max: 2 },
         ],
      },
   },
   {
      user: {
         id: "u4",
         name: "Meera",
         age: 25,
         photos: [],
         cosmicCard: {
            nakshatra: "🔥 Magha",
            gana: "Rakshasa",
            animal: "Rat",
            rashi: "Leo",
         },
      },
      compatibility: {
         totalScore: 18,
         verdict: "Average Match",
         hasDoshas: false,
         highlights: [{ name: "Tara", score: 3, max: 3 }],
      },
   },
   {
      user: {
         id: "u5",
         name: "Divya",
         age: 23,
         photos: [],
         cosmicCard: {
            nakshatra: "💫 Chitra",
            gana: "Manushya",
            animal: "Tiger",
            rashi: "Libra",
         },
      },
      compatibility: {
         totalScore: 30,
         verdict: "Great Match",
         hasDoshas: false,
         highlights: [
            { name: "Nadi", score: 8, max: 8 },
            { name: "Gana", score: 6, max: 6 },
         ],
      },
   },
];

const VERDICT_COLORS = {
   "Excellent Match": { color: "#C9A84C", emoji: "🌟" },
   "Great Match": { color: "#4CAF50", emoji: "💚" },
   "Good Match": { color: "#7B8CDE", emoji: "💙" },
   "Average Match": { color: "#FF9800", emoji: "🤝" },
};
const GANA_COLORS = {
   Deva: { color: "#C9A84C", bg: "rgba(201,168,76,0.2)" },
   Manushya: { color: "#7B8CDE", bg: "rgba(123,140,222,0.2)" },
   Rakshasa: { color: "#E05C5C", bg: "rgba(224,92,92,0.2)" },
};

// ── Swipe Card ─────────────────────────────────────────────
function SwipeCard({ profile, onLike, onPass, isTop }) {
   const pan = useRef(new Animated.ValueXY()).current;

   const rotate = pan.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ["-12deg", "0deg", "12deg"],
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
      }),
   ).current;

   const vc =
      VERDICT_COLORS[profile.compatibility.verdict] ||
      VERDICT_COLORS["Good Match"];
   const gc = GANA_COLORS[profile.user.cosmicCard.gana] || GANA_COLORS.Manushya;

   return (
      <Animated.View
         style={[
            styles.card,
            isTop && {
               transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { rotate },
               ],
               zIndex: 10,
            },
         ]}
         {...(isTop ? panResponder.panHandlers : {})}
      >
         {/* Photo placeholder */}
         <View
            style={[
               styles.cardPhoto,
               {
                  backgroundColor: gc.bg,
                  alignItems: "center",
                  justifyContent: "center",
               },
            ]}
         >
            <Text style={{ fontSize: 90 }}>👤</Text>
            <Text style={{ fontSize: 32, marginTop: 8 }}>
               {profile.user.cosmicCard.nakshatra.split(" ")[0]}
            </Text>
         </View>

         <View style={styles.cardOverlay} />

         {isTop && (
            <>
               <Animated.View
                  style={[
                     styles.swipeLabel,
                     styles.likeLabel,
                     { opacity: likeOpacity },
                  ]}
               >
                  <Text style={styles.swipeLabelText}>LIKE ✨</Text>
               </Animated.View>
               <Animated.View
                  style={[
                     styles.swipeLabel,
                     styles.passLabel,
                     { opacity: passOpacity },
                  ]}
               >
                  <Text style={styles.swipeLabelText}>PASS</Text>
               </Animated.View>
            </>
         )}

         <View style={styles.cardInfo}>
            <View style={[styles.scoreBadge, { borderColor: vc.color }]}>
               <Text style={styles.scoreBadgeEmoji}>{vc.emoji}</Text>
               <Text style={[styles.scoreBadgeText, { color: vc.color }]}>
                  {profile.compatibility.totalScore}/36
               </Text>
            </View>
            <Text style={styles.cardName}>
               {profile.user.name}, {profile.user.age}
            </Text>
            <View style={[styles.cosmicRow, { backgroundColor: gc.bg }]}>
               <Text style={styles.cosmicNakshatra}>
                  {profile.user.cosmicCard.nakshatra}
               </Text>
               <View style={styles.cosmicDot} />
               <Text style={[styles.cosmicGana, { color: gc.color }]}>
                  {profile.user.cosmicCard.gana}
               </Text>
               <View style={styles.cosmicDot} />
               <Text style={styles.cosmicAnimal}>
                  {profile.user.cosmicCard.animal}
               </Text>
            </View>
            <View style={styles.highlights}>
               {profile.compatibility.highlights?.slice(0, 2).map((h) => (
                  <View key={h.name} style={styles.highlightPill}>
                     <Text style={styles.highlightText}>
                        {h.name} {h.score}/{h.max}
                     </Text>
                  </View>
               ))}
               {profile.compatibility.hasDoshas && (
                  <View
                     style={[styles.highlightPill, { borderColor: "#FF9800" }]}
                  >
                     <Text style={[styles.highlightText, { color: "#FF9800" }]}>
                        ⚠️ Dosha
                     </Text>
                  </View>
               )}
            </View>
         </View>
      </Animated.View>
   );
}

// ── Main Screen ────────────────────────────────────────────
export default function DiscoverScreen() {
   const { token } = useAuthStore();
   const [profiles, setProfiles] = useState([]);
   const [loading, setLoading] = useState(true);
   const [empty, setEmpty] = useState(false);

   const isDev = !token || token.startsWith("dev_token");

   const fetchProfiles = useCallback(async () => {
      setLoading(true);
      try {
         if (isDev) {
            // Shuffle mock profiles each time
            const shuffled = [...MOCK_PROFILES].sort(() => Math.random() - 0.5);
            setProfiles(shuffled);
            setEmpty(false);
            return;
         }
         const { matchingAPI } = await import("../../services/api");
         const res = await matchingAPI.discover({ limit: 10 });
         if (res.data.profiles.length === 0) setEmpty(true);
         else {
            setProfiles(res.data.profiles);
            setEmpty(false);
         }
      } catch (err) {
         console.error("Discover error:", err.message);
         // Fall back to mock even in non-dev if API fails
         setProfiles([...MOCK_PROFILES].sort(() => Math.random() - 0.5));
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchProfiles();
   }, []);

   const handleLike = async (profile) => {
      setProfiles((prev) => prev.filter((p) => p.user.id !== profile.user.id));
      if (!isDev) {
         try {
            const { matchingAPI } = await import("../../services/api");
            const res = await matchingAPI.like(profile.user.id);
            if (res.data.isMatch)
               Alert.alert(
                  "💫 Cosmic Match!",
                  `You and ${profile.user.name} matched!`,
               );
         } catch {}
      } else {
         // Every like = a match in dev mode (so you can test chat)
         const alreadyMatched = DEV_MATCH_STORE.matches.find(
            (m) => m.matchId === profile.user.id,
         );
         if (!alreadyMatched) {
            const newMatch = {
               matchId: profile.user.id,
               matchedAt: new Date().toISOString(),
               unreadCount: 0,
               user: {
                  name: profile.user.name,
                  photo: null,
                  cosmicCard: { nakshatra: profile.user.cosmicCard.nakshatra },
               },
               compatibility: {
                  gunaScore: profile.compatibility.totalScore,
                  verdict: profile.compatibility.verdict,
               },
            };
            DEV_MATCH_STORE.matches = [newMatch, ...DEV_MATCH_STORE.matches];
            Alert.alert(
               "💫 Cosmic Match!",
               `You and ${profile.user.name} matched! ${profile.compatibility.totalScore}/36 Gunas ✨`,
            );
         }
      }
      if (profiles.length <= 2) fetchProfiles();
   };

   const handlePass = (profile) => {
      setProfiles((prev) => prev.filter((p) => p.user.id !== profile.user.id));
      if (profiles.length <= 2) fetchProfiles();
   };

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Text style={styles.headerLogo}>🔮</Text>
            <Text style={styles.headerTitle}>DISCOVER</Text>
            {isDev && <Text style={styles.devBadge}>DEV</Text>}
         </View>

         <View style={styles.deck}>
            {loading ? (
               <View style={styles.loadingState}>
                  <ActivityIndicator color={COLORS.gold} size="large" />
                  <Text style={styles.loadingText}>Reading the stars...</Text>
               </View>
            ) : empty ? (
               <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🌌</Text>
                  <Text style={styles.emptyTitle}>No more profiles</Text>
                  <Text style={styles.emptySubtitle}>Check back soon!</Text>
                  <TouchableOpacity
                     style={styles.refreshBtn}
                     onPress={fetchProfiles}
                  >
                     <Text style={styles.refreshBtnText}>Refresh ✨</Text>
                  </TouchableOpacity>
               </View>
            ) : (
               [...profiles]
                  .slice(0, 3)
                  .reverse()
                  .map((profile, i, arr) => (
                     <SwipeCard
                        key={profile.user.id}
                        profile={profile}
                        onLike={handleLike}
                        onPass={handlePass}
                        isTop={i === arr.length - 1}
                     />
                  ))
            )}
         </View>

         {!loading && !empty && profiles.length > 0 && (
            <View style={styles.actions}>
               <TouchableOpacity
                  style={[styles.actionBtn, styles.passBtn]}
                  onPress={() => handlePass(profiles[0])}
               >
                  <Text style={styles.actionBtnText}>✕</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={[styles.actionBtn, styles.likeBtn]}
                  onPress={() => handleLike(profiles[0])}
               >
                  <Text style={styles.actionBtnText}>✦</Text>
               </TouchableOpacity>
            </View>
         )}
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   header: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.xl,
      paddingTop: 56,
      paddingBottom: SPACING.md,
   },
   headerLogo: { fontSize: 22 },
   headerTitle: {
      fontFamily: FONTS.headingBold,
      fontSize: 16,
      color: COLORS.gold,
      letterSpacing: 4,
      flex: 1,
   },
   devBadge: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.bg,
      backgroundColor: COLORS.gold,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
   },
   deck: { flex: 1, alignItems: "center", justifyContent: "center" },
   card: {
      position: "absolute",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      backgroundColor: COLORS.bgCard,
   },
   cardPhoto: { width: "100%", height: "100%", position: "absolute" },
   cardOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.15)",
   },
   swipeLabel: {
      position: "absolute",
      top: 40,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 3,
      borderRadius: RADIUS.md,
   },
   likeLabel: {
      right: 20,
      borderColor: "#4CAF50",
      transform: [{ rotate: "-15deg" }],
   },
   passLabel: {
      left: 20,
      borderColor: "#E05C5C",
      transform: [{ rotate: "15deg" }],
   },
   swipeLabelText: {
      fontFamily: FONTS.headingBold,
      fontSize: 20,
      color: COLORS.textPrimary,
      letterSpacing: 2,
   },
   cardInfo: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: SPACING.lg,
   },
   scoreBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: 4,
      alignSelf: "flex-start",
      backgroundColor: "rgba(0,0,0,0.5)",
      marginBottom: SPACING.sm,
   },
   scoreBadgeEmoji: { fontSize: 14 },
   scoreBadgeText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 14,
      color: COLORS.textPrimary,
   },
   cardName: {
      fontFamily: FONTS.headingBold,
      fontSize: 26,
      color: COLORS.textPrimary,
      marginBottom: SPACING.sm,
   },
   cosmicRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      alignSelf: "flex-start",
      marginBottom: SPACING.sm,
   },
   cosmicNakshatra: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
   },
   cosmicDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.4)",
   },
   cosmicGana: { fontFamily: FONTS.bodyMedium, fontSize: 13 },
   cosmicAnimal: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   highlights: { flexDirection: "row", gap: SPACING.xs, flexWrap: "wrap" },
   highlightPill: {
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: RADIUS.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   highlightText: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
   },
   actions: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.xl * 2,
      paddingVertical: SPACING.lg,
      paddingBottom: SPACING.xl,
   },
   actionBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      elevation: 8,
   },
   passBtn: {
      backgroundColor: COLORS.bgElevated,
      borderWidth: 1.5,
      borderColor: "#E05C5C",
   },
   likeBtn: { backgroundColor: COLORS.gold },
   actionBtnText: { fontSize: 24, color: COLORS.textPrimary },
   loadingState: { alignItems: "center", gap: SPACING.md },
   loadingText: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: COLORS.textSecondary,
   },
   emptyState: { alignItems: "center", paddingHorizontal: SPACING.xl },
   emptyEmoji: { fontSize: 64, marginBottom: SPACING.md },
   emptyTitle: {
      fontFamily: FONTS.heading,
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: SPACING.sm,
   },
   emptySubtitle: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: COLORS.textSecondary,
      textAlign: "center",
      marginBottom: SPACING.xl,
   },
   refreshBtn: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.gold,
   },
   refreshBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.gold,
   },
});
