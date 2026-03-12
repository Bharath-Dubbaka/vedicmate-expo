// app/(tabs)/discover.jsx
// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER SCREEN — Tinder-style swipe with live Guna scores
//
// Key React Native concepts here:
//   PanResponder = touch gesture handler (like mouse events in React.js, but for touch)
//   Animated.event = maps gesture values directly to Animated.Value
//   GestureHandler pattern: onStartShouldSetPanResponder → onPanResponderMove → onPanResponderRelease
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import {
   fetchProfiles,
   likeProfile,
   passProfile,
   removeProfile,
   selectProfiles,
   selectDiscoverLoading,
   selectIsEmpty,
} from "../../store/slices/discoverSlice";
import { addMatch } from "../../store/slices/matchesSlice";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - SPACING.xl * 2;
const CARD_HEIGHT = height * 0.62;
const SWIPE_THRESHOLD = width * 0.35; // 35% of screen width = swipe commits

// ── Verdict color config ───────────────────────────────────────────────────────
const VERDICT_COLORS = {
   "Excellent Match": { color: "#C9A84C", emoji: "🌟", barColor: "#C9A84C" },
   "Good Match": { color: "#4CAF50", emoji: "💚", barColor: "#4CAF50" },
   "Average Match": { color: "#7B8CDE", emoji: "💙", barColor: "#7B8CDE" },
   "Challenging Match": { color: "#FF9800", emoji: "⚠️", barColor: "#FF9800" },
};

