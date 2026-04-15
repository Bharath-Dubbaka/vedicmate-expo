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

import { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Animated, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { usePremium, PRICING } from '../hooks/usePremium';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  { emoji: '∞',  title: 'Unlimited Swipes',    sub: 'No daily limit — swipe as much as you want',                         highlight: true },
  { emoji: '👁', title: 'See Who Liked You',    sub: 'Full unblurred list of everyone who liked your profile',             highlight: true },
  { emoji: '👤', title: 'Profile Views',        sub: 'See who viewed your profile in the last 30 days',                   highlight: false },
  { emoji: '🚀', title: 'Profile Boost',        sub: 'Appear at the top of Discover for 30 minutes — once a week',       highlight: false },
  { emoji: '🔮', title: 'Deep Kundli Reports',  sub: 'Full compatibility PDF for every match',                            highlight: false },
];

function FeatureRow({ emoji, title, sub, highlight }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: highlight ? COLORS.gold + '08' : COLORS.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: highlight ? COLORS.gold + '40' : COLORS.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: highlight ? COLORS.gold + '20' : COLORS.bgCard, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 14, color: highlight ? COLORS.textPrimary : COLORS.textSecondary, marginBottom: 1 }}>{title}</Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textDim, lineHeight: 16 }}>{sub}</Text>
      </View>
      {highlight && <Text style={{ fontSize: 16, color: COLORS.gold }}>✓</Text>}
    </View>
  );
}

function PlanCard({ plan, selected, onSelect }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const info = PRICING[plan];
  return (
    <TouchableOpacity style={{ flex: 1, backgroundColor: selected ? COLORS.gold + '10' : COLORS.bgElevated, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: selected ? COLORS.gold : COLORS.border, padding: SPACING.md, alignItems: 'center', position: 'relative', minHeight: 100, justifyContent: 'center' }}
      onPress={() => onSelect(plan)} activeOpacity={0.8}>
      {info.savingsLabel && (
        <View style={{ position: 'absolute', top: -10, backgroundColor: COLORS.gold, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.bg }}>{info.savingsLabel}</Text>
        </View>
      )}
      <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: selected ? COLORS.gold : COLORS.textDim, letterSpacing: 1, marginBottom: 4 }}>{info.label}</Text>
      <Text style={{ fontFamily: FONTS.headingBold, fontSize: 22, color: selected ? COLORS.gold : COLORS.textPrimary }}>{info.price}</Text>
      <Text style={{ fontFamily: FONTS.body, fontSize: 10, color: selected ? COLORS.textSecondary : COLORS.textDim, marginTop: 2, textAlign: 'center' }}>
        /{info.period}{info.monthlyEquivalent ? `  ·  ${info.monthlyEquivalent}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

export default function PaywallModal({ visible, onClose, triggerReason }) {
  const { purchase, restore, isPremium, isLoading: premiumLoading } = usePremium();
  const { COLORS, FONTS, SPACING, RADIUS, isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.loop(Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
        ])),
      ]).start();
    } else { slideAnim.setValue(height); }
  }, [visible]);

  useEffect(() => { if (isPremium && visible) onClose?.(); }, [isPremium, visible]);

  const handlePurchase = async () => {
    setPurchasing(true);
    const result = await purchase(selectedPlan);
    setPurchasing(false);
    if (result.success) onClose?.();
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);
    if (result.success) onClose?.();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, isDark ? 0.3 : 0.15] });

  const triggerMessages = {
    swipe_limit: 'You\'ve used all 15 free swipes today',
    liked_you: 'Upgrade to see who liked you',
    profile_views: 'Upgrade to see who viewed your profile',
    boost: 'Upgrade to boost your profile',
    default: 'Unlock the full VedicFind experience',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: COLORS.modalBg, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

        <Animated.View style={{ backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.xl + 8, borderTopRightRadius: RADIUS.xl + 8, maxHeight: height * 0.92, overflow: 'hidden', transform: [{ translateY: slideAnim }] }}>
          {/* Glow */}
          <Animated.View style={{ position: 'absolute', top: -80, alignSelf: 'center', width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.gold, opacity: glowOpacity }} />
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 8 }}>
            {/* Header */}
            <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>👑</Text>
              <Text style={{ fontFamily: FONTS.headingBold, fontSize: 26, color: COLORS.gold, letterSpacing: 1, marginBottom: SPACING.sm }}>VedicFind Premium</Text>
              {triggerReason && triggerReason !== 'default' && (
                <View style={{ backgroundColor: COLORS.gold + '18', borderRadius: 999, borderWidth: 1, borderColor: COLORS.gold + '40', paddingHorizontal: SPACING.md, paddingVertical: 5, marginBottom: SPACING.sm }}>
                  <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.goldLight, textAlign: 'center' }}>{triggerMessages[triggerReason]}</Text>
                </View>
              )}
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' }}>Unlimited cosmic connections await</Text>
            </View>

            {/* Plan selector */}
            <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl }}>
              {['monthly', 'annual'].map((plan) => <PlanCard key={plan} plan={plan} selected={selectedPlan === plan} onSelect={setSelectedPlan} />)}
            </View>

            {/* Features */}
            <View style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
              {PREMIUM_FEATURES.map((f) => <FeatureRow key={f.title} {...f} />)}
            </View>

            {/* CTA */}
            <TouchableOpacity style={{ backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4, alignItems: 'center', marginBottom: SPACING.md, elevation: 10, shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, opacity: purchasing ? 0.7 : 1 }}
              onPress={handlePurchase} disabled={purchasing || restoring} activeOpacity={0.85}>
              {purchasing ? <ActivityIndicator color={COLORS.bg} /> : (
                <>
                  <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 17, color: COLORS.bg }}>Start {selectedPlan === 'annual' ? 'Annual' : 'Monthly'} — {PRICING[selectedPlan].price}</Text>
                  <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.bg, opacity: 0.7, marginTop: 2 }}>Cancel anytime</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Text style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.textDim, textAlign: 'center', lineHeight: 15, marginBottom: SPACING.md }}>
              Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Manage in your Google Play account settings.
            </Text>

            {/* Restore */}
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: SPACING.sm }} onPress={handleRestore} disabled={restoring}>
              {restoring ? <ActivityIndicator size="small" color={COLORS.textDim} /> : <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textDim, textDecorationLine: 'underline' }}>Restore Purchases</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
