// app/(tabs)/discover.jsx
import { useEffect, useRef, useCallback, useState } from "react";
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
   Modal,
   ScrollView,
   Pressable,
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
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";
import { matchingAPI } from "../../services/api";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "./paywall";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - SPACING.xl * 2;
const CARD_HEIGHT = height * 0.62;
const SWIPE_THRESHOLD = width * 0.35;

// ── Config ─────────────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
   "Excellent Match": { color: "#C9A84C", emoji: "🌟", barColor: "#C9A84C" },
   "Good Match": { color: "#4CAF50", emoji: "💚", barColor: "#4CAF50" },
   "Average Match": { color: "#7B8CDE", emoji: "💙", barColor: "#7B8CDE" },
   "Challenging Match": { color: "#FF9800", emoji: "⚠️", barColor: "#FF9800" },
};

const GANA_CONFIG = {
   Deva: {
      color: "#A78BFA",
      bg: "rgba(167,139,250,0.15)",
      emoji: "✨",
      label: "Divine Soul",
   },
   Manushya: {
      color: "#60A5FA",
      bg: "rgba(96,165,250,0.15)",
      emoji: "🤝",
      label: "Human Heart",
   },
   Rakshasa: {
      color: "#F87171",
      bg: "rgba(248,113,113,0.15)",
      emoji: "🔥",
      label: "Fierce Spirit",
   },
};

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