const GANA_COLORS = {
   Deva: { color: "#A78BFA", bg: "rgba(167,139,250,0.2)" },
   Manushya: { color: "#60A5FA", bg: "rgba(96,165,250,0.2)" },
   Rakshasa: { color: "#F87171", bg: "rgba(248,113,113,0.2)" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SWIPE CARD COMPONENT
// Each profile card is its own component with its own PanResponder
// ─────────────────────────────────────────────────────────────────────────────
function SwipeCard({ profile, onLike, onPass, isTop }) {
   // Each card has its own pan position (x/y offset from drag)
   const pan = useRef(new Animated.ValueXY()).current;

   // Interpolations derive animated values from another animated value
   // This is like CSS calc() but reactive
   const rotate = pan.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ["-10deg", "0deg", "10deg"],
      extrapolate: "clamp", // don't go beyond the range
   });

   // Show LIKE/PASS labels when swiping
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

   // ── PanResponder ──────────────────────────────────────────────────────────
   // Think of this as event listeners for touch gestures
   const panResponder = useRef(
      PanResponder.create({
         // Should this responder handle the gesture?
         onStartShouldSetPanResponder: () => isTop, // only top card responds

         // As finger moves: update pan position
         onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }], // map gesture delta to pan.x, pan.y
            { useNativeDriver: false }, // can't use native driver for ValueXY moves
         ),

         // When finger lifts: decide what to do
         onPanResponderRelease: (_, gesture) => {
            if (gesture.dx > SWIPE_THRESHOLD) {
               // Swiped right → LIKE
               console.log(
                  `[SWIPE CARD] Swiping RIGHT (like) for: ${profile.user.name}`,
               );
               Animated.spring(pan, {
                  toValue: { x: width * 1.5, y: gesture.dy },
                  useNativeDriver: false,
               }).start(() => onLike(profile));
            } else if (gesture.dx < -SWIPE_THRESHOLD) {
               // Swiped left → PASS
               console.log(
                  `[SWIPE CARD] Swiping LEFT (pass) for: ${profile.user.name}`,
               );
               Animated.spring(pan, {
                  toValue: { x: -width * 1.5, y: gesture.dy },
                  useNativeDriver: false,
               }).start(() => onPass(profile));
            } else {
               // Didn't swipe far enough → snap back
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
      VERDICT_COLORS["Average Match"];
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
         // panHandlers spreads: onStartShouldSetResponder, onResponderMove, etc.
         // This is how PanResponder attaches to a View
      >
         {/* Photo area — shows emoji placeholder until photo upload is built */}
         <View style={[styles.cardPhoto, { backgroundColor: gc.bg }]}>
            <Text style={styles.photoPlaceholder}>👤</Text>
            <Text style={styles.photoNakshatraEmoji}>
               {profile.user.cosmicCard.nakshatra?.split(" ")[0] || "🌟"}
            </Text>
         </View>

         {/* Dark gradient overlay at bottom of card */}
         <View style={styles.cardOverlay} />

         {/* LIKE / PASS labels (animated opacity) */}
         {isTop && (
            <>
               <Animated.View
                  style={[
                     styles.swipeLabel,
                     styles.likeLabel,
                     { opacity: likeOpacity },
                  ]}
               >
                  <Text style={[styles.swipeLabelText, { color: "#4CAF50" }]}>
                     LIKE ✨
                  </Text>
               </Animated.View>
               <Animated.View
                  style={[
                     styles.swipeLabel,
                     styles.passLabel,
                     { opacity: passOpacity },
                  ]}
               >
                  <Text style={[styles.swipeLabelText, { color: "#E05C5C" }]}>
                     PASS
                  </Text>
               </Animated.View>
            </>
         )}

         {/* Card info overlay */}
         <View style={styles.cardInfo}>
            {/* Guna score badge */}
            <View style={[styles.scoreBadge, { borderColor: vc.color }]}>
               <Text style={styles.scoreBadgeEmoji}>{vc.emoji}</Text>
               <Text style={[styles.scoreBadgeText, { color: vc.color }]}>
                  {profile.compatibility.totalScore}/36
               </Text>
               <Text style={[styles.scoreBadgeVerdict, { color: vc.color }]}>
                  {profile.compatibility.verdict}
               </Text>
            </View>

            {/* Name & age */}
            <Text style={styles.cardName}>
               {profile.user.name}, {profile.user.age}
            </Text>

            {/* Cosmic details */}
            <View
               style={[
                  styles.cosmicRow,
                  { backgroundColor: "rgba(0,0,0,0.5)" },
               ]}
            >
               <Text style={styles.cosmicNakshatra}>
                  {profile.user.cosmicCard.nakshatra}
               </Text>
               <View style={styles.cosmicDot} />
               <Text style={[styles.cosmicGana, { color: gc.color }]}>
                  {profile.user.cosmicCard.gana}
               </Text>
               <View style={styles.cosmicDot} />
               <Text style={styles.cosmicAnimal}>
                  🐾 {profile.user.cosmicCard.animal}
               </Text>
            </View>

            {/* Top compatibility highlights */}
            <View style={styles.highlights}>
               {profile.compatibility.highlights?.slice(0, 3).map((h) => (
                  <View
                     key={h.name}
                     style={[
                        styles.highlightPill,
                        h.score === h.max && { borderColor: COLORS.gold },
                     ]}
                  >
                     <Text
                        style={[
                           styles.highlightText,
                           h.score === h.max && { color: COLORS.gold },
                        ]}
                     >
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

            {/* Guna score bar */}
            <View style={styles.gunaBar}>
               <View style={styles.gunaBarTrack}>
                  <View
                     style={[
                        styles.gunaBarFill,
                        {
                           width: `${(profile.compatibility.totalScore / 36) * 100}%`,
                           backgroundColor: vc.color,
                        },
                     ]}
                  />
               </View>
            </View>
         </View>
      </Animated.View>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DISCOVER SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
   const dispatch = useDispatch();
   const profiles = useSelector(selectProfiles);
   const loading = useSelector(selectDiscoverLoading);
   const isEmpty = useSelector(selectIsEmpty);

   // Fetch profiles on mount
   useEffect(() => {
      console.log("[DISCOVER] Component mounted — fetching profiles...");
      dispatch(fetchProfiles());
   }, []);

   // Auto-refetch when deck is running low (< 2 cards left)
   useEffect(() => {
      if (!loading && profiles.length <= 2 && profiles.length > 0) {
         console.log(
            "[DISCOVER] Deck running low, prefetching more profiles...",
         );
         dispatch(fetchProfiles());
      }
   }, [profiles.length]);

   const handleLike = useCallback(
      async (profile) => {
         const userId = profile.user.id;

         // 1. Optimistically remove from deck immediately (smooth UX)
         dispatch(removeProfile(userId));

         // 2. Call API
         const result = await dispatch(likeProfile(userId));

         if (likeProfile.fulfilled.match(result)) {
            const data = result.payload;
            if (data.isMatch) {
               console.log(`[DISCOVER] 🎉 Match with ${profile.user.name}!`);

               // Add to matches list in Redux
               dispatch(
                  addMatch({
                     matchId: data.matchId,
                     matchedAt: new Date().toISOString(),
                     unreadCount: 0,
                     user: {
                        name: profile.user.name,
                        photo: profile.user.photos?.[0] || null,
                        cosmicCard: {
                           nakshatra: profile.user.cosmicCard.nakshatra,
                        },
                     },
                     compatibility: {
                        gunaScore: profile.compatibility.totalScore,
                        verdict: profile.compatibility.verdict,
                     },
                  }),
               );

               Alert.alert(
                  "💫 Cosmic Match!",
                  `You and ${profile.user.name} are cosmically connected!\n\n${profile.compatibility.totalScore}/36 Gunas — ${profile.compatibility.verdict}`,
                  [{ text: "Amazing! ✨", style: "default" }],
               );
            }
         }
      },
      [dispatch],
   );

   const handlePass = useCallback(
      (profile) => {
         const userId = profile.user.id;
         dispatch(removeProfile(userId));
         dispatch(passProfile(userId));
      },
      [dispatch],
   );

   // Show top 3 cards stacked (index 0 = topmost)
   const visibleProfiles = profiles.slice(0, 3);

   return (
      <View style={styles.container}>
         {/* Header */}
         <View style={styles.header}>
            <Text style={styles.headerLogo}>🔮</Text>
            <Text style={styles.headerTitle}>DISCOVER</Text>
         </View>

         {/* Card Deck */}
         <View style={styles.deck}>
            {loading ? (
               <View style={styles.centerState}>
                  <ActivityIndicator color={COLORS.gold} size="large" />
                  <Text style={styles.centerText}>Reading the stars...</Text>
               </View>
            ) : isEmpty ? (
               <View style={styles.centerState}>
                  <Text style={styles.emptyEmoji}>🌌</Text>
                  <Text style={styles.emptyTitle}>You've seen everyone!</Text>
                  <Text style={styles.emptySubtitle}>
                     Check back later as new cosmic souls join
                  </Text>
                  <TouchableOpacity
                     style={styles.refreshBtn}
                     onPress={() => dispatch(fetchProfiles())}
                  >
                     <Text style={styles.refreshBtnText}>Refresh ✨</Text>
                  </TouchableOpacity>
               </View>
            ) : profiles.length === 0 ? (
               <View style={styles.centerState}>
                  <ActivityIndicator color={COLORS.gold} size="large" />
               </View>
            ) : (
               // Render cards in reverse so top card is last (rendered on top)
               [...visibleProfiles]
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

         {/* Action buttons (like/pass) */}
         {!loading && !isEmpty && profiles.length > 0 && (
            <View style={styles.actions}>
               <TouchableOpacity
                  style={[styles.actionBtn, styles.passBtn]}
                  onPress={() => handlePass(profiles[0])}
                  activeOpacity={0.8}
               >
                  <Text style={styles.passIcon}>✕</Text>
               </TouchableOpacity>

               <View style={styles.countBadge}>
                  <Text style={styles.countText}>{profiles.length}</Text>
                  <Text style={styles.countLabel}>profiles</Text>
               </View>

               <TouchableOpacity
                  style={[styles.actionBtn, styles.likeBtn]}
                  onPress={() => handleLike(profiles[0])}
                  activeOpacity={0.8}
               >
                  <Text style={styles.likeIcon}>✦</Text>
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
      paddingHorizontal: SPACING.xl,
      paddingTop: 56,
      paddingBottom: SPACING.md,
      gap: SPACING.sm,
   },
   headerLogo: { fontSize: 22 },
   headerTitle: {
      fontFamily: FONTS.headingBold,
      fontSize: 16,
      color: COLORS.gold,
      letterSpacing: 4,
      flex: 1,
   },
   deck: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
   },
   card: {
      position: "absolute",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      backgroundColor: COLORS.bgCard,
      // Shadow for card depth
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
   },
   cardPhoto: {
      width: "100%",
      height: "100%",
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
   },
   photoPlaceholder: { fontSize: 100, opacity: 0.4 },
   photoNakshatraEmoji: { fontSize: 40, marginTop: 8 },
   cardOverlay: {
      ...StyleSheet.absoluteFillObject, // shorthand for position:absolute + all 0
      backgroundColor: "transparent",
      // Gradient-like bottom overlay using linear gradient (or just semi-transparent)
      // For a real gradient, use expo-linear-gradient package
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
      fontSize: 22,
      letterSpacing: 2,
   },
   cardInfo: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: SPACING.md,
      backgroundColor: "rgba(10, 11, 20, 0.85)",
      paddingTop: SPACING.lg,
   },
   scoreBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      alignSelf: "flex-start",
      backgroundColor: "rgba(0,0,0,0.4)",
      marginBottom: SPACING.sm,
   },
   scoreBadgeEmoji: { fontSize: 14 },
   scoreBadgeText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 15,
   },
   scoreBadgeVerdict: {
      fontFamily: FONTS.body,
      fontSize: 11,
      opacity: 0.8,
   },
   cardName: {
      fontFamily: FONTS.headingBold,
      fontSize: 24,
      color: COLORS.textPrimary,
      marginBottom: SPACING.xs,
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
      backgroundColor: "rgba(255,255,255,0.3)",
   },
   cosmicGana: { fontFamily: FONTS.bodyMedium, fontSize: 13 },
   cosmicAnimal: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
   },
   highlights: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
      marginBottom: SPACING.sm,
   },
   highlightPill: {
      backgroundColor: "rgba(0,0,0,0.4)",
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
   gunaBar: { marginTop: 2 },
   gunaBarTrack: {
      height: 3,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderRadius: 2,
      overflow: "hidden",
   },
   gunaBarFill: { height: 3, borderRadius: 2 },
   actions: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.xl,
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
      borderWidth: 2,
      borderColor: "#E05C5C",
   },
   likeBtn: {
      backgroundColor: COLORS.gold,
      elevation: 12,
   },
   passIcon: { fontSize: 24, color: "#E05C5C" },
   likeIcon: { fontSize: 24, color: COLORS.bg },
   countBadge: { alignItems: "center" },
   countText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 20,
      color: COLORS.gold,
   },
   countLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 1,
   },
   centerState: {
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
   },
   centerText: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: COLORS.textSecondary,
      marginTop: SPACING.md,
   },
   emptyEmoji: { fontSize: 64, marginBottom: SPACING.md },
   emptyTitle: {
      fontFamily: FONTS.heading,
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: SPACING.sm,
   },
   emptySubtitle: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: "center",
      marginBottom: SPACING.xl,
   },
   refreshBtn: {
      borderWidth: 1,
      borderColor: COLORS.gold,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
   },
   refreshBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.gold,
   },
});
