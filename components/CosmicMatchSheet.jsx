// components/CosmicMatchSheet.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Replaces the ugly Alert.alert() popup when a cosmic match happens.
// Slides up from bottom as a beautiful bottom sheet.
//
// Usage in discover.jsx:
//   const [matchData, setMatchData] = useState(null);
//   // When match detected:
//   setMatchData({ name: 'Priya', score: 28, verdict: 'Good Match', matchId: '...' });
//   // In JSX:
//   <CosmicMatchSheet data={matchData} onClose={() => setMatchData(null)} onChat={...} />
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { rf, rs, rp } from '../constants/responsive';

const { height } = Dimensions.get('window');

export default function CosmicMatchSheet({ data, onClose, onChat }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }),
        Animated.timing(bgAnim,    { toValue: 0,      duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [data]);

  if (!data) return null;

  const VERDICT_COLOR = {
    'Excellent Match':   '#FFD700',
    'Good Match':        '#4ADE80',
    'Average Match':     '#FB923C',
    'Challenging Match': '#F87171',
  };
  const verdictColor = VERDICT_COLOR[data.verdict] || COLORS.gold;
  const pct = Math.round((data.score / 36) * 100);

  return (
    <Modal visible={!!data} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Dimmed background */}
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          opacity: bgAnim,
        }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={{
          backgroundColor: COLORS.bgCard,
          borderTopLeftRadius: rs(28),
          borderTopRightRadius: rs(28),
          paddingHorizontal: rp(28),
          paddingTop: rp(8),
          paddingBottom: rp(44),
          transform: [{ translateY: slideAnim }],
          borderTopWidth: 1,
          borderTopColor: verdictColor + '40',
        }}>
          {/* Handle */}
          <View style={{ width: rs(40), height: rs(4), borderRadius: rs(2),
            backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: rp(24) }} />

          {/* Stars burst */}
          <Animated.View style={{ alignItems: 'center', marginBottom: rp(8), transform: [{ scale: scaleAnim }] }}>
            <Text style={{ fontSize: rf(56), textAlign: 'center' }}>💫</Text>
          </Animated.View>

          {/* Title */}
          <Text style={{ fontFamily: FONTS.headingBold, fontSize: rf(26), color: COLORS.gold,
            textAlign: 'center', letterSpacing: 2, marginBottom: rp(4) }}>
            Cosmic Match!
          </Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: rf(15), color: COLORS.textSecondary,
            textAlign: 'center', marginBottom: rp(24), lineHeight: rf(22) }}>
            You and <Text style={{ fontFamily: FONTS.bodyBold, color: COLORS.textPrimary }}>{data.name}</Text>
            {'\n'}are cosmically connected
          </Text>

          {/* Score card */}
          <View style={{ backgroundColor: verdictColor + '12', borderRadius: RADIUS.xl,
            borderWidth: 1.5, borderColor: verdictColor + '40',
            padding: rp(20), marginBottom: rp(28), alignItems: 'center', gap: rs(8) }}>
            {/* Score circle */}
            <View style={{ width: rs(80), height: rs(80), borderRadius: rs(40),
              borderWidth: 2.5, borderColor: verdictColor,
              backgroundColor: verdictColor + '15',
              alignItems: 'center', justifyContent: 'center', marginBottom: rp(6) }}>
              <Text style={{ fontFamily: FONTS.headingBold, fontSize: rf(22), color: verdictColor }}>
                {pct}%
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(18), color: verdictColor }}>
              {data.score}/36 Gunas
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6),
              paddingHorizontal: rp(14), paddingVertical: rp(5),
              borderRadius: RADIUS.full, backgroundColor: verdictColor + '20',
              borderWidth: 1, borderColor: verdictColor + '50' }}>
              <Text style={{ fontSize: rf(14) }}>
                {data.verdict === 'Excellent Match' ? '🌟' : data.verdict === 'Good Match' ? '❤️' : data.verdict === 'Average Match' ? '🤔' : '⚠️'}
              </Text>
              <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: rf(14), color: verdictColor }}>
                {data.verdict}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ gap: rp(12) }}>
            <TouchableOpacity style={{ backgroundColor: COLORS.gold, borderRadius: RADIUS.lg,
              paddingVertical: rp(16), alignItems: 'center',
              shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}
              onPress={() => { onClose(); onChat?.(data.matchId); }}
              activeOpacity={0.85}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(16), color: '#fff' }}>
                ✦ Send a Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ borderWidth: 1, borderColor: COLORS.border,
              borderRadius: RADIUS.lg, paddingVertical: rp(14), alignItems: 'center' }}
              onPress={onClose} activeOpacity={0.7}>
              <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: rf(15), color: COLORS.textSecondary }}>
                Keep Discovering
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