// ── Compatibility Modal ─────────────────────────────────────────────────────
function CompatibilityModal({ visible, profile, onClose }) {
   if (!profile) return null;

   const vc =
      VERDICT_CONFIG[profile.compatibility.verdict] ||
      VERDICT_CONFIG["Average Match"];
   const gc = GANA_CONFIG[profile.user.cosmicCard.gana] || GANA_CONFIG.Manushya;
   const pct = Math.round((profile.compatibility.totalScore / 36) * 100);

   return (
      <Modal
         visible={visible}
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={onClose}
      >
         <View style={modal.container}>
            {/* Handle bar */}
            <View style={modal.handle} />

            <ScrollView
               style={{ flex: 1 }}
               contentContainerStyle={modal.scroll}
               showsVerticalScrollIndicator={false}
            >
               {/* Header — name + verdict */}
               <View style={modal.header}>
                  <View style={modal.headerLeft}>
                     <Text style={modal.personName}>
                        {profile.user.name}, {profile.user.age}
                     </Text>
                     <Text style={modal.personSub}>
                        {profile.user.cosmicCard.nakshatra} ·{" "}
                        {profile.user.cosmicCard.rashi} Moon
                     </Text>
                  </View>
                  <View style={[modal.verdictBadge, { borderColor: vc.color }]}>
                     <Text style={modal.verdictEmoji}>{vc.emoji}</Text>
                     <View>
                        <Text style={[modal.verdictScore, { color: vc.color }]}>
                           {profile.compatibility.totalScore}/36
                        </Text>
                        <Text style={[modal.verdictLabel, { color: vc.color }]}>
                           {profile.compatibility.verdict}
                        </Text>
                     </View>
                  </View>
               </View>

               {/* Score arc / big number */}
               <View style={modal.scoreHero}>
                  <View style={[modal.scoreCircle, { borderColor: vc.color }]}>
                     <Text style={[modal.scoreNumber, { color: vc.color }]}>
                        {pct}%
                     </Text>
                     <Text style={modal.scoreLabel}>compatible</Text>
                  </View>

                  {/* Cosmic identity row */}
                  <View style={modal.cosmicIdentity}>
                     <View
                        style={[
                           modal.ganaChip,
                           { backgroundColor: gc.bg, borderColor: gc.color },
                        ]}
                     >
                        <Text style={modal.ganaChipEmoji}>{gc.emoji}</Text>
                        <Text style={[modal.ganaChipText, { color: gc.color }]}>
                           {profile.user.cosmicCard.gana} · {gc.label}
                        </Text>
                     </View>
                     <View style={modal.cosmicDetails}>
                        <Text style={modal.cosmicDetail}>
                           🐾 {profile.user.cosmicCard.animal}
                        </Text>
                        <Text style={modal.cosmicDetailDot}>·</Text>
                        <Text style={modal.cosmicDetail}>
                           🌙 {profile.user.cosmicCard.rashi}
                        </Text>
                        <Text style={modal.cosmicDetailDot}>·</Text>
                        <Text style={modal.cosmicDetail}>
                           💫 {profile.user.cosmicCard.nadi}
                        </Text>
                     </View>
                  </View>
               </View>

               {/* 8 Koota breakdown */}
               <Text style={modal.sectionTitle}>ASHTA KOOTA BREAKDOWN</Text>
               <View style={modal.kootaCard}>
                  {KOOTA_LIST.map((k, idx) => {
                     const entry = profile.compatibility.breakdown?.[k.key];
                     const score = entry?.score ?? 0;
                     const maxVal = entry?.max ?? k.max;
                     const isPerfect = score === maxVal;
                     const isZero = score === 0;
                     const barPct = (score / maxVal) * 100;
                     const barColor = isPerfect
                        ? COLORS.gold
                        : isZero
                          ? "#E05C5C"
                          : vc.color;

                     return (
                        <View
                           key={k.key}
                           style={[
                              modal.kootaRow,
                              idx < KOOTA_LIST.length - 1 &&
                                 modal.kootaRowBorder,
                           ]}
                        >
                           <Text style={modal.kootaEmoji}>{k.emoji}</Text>
                           <View style={{ flex: 1 }}>
                              <View style={modal.kootaTopRow}>
                                 <Text style={modal.kootaName}>{k.name}</Text>
                                 <Text
                                    style={[
                                       modal.kootaScore,
                                       isPerfect && { color: COLORS.gold },
                                       isZero && { color: "#E05C5C" },
                                    ]}
                                 >
                                    {score}/{maxVal}
                                    {isPerfect ? " ✓" : isZero ? " ✕" : ""}
                                 </Text>
                              </View>
                              <View style={modal.kootaBarTrack}>
                                 <View
                                    style={[
                                       modal.kootaBarFill,
                                       {
                                          width: `${barPct}%`,
                                          backgroundColor: barColor,
                                       },
                                    ]}
                                 />
                              </View>
                           </View>
                        </View>
                     );
                  })}
               </View>

               {/* Doshas section */}
               {profile.compatibility.doshas?.length > 0 && (
                  <>
                     <Text style={modal.sectionTitle}>DOSHAS</Text>
                     <View style={modal.doshaCard}>
                        {profile.compatibility.doshas.map((d, i) => (
                           <View
                              key={i}
                              style={[
                                 modal.doshaRow,
                                 i < profile.compatibility.doshas.length - 1 &&
                                    modal.doshaRowBorder,
                              ]}
                           >
                              <View style={modal.doshaBadge}>
                                 <Text style={modal.doshaBadgeText}>
                                    {d.severity === "high" ? "⚠️" : "ℹ️"}
                                 </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                 <Text style={modal.doshaName}>{d.name}</Text>
                                 <Text style={modal.doshaDesc}>
                                    {d.description}
                                 </Text>
                                 {d.cancellation && (
                                    <Text style={modal.doshaCancelled}>
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
               {profile.compatibility.highlights?.length > 0 && (
                  <>
                     <Text style={modal.sectionTitle}>TOP STRENGTHS</Text>
                     <View style={modal.highlightsRow}>
                        {profile.compatibility.highlights
                           .slice(0, 4)
                           .map((h) => (
                              <View
                                 key={h.name}
                                 style={[
                                    modal.strengthChip,
                                    h.score === h.max && {
                                       borderColor: COLORS.gold,
                                       backgroundColor: "rgba(201,168,76,0.1)",
                                    },
                                 ]}
                              >
                                 <Text
                                    style={[
                                       modal.strengthScore,
                                       h.score === h.max && {
                                          color: COLORS.gold,
                                       },
                                    ]}
                                 >
                                    {h.score}/{h.max}
                                 </Text>
                                 <Text style={modal.strengthName}>
                                    {h.name}
                                 </Text>
                              </View>
                           ))}
                     </View>
                  </>
               )}

               <View style={{ height: 40 }} />
            </ScrollView>

            {/* Action buttons */}
            <View style={modal.footer}>
               <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
                  <Text style={modal.closeBtnText}>Close</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
   );
}

// ── Swipe Card ──────────────────────────────────────────────────────────────
function SwipeCard({ profile, onLike, onPass, isTop, onOpenReport }) {
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
      }),
   ).current;

   const vc =
      VERDICT_CONFIG[profile.compatibility.verdict] ||
      VERDICT_CONFIG["Average Match"];
   const gc = GANA_CONFIG[profile.user.cosmicCard.gana] || GANA_CONFIG.Manushya;

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
         {/* Photo area */}
         <View style={[styles.cardPhoto, { backgroundColor: gc.bg }]}>
            <Text style={styles.photoPlaceholder}>👤</Text>
            <Text style={styles.photoNakshatraEmoji}>
               {profile.user.cosmicCard.nakshatra?.split(" ")[0] || "🌟"}
            </Text>
         </View>

         {/* LIKE / PASS labels */}
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
            {/* Name + age */}
            <View style={styles.nameRow}>
               <Text style={styles.cardName}>
                  {profile.user.name}, {profile.user.age}
               </Text>
               {/* Guna score badge */}
               <View style={[styles.scoreBadge, { borderColor: vc.color }]}>
                  <Text style={styles.scoreBadgeEmoji}>{vc.emoji}</Text>
                  <Text style={[styles.scoreBadgeText, { color: vc.color }]}>
                     {profile.compatibility.totalScore}/36
                  </Text>
               </View>
            </View>

            {/* ── Cosmic Identity Panel ── */}
            <View
               style={[styles.cosmicPanel, { borderColor: gc.color + "40" }]}
            >
               {/* Row 1: Nakshatra + Rashi */}
               <View style={styles.cosmicPanelRow}>
                  <Text style={styles.cosmicNakshatraSymbol}>
                     {profile.user.cosmicCard.nakshatra?.split(" ")[0]}
                  </Text>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.cosmicNakshatraName}>
                        {profile.user.cosmicCard.nakshatra
                           ?.split(" ")
                           .slice(1)
                           .join(" ") || profile.user.cosmicCard.nakshatra}
                     </Text>
                     <Text style={styles.cosmicRashi}>
                        {profile.user.cosmicCard.rashi} Moon · Pada{" "}
                        {profile.user.cosmicCard.pada}
                     </Text>
                  </View>
                  {/* Gana badge */}
                  <View style={[styles.ganaBadge, { backgroundColor: gc.bg }]}>
                     <Text style={styles.ganaEmoji}>{gc.emoji}</Text>
                     <Text style={[styles.ganaText, { color: gc.color }]}>
                        {profile.user.cosmicCard.gana}
                     </Text>
                  </View>
               </View>

               {/* Row 2: Animal + Nadi + Varna */}
               <View style={styles.cosmicTagRow}>
                  <View style={styles.cosmicTag}>
                     <Text style={styles.cosmicTagText}>
                        🐾 {profile.user.cosmicCard.animal}
                     </Text>
                  </View>
                  <View style={styles.cosmicTag}>
                     <Text style={styles.cosmicTagText}>
                        🌊 {profile.user.cosmicCard.nadi}
                     </Text>
                  </View>
                  <View style={styles.cosmicTag}>
                     <Text style={styles.cosmicTagText}>
                        🪐 {profile.user.cosmicCard.lordPlanet}
                     </Text>
                  </View>
               </View>

               {/* Row 3: Mini koota bars (top 3) */}
               <View style={styles.miniKootas}>
                  {KOOTA_LIST.slice(0, 3).map((k) => {
                     const entry = profile.compatibility.breakdown?.[k.key];
                     const score = entry?.score ?? 0;
                     const maxVal = entry?.max ?? k.max;
                     const barPct = (score / maxVal) * 100;
                     const barCol =
                        score === maxVal
                           ? COLORS.gold
                           : score === 0
                             ? "#E05C5C"
                             : vc.color;
                     return (
                        <View key={k.key} style={styles.miniKootaItem}>
                           <Text style={styles.miniKootaLabel}>
                              {k.emoji} {k.name}
                           </Text>
                           <View style={styles.miniKootaTrack}>
                              <View
                                 style={[
                                    styles.miniKootaFill,
                                    {
                                       width: `${barPct}%`,
                                       backgroundColor: barCol,
                                    },
                                 ]}
                              />
                           </View>
                           <Text
                              style={[styles.miniKootaScore, { color: barCol }]}
                           >
                              {score}/{maxVal}
                           </Text>
                        </View>
                     );
                  })}
               </View>

               {/* Tap to expand */}
               <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => isTop && onOpenReport(profile)}
                  activeOpacity={0.7}
               >
                  <Text style={styles.expandBtnText}>
                     View full compatibility report ›
                  </Text>
               </TouchableOpacity>
            </View>

            {/* Guna bar */}
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

// ── Main Discover Screen ────────────────────────────────────────────────────
export default function DiscoverScreen() {
   const dispatch = useDispatch();
   const profiles = useSelector(selectProfiles);
   const loading = useSelector(selectDiscoverLoading);
   const isEmpty = useSelector(selectIsEmpty);
   const swipeLimitReached = useSelector(selectSwipeLimitReached);
   const [showPaywall, setShowPaywall] = useState(false);
   const {
      isPremium,
      swipesRemaining,
      swipesAllowed,
      decrementSwipe,
      refresh,
   } = usePremium();
   const [reportProfile, setReportProfile] = useState(null);

   useEffect(() => {
      dispatch(fetchProfiles());
   }, []);

   //This stops refetching when server confirmed 0 results.
   //Users swipe through all 10, deck empties, one fetch happens, new batch loads. Clean.
   useEffect(() => {
      if (!loading && !isEmpty && profiles.length === 0) {
         dispatch(fetchProfiles());
      }
      //stops premature refetch
   }, [profiles.length, loading, isEmpty]);

   useEffect(() => {
      if (swipeLimitReached) {
         setShowPaywall(true);
         dispatch(resetSwipeLimit());
      }
   }, [swipeLimitReached]);

   // When a new card becomes visible, record the view
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
               [{ text: "Amazing! ✨" }],
            );
         }
      },
      [dispatch, swipesAllowed, isPremium, decrementSwipe],
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
      [dispatch, swipesAllowed, isPremium, decrementSwipe],
   );

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

         {/* Compatibility modal */}
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

