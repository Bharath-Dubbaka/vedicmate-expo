// app/(tabs)/paywall.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 3 — Paywall / Premium screen
//
// Usage as a Modal (recommended — push from any screen):
//   import PaywallModal from "@components/PaywallModal";
//   <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
//
// OR as a standalone screen:
//   router.push("/(tabs)/premium");
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Modal,
   ScrollView,
   Animated,
   Dimensions,
   ActivityIndicator,
   Platform,
} from "react-native";
import { usePremium, PRICING } from "../hooks/usePremium";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

// ── Feature list shown on the paywall ────────────────────────────────────────
const PREMIUM_FEATURES = [
   {
      emoji: "∞",
      title: "Unlimited Swipes",
      sub: "No daily limit — swipe as much as you want",
      highlight: true,
   },
   {
      emoji: "👁",
      title: "See Who Liked You",
      sub: "Full unblurred list of everyone who liked your profile",
      highlight: true,
   },
   {
      emoji: "👤",
      title: "Profile Views",
      sub: "See who viewed your profile in the last 30 days",
      highlight: false,
   },
   {
      emoji: "🚀",
      title: "Profile Boost",
      sub: "Appear at the top of everyone's Discover for 30 minutes",
      highlight: false,
   },
   {
      emoji: "🔮",
      title: "Deep Kundli Reports",
      sub: "Full compatibility PDF for every match",
      highlight: false,
   },
];

// ── Single feature row ────────────────────────────────────────────────────────
function FeatureRow({ emoji, title, sub, highlight }) {
   return (
      <View style={[feat.row, highlight && feat.rowHighlight]}>
         <View style={[feat.iconWrap, highlight && feat.iconWrapHighlight]}>
            <Text style={feat.icon}>{emoji}</Text>
         </View>
         <View style={feat.text}>
            <Text style={[feat.title, highlight && feat.titleHighlight]}>
               {title}
            </Text>
            <Text style={feat.sub}>{sub}</Text>
         </View>
         {highlight && <Text style={feat.check}>✓</Text>}
      </View>
   );
}