// ── Styles ──────────────────────────────────────────────────────────────────
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
   deck: { flex: 1, alignItems: "center", justifyContent: "center" },
   card: {
      position: "absolute",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      backgroundColor: COLORS.bgCard,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
   },
   cardPhoto: {
      width: "100%",
      height: "55%",
      alignItems: "center",
      justifyContent: "center",
   },
   photoPlaceholder: { fontSize: 80, opacity: 0.4 },
   photoNakshatraEmoji: { fontSize: 36, marginTop: 6 },
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

   // ── Card info ──
   cardInfo: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(10,11,20,0.92)",
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
   },
   nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.sm,
   },
   cardName: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
   },
   scoreBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1.5,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      backgroundColor: "rgba(0,0,0,0.4)",
   },
   scoreBadgeEmoji: { fontSize: 12 },
   scoreBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 14 },

   // ── Cosmic panel ──
   cosmicPanel: {
      borderWidth: 1,
      borderRadius: RADIUS.lg,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
      backgroundColor: "rgba(255,255,255,0.04)",
   },
   cosmicPanelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.xs,
   },
   cosmicNakshatraSymbol: { fontSize: 28 },
   cosmicNakshatraName: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textPrimary,
      lineHeight: 18,
   },
   cosmicRashi: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
   },
   ganaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: RADIUS.md,
   },
   ganaEmoji: { fontSize: 12 },
   ganaText: { fontFamily: FONTS.bodyMedium, fontSize: 11 },
   cosmicTagRow: {
      flexDirection: "row",
      gap: SPACING.xs,
      marginBottom: SPACING.sm,
      flexWrap: "wrap",
   },
   cosmicTag: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: RADIUS.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
   },
   cosmicTagText: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
   },

   // ── Mini koota bars ──
   miniKootas: { gap: 5, marginBottom: SPACING.sm },
   miniKootaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
   },
   miniKootaLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
      width: 80,
   },
   miniKootaTrack: {
      flex: 1,
      height: 3,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 2,
      overflow: "hidden",
   },
   miniKootaFill: { height: 3, borderRadius: 2 },
   miniKootaScore: {
      fontFamily: FONTS.bodyBold,
      fontSize: 11,
      width: 28,
      textAlign: "right",
   },

   expandBtn: {
      alignItems: "center",
      paddingVertical: 4,
   },
   expandBtnText: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.gold,
      opacity: 0.8,
   },

   gunaBar: { marginTop: 2 },
   gunaBarTrack: {
      height: 2,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 1,
      overflow: "hidden",
   },
   gunaBarFill: { height: 2, borderRadius: 1 },

   // ── Actions ──
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
   likeBtn: { backgroundColor: COLORS.gold, elevation: 12 },
   passIcon: { fontSize: 24, color: "#E05C5C" },
   likeIcon: { fontSize: 24, color: COLORS.bg },
   countBadge: { alignItems: "center" },
   countText: { fontFamily: FONTS.bodyBold, fontSize: 20, color: COLORS.gold },
   countLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 1,
   },

   // ── Empty / loading states ──
   centerState: { alignItems: "center", paddingHorizontal: SPACING.xl },
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