// ── Plan toggle button ────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }) {
   const info = PRICING[plan];
   return (
      <TouchableOpacity
         style={[pc.card, selected && pc.cardSelected]}
         onPress={() => onSelect(plan)}
         activeOpacity={0.8}
      >
         {info.savingsLabel && (
            <View style={pc.savingsBadge}>
               <Text style={pc.savingsText}>{info.savingsLabel}</Text>
            </View>
         )}
         <Text style={[pc.label, selected && pc.labelSelected]}>
            {info.label}
         </Text>
         <Text style={[pc.price, selected && pc.priceSelected]}>
            {info.price}
         </Text>
         <Text style={[pc.period, selected && pc.periodSelected]}>
            /{info.period}
            {info.monthlyEquivalent ? `  ·  ${info.monthlyEquivalent}` : ""}
         </Text>
      </TouchableOpacity>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Paywall Modal
// ─────────────────────────────────────────────────────────────────────────────
export default function PaywallModal({ visible, onClose, triggerReason }) {
   const {
      purchase,
      restore,
      isPremium,
      isLoading: premiumLoading,
   } = usePremium();
   const [selectedPlan, setSelectedPlan] = useState("annual");
   const [purchasing, setPurchasing] = useState(false);
   const [restoring, setRestoring] = useState(false);

   // Animations
   const slideAnim = useRef(new Animated.Value(height)).current;
   const glowAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      if (visible) {
         Animated.parallel([
            Animated.spring(slideAnim, {
               toValue: 0,
               friction: 8,
               tension: 50,
               useNativeDriver: true,
            }),
            Animated.loop(
               Animated.sequence([
                  Animated.timing(glowAnim, {
                     toValue: 1,
                     duration: 2000,
                     useNativeDriver: true,
                  }),
                  Animated.timing(glowAnim, {
                     toValue: 0.4,
                     duration: 2000,
                     useNativeDriver: true,
                  }),
               ]),
            ),
         ]).start();
      } else {
         slideAnim.setValue(height);
      }
   }, [visible]);

   // Close if already premium
   useEffect(() => {
      if (isPremium && visible) onClose?.();
   }, [isPremium, visible]);

   const handlePurchase = async () => {
      setPurchasing(true);
      const result = await purchase(selectedPlan);
      setPurchasing(false);
      if (result.success) {
         onClose?.();
      }
   };

   const handleRestore = async () => {
      setRestoring(true);
      const result = await restore();
      setRestoring(false);
      if (result.success) onClose?.();
   };

   const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.35],
   });

   const triggerMessages = {
      swipe_limit: "You've used all 5 free swipes today",
      liked_you: "Upgrade to see who liked you",
      profile_views: "Upgrade to see who viewed your profile",
      boost: "Upgrade to boost your profile",
      default: "Unlock the full VedicMate experience",
   };
   const triggerMsg = triggerMessages[triggerReason] || triggerMessages.default;

   return (
      <Modal
         visible={visible}
         transparent
         animationType="fade"
         onRequestClose={onClose}
         statusBarTranslucent
      >
         <View style={s.backdrop}>
            <TouchableOpacity style={s.backdropTouch} onPress={onClose} />

            <Animated.View
               style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}
            >
               {/* Glow effect */}
               <Animated.View style={[s.glow, { opacity: glowOpacity }]} />

               {/* Handle */}
               <View style={s.handle} />

               <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={s.scroll}
               >
                  {/* Header */}
                  <View style={s.header}>
                     <Text style={s.crown}>👑</Text>
                     <Text style={s.title}>VedicMate Premium</Text>
                     {triggerReason && triggerReason !== "default" && (
                        <View style={s.triggerBadge}>
                           <Text style={s.triggerText}>{triggerMsg}</Text>
                        </View>
                     )}
                     <Text style={s.subtitle}>
                        Unlimited cosmic connections await
                     </Text>
                  </View>

                  {/* Plan selector */}
                  <View style={s.planRow}>
                     {["monthly", "annual"].map((plan) => (
                        <PlanCard
                           key={plan}
                           plan={plan}
                           selected={selectedPlan === plan}
                           onSelect={setSelectedPlan}
                        />
                     ))}
                  </View>

                  {/* Features */}
                  <View style={s.featureList}>
                     {PREMIUM_FEATURES.map((f) => (
                        <FeatureRow key={f.title} {...f} />
                     ))}
                  </View>

                  {/* CTA */}
                  <TouchableOpacity
                     style={[s.ctaBtn, purchasing && { opacity: 0.7 }]}
                     onPress={handlePurchase}
                     disabled={purchasing || restoring}
                     activeOpacity={0.85}
                  >
                     {purchasing ? (
                        <ActivityIndicator color={COLORS.bg} />
                     ) : (
                        <>
                           <Text style={s.ctaBtnText}>
                              Start{" "}
                              {selectedPlan === "annual" ? "Annual" : "Monthly"}{" "}
                              — {PRICING[selectedPlan].price}
                           </Text>
                           <Text style={s.ctaBtnSub}>Cancel anytime</Text>
                        </>
                     )}
                  </TouchableOpacity>

                  {/* Legal */}
                  <Text style={s.legal}>
                     Subscriptions auto-renew unless cancelled at least 24 hours
                     before the end of the current period. Manage or cancel in
                     your Google Play / App Store account settings.
                  </Text>

                  {/* Restore */}
                  <TouchableOpacity
                     style={s.restoreBtn}
                     onPress={handleRestore}
                     disabled={restoring}
                  >
                     {restoring ? (
                        <ActivityIndicator
                           size="small"
                           color={COLORS.textDim}
                        />
                     ) : (
                        <Text style={s.restoreText}>Restore Purchases</Text>
                     )}
                  </TouchableOpacity>

                  <View style={{ height: 20 }} />
               </ScrollView>
            </Animated.View>
         </View>
      </Modal>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
   backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "flex-end",
   },
   backdropTouch: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
   },
   sheet: {
      backgroundColor: COLORS.bgCard,
      borderTopLeftRadius: RADIUS.xl + 8,
      borderTopRightRadius: RADIUS.xl + 8,
      maxHeight: height * 0.92,
      overflow: "hidden",
   },
   glow: {
      position: "absolute",
      top: -80,
      alignSelf: "center",
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: COLORS.gold,
   },
   handle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 4,
   },
   scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 8 },

   header: { alignItems: "center", paddingVertical: SPACING.lg },
   crown: { fontSize: 48, marginBottom: SPACING.sm },
   title: {
      fontFamily: FONTS.headingBold,
      fontSize: 26,
      color: COLORS.gold,
      letterSpacing: 1,
      marginBottom: SPACING.sm,
   },
   triggerBadge: {
      backgroundColor: "rgba(240,192,96,0.15)",
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: COLORS.gold + "40",
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      marginBottom: SPACING.sm,
   },
   triggerText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      color: COLORS.goldLight,
      textAlign: "center",
   },
   subtitle: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: "center",
   },

   planRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.xl },

   featureList: {
      gap: SPACING.sm,
      marginBottom: SPACING.xl,
   },

   ctaBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md + 4,
      alignItems: "center",
      marginBottom: SPACING.md,
      elevation: 10,
      shadowColor: COLORS.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
   },
   ctaBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 17,
      color: COLORS.bg,
   },
   ctaBtnSub: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.bg,
      opacity: 0.7,
      marginTop: 2,
   },

   legal: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      textAlign: "center",
      lineHeight: 15,
      marginBottom: SPACING.md,
   },
   restoreBtn: { alignItems: "center", paddingVertical: SPACING.sm },
   restoreText: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textDim,
      textDecorationLine: "underline",
   },
});

// Plan card styles
const pc = StyleSheet.create({
   card: {
      flex: 1,
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      padding: SPACING.md,
      alignItems: "center",
      position: "relative",
      minHeight: 100,
      justifyContent: "center",
   },
   cardSelected: {
      borderColor: COLORS.gold,
      backgroundColor: "rgba(240,192,96,0.08)",
   },
   savingsBadge: {
      position: "absolute",
      top: -10,
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
   },
   savingsText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 10,
      color: COLORS.bg,
   },
   label: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
      letterSpacing: 1,
      marginBottom: 4,
   },
   labelSelected: { color: COLORS.gold },
   price: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
   },
   priceSelected: { color: COLORS.gold },
   period: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      marginTop: 2,
      textAlign: "center",
   },
   periodSelected: { color: COLORS.textSecondary },
});

// Feature row styles
const feat = StyleSheet.create({
   row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   rowHighlight: {
      borderColor: COLORS.gold + "40",
      backgroundColor: "rgba(240,192,96,0.06)",
   },
   iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: COLORS.bgCard,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
   },
   iconWrapHighlight: { backgroundColor: "rgba(240,192,96,0.15)" },
   icon: { fontSize: 18 },
   text: { flex: 1 },
   title: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textSecondary,
      marginBottom: 1,
   },
   titleHighlight: { color: COLORS.textPrimary },
   sub: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
      lineHeight: 16,
   },
   check: { fontSize: 16, color: COLORS.gold },
});