// ── Modal styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   handle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 4,
   },
   scroll: { padding: SPACING.xl },
   header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SPACING.lg,
   },
   headerLeft: { flex: 1, marginRight: SPACING.md },
   personName: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: 2,
   },
   personSub: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   verdictBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      borderWidth: 1.5,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: "rgba(0,0,0,0.3)",
   },
   verdictEmoji: { fontSize: 18 },
   verdictScore: { fontFamily: FONTS.bodyBold, fontSize: 16 },
   verdictLabel: { fontFamily: FONTS.body, fontSize: 11 },

   scoreHero: { alignItems: "center", marginBottom: SPACING.xl },
   scoreCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2.5,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.md,
      backgroundColor: "rgba(255,255,255,0.03)",
   },
   scoreNumber: { fontFamily: FONTS.headingBold, fontSize: 26 },
   scoreLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
   },
   cosmicIdentity: { alignItems: "center", gap: SPACING.sm, width: "100%" },
   ganaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      borderRadius: RADIUS.full,
      borderWidth: 1,
   },
   ganaChipEmoji: { fontSize: 14 },
   ganaChipText: { fontFamily: FONTS.bodyMedium, fontSize: 13 },
   cosmicDetails: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
   },
   cosmicDetail: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   cosmicDetailDot: {
      color: COLORS.textDim,
      fontSize: 13,
   },

   sectionTitle: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: SPACING.sm,
   },

   // Koota breakdown card
   kootaCard: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: SPACING.xl,
      overflow: "hidden",
   },
   kootaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: 10,
   },
   kootaRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   kootaEmoji: { fontSize: 16, width: 22 },
   kootaTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
   },
   kootaName: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
   },
   kootaScore: {
      fontFamily: FONTS.bodyBold,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   kootaBarTrack: {
      height: 4,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   kootaBarFill: { height: 4, borderRadius: 2 },

   // Doshas
   doshaCard: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: "#FF980040",
      marginBottom: SPACING.xl,
      overflow: "hidden",
   },
   doshaRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      padding: SPACING.md,
   },
   doshaRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   doshaBadge: { paddingTop: 2 },
   doshaBadgeText: { fontSize: 16 },
   doshaName: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
      marginBottom: 2,
   },
   doshaDesc: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      lineHeight: 18,
   },
   doshaCancelled: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: "#4CAF50",
      marginTop: 4,
   },

   // Highlights / strengths
   highlightsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.xl,
   },
   strengthChip: {
      flex: 1,
      minWidth: "44%",
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.md,
      alignItems: "center",
   },
   strengthScore: {
      fontFamily: FONTS.headingBold,
      fontSize: 18,
      color: COLORS.textSecondary,
      marginBottom: 2,
   },
   strengthName: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
   },

   // Footer
   footer: {
      padding: SPACING.xl,
      paddingBottom: 40,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
   },
   closeBtn: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      alignItems: "center",
   },
   closeBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 15,
      color: COLORS.textSecondary,
   },
});
