// components/ProfileViewer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full profile viewer modal — used when premium user taps a profile in
// Liked You / Viewed You tabs. Shows full discover-style profile with
// Send Like button. Fetches compatibility live.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { matchingAPI } from '../services/api';
import { rf, rs, rp } from '../constants/responsive';
import { useRouter } from 'expo-router';

const { height: SCREEN_H } = Dimensions.get('window');

const KOOTA_LIST = [
  { key: 'nadi',        name: 'Nadi',         emoji: '🌊', max: 8 },
  { key: 'bhakoot',     name: 'Bhakoot',      emoji: '🌕', max: 7 },
  { key: 'gana',        name: 'Gana',         emoji: '✨', max: 6 },
  { key: 'grahaMaitri', name: 'Graha Maitri', emoji: '🪐', max: 5 },
  { key: 'yoni',        name: 'Yoni',         emoji: '🐾', max: 4 },
  { key: 'tara',        name: 'Tara',         emoji: '⭐', max: 3 },
  { key: 'vashya',      name: 'Vashya',       emoji: '💫', max: 2 },
  { key: 'varna',       name: 'Varna',        emoji: '📿', max: 1 },
];

export default function ProfileViewer({ visible, user, onClose, onLiked }) {
  const { COLORS, FONTS, RADIUS, VERDICT_CONFIG, GANA_CONFIG } = useTheme();
  const router = useRouter();
  const [compatData, setCompatData] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [liking,     setLiking]     = useState(false);
  const [liked,      setLiked]      = useState(false);

  useEffect(() => {
    if (visible && user?._id && !compatData) {
      setLoading(true);
      setLiked(false);
      matchingAPI.getCompatibility(user._id)
        .then(res => { if (res.data?.compatibility) setCompatData(res.data.compatibility); })
        .catch(err => console.warn('[PROFILE VIEWER] compat error:', err.message))
        .finally(() => setLoading(false));
    }
    if (!visible) { setCompatData(null); setLiked(false); }
  }, [visible, user?._id]);

  const handleLike = async () => {
    if (!user?._id || liked) return;
    setLiking(true);
    try {
      const res = await matchingAPI.like(user._id);
      setLiked(true);
      if (res.data?.isMatch) {
        // It's a match! Navigate to chat
        Alert.alert('💫 Cosmic Match!',
          `You and ${user.name} are cosmically connected!\n${res.data.gunaScore}/36 Gunas`,
          [{ text: 'Chat Now', onPress: () => { onClose(); router.push(`/(tabs)/chat/${res.data.matchId}`); } },
           { text: 'Later', style: 'cancel' }]);
      } else {
        onLiked?.();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally { setLiking(false); }
  };

  if (!user) return null;

  const kundli = user.kundli;
  const gana   = kundli?.gana;
  const gc     = gana ? (GANA_CONFIG[gana] || GANA_CONFIG.Manushya) : null;
  const vc     = compatData ? (VERDICT_CONFIG[compatData.verdict] || VERDICT_CONFIG['Average Match']) : null;
  const pct    = compatData ? Math.round((compatData.totalScore / 36) * 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: rp(20), paddingTop: rs(56), paddingBottom: rp(16),
          borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <TouchableOpacity onPress={onClose} style={{ padding: rp(8) }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(22), color: COLORS.textPrimary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(17), color: COLORS.textPrimary, marginLeft: rs(8), flex: 1 }}>
            {user.name}{user.age ? `, ${user.age}` : ''}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: rp(120) }} showsVerticalScrollIndicator={false}>

          {/* Photo */}
          <View style={{ width: '100%', height: SCREEN_H * 0.45, backgroundColor: gc?.bg || COLORS.bgElevated }}>
            {user.photos?.[0]
              ? <Image source={{ uri: user.photos[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: rf(72), opacity: 0.2 }}>👤</Text>
                </View>}
          </View>

          {/* Name + bio */}
          <View style={{ paddingHorizontal: rp(20), paddingTop: rp(16), paddingBottom: rp(16),
            borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: rp(8) }}>
              <View style={{ flex: 1, marginRight: rs(12) }}>
                <Text style={{ fontFamily: FONTS.headingBold, fontSize: rf(26), color: COLORS.textPrimary }}>
                  {user.name}{user.age ? `, ${user.age}` : ''}
                </Text>
                <Text style={{ fontFamily: FONTS.body, fontSize: rf(14), color: COLORS.textSecondary, marginTop: rp(2) }}>
                  {user.gender || ''}
                </Text>
              </View>
              {gc && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(5),
                  paddingHorizontal: rp(12), paddingVertical: rp(6),
                  borderRadius: RADIUS.full, backgroundColor: gc.bg,
                  borderWidth: 1.5, borderColor: gc.color + '60' }}>
                  <Text style={{ fontSize: rf(14) }}>{gc.emoji}</Text>
                  <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: rf(12), color: gc.color }}>
                    {gana}
                  </Text>
                </View>
              )}
            </View>
            {user.bio ? (
              <Text style={{ fontFamily: FONTS.body, fontSize: rf(14), color: COLORS.textSecondary, lineHeight: rf(22) }}>
                {user.bio}
              </Text>
            ) : null}
          </View>

          {/* Cosmic identity */}
          {kundli && (
            <View style={{ paddingHorizontal: rp(20), paddingTop: rp(16), paddingBottom: rp(16),
              borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: rf(10), color: COLORS.textDim, letterSpacing: 3, marginBottom: rp(12) }}>
                COSMIC IDENTITY
              </Text>
              <View style={{ flexDirection: 'row', gap: rp(12), marginBottom: rp(12) }}>
                <View style={{ flex: 1, backgroundColor: gc?.bg || COLORS.bgElevated, borderRadius: RADIUS.lg,
                  borderWidth: 1, borderColor: gc?.color ? gc.color + '40' : COLORS.border, padding: rp(14) }}>
                  <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(17), color: COLORS.textPrimary, marginBottom: rp(2) }}>
                    {kundli.nakshatra}
                  </Text>
                  <Text style={{ fontFamily: FONTS.body, fontSize: rf(12), color: COLORS.textSecondary }}>
                    {kundli.rashi} Moon · Pada {kundli.pada}
                  </Text>
                </View>
                <View style={{ width: rs(82), backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.lg,
                  borderWidth: 1, borderColor: COLORS.border, padding: rp(12),
                  alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: rf(22), marginBottom: rp(4) }}>🪐</Text>
                  <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(13), color: COLORS.gold, textAlign: 'center' }}>
                    {kundli.lordPlanet}
                  </Text>
                  <Text style={{ fontFamily: FONTS.body, fontSize: rf(10), color: COLORS.textDim, marginTop: 2 }}>Lord</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) }}>
                {[
                  { emoji: '🐾', label: 'Yoni', value: kundli.animal },
                  { emoji: '🌊', label: 'Nadi', value: kundli.nadi },
                  { emoji: '📿', label: 'Varna', value: kundli.varna },
                  { emoji: '💫', label: 'Vashya', value: kundli.vashya },
                ].map(a => (
                  <View key={a.label} style={{ flexDirection: 'row', alignItems: 'center', gap: rs(5),
                    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.full,
                    paddingHorizontal: rp(10), paddingVertical: rp(5),
                    borderWidth: 1, borderColor: COLORS.border }}>
                    <Text style={{ fontSize: rf(12) }}>{a.emoji}</Text>
                    <Text style={{ fontFamily: FONTS.body, fontSize: rf(11), color: COLORS.textDim }}>{a.label}:</Text>
                    <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: rf(11), color: COLORS.textPrimary }}>{a.value || '—'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Compatibility */}
          <View style={{ paddingHorizontal: rp(20), paddingTop: rp(16), paddingBottom: rp(16) }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: rf(10), color: COLORS.textDim, letterSpacing: 3, marginBottom: rp(14) }}>
              COMPATIBILITY WITH YOU
            </Text>
            {loading ? (
              <View style={{ alignItems: 'center', padding: rp(24) }}>
                <ActivityIndicator color={COLORS.gold} />
                <Text style={{ fontFamily: FONTS.body, fontSize: rf(13), color: COLORS.textSecondary, marginTop: rs(12) }}>
                  Computing...
                </Text>
              </View>
            ) : compatData && vc ? (
              <>
                <View style={{ backgroundColor: vc.color + '12', borderRadius: RADIUS.xl,
                  borderWidth: 1, borderColor: vc.color + '40', padding: rp(16),
                  flexDirection: 'row', alignItems: 'center', gap: rs(14), marginBottom: rp(16) }}>
                  <View style={{ width: rs(64), height: rs(64), borderRadius: rs(32),
                    borderWidth: 2, borderColor: vc.color,
                    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: FONTS.headingBold, fontSize: rf(18), color: vc.color }}>{pct}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(17), color: vc.color, marginBottom: rp(2) }}>
                      {vc.emoji} {compatData.verdict}
                    </Text>
                    <Text style={{ fontFamily: FONTS.body, fontSize: rf(13), color: COLORS.textSecondary }}>
                      {compatData.totalScore}/36 Gunas
                    </Text>
                  </View>
                </View>

                {/* Koota bars */}
                <View style={{ gap: rp(8) }}>
                  {KOOTA_LIST.map(k => {
                    const entry  = compatData.breakdown?.[k.key];
                    const score  = entry?.score ?? 0;
                    const maxVal = entry?.max ?? k.max;
                    const isPerfect = score === maxVal;
                    const isZero    = score === 0;
                    const barColor  = isPerfect ? COLORS.gold : isZero ? COLORS.rose : vc.color;
                    return (
                      <View key={k.key} style={{ backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
                        padding: rp(12), borderWidth: 1,
                        borderColor: isPerfect ? COLORS.gold + '40' : COLORS.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: rp(6) }}>
                          <Text style={{ fontSize: rf(16), marginRight: rs(8) }}>{k.emoji}</Text>
                          <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: rf(13), color: COLORS.textPrimary, flex: 1 }}>
                            {k.name}
                          </Text>
                          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(13), color: barColor }}>
                            {score}/{maxVal}{isPerfect ? ' ✓' : isZero ? ' ✕' : ''}
                          </Text>
                        </View>
                        <View style={{ height: rs(4), backgroundColor: COLORS.bgElevated, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ height: rs(4), width: `${(score / maxVal) * 100}%`, backgroundColor: barColor, borderRadius: 2 }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', padding: rp(24), backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ fontFamily: FONTS.body, fontSize: rf(13), color: COLORS.textSecondary, textAlign: 'center' }}>
                  Could not compute compatibility. Try again later.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed bottom — Send Like button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border,
          paddingHorizontal: rp(20), paddingVertical: rp(14), paddingBottom: rp(32),
          flexDirection: 'row', gap: rp(12) }}>
          <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: COLORS.border,
            borderRadius: RADIUS.lg, paddingVertical: rp(14), alignItems: 'center' }}
            onPress={onClose} activeOpacity={0.7}>
            <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: rf(15), color: COLORS.textSecondary }}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 2, backgroundColor: liked ? COLORS.bgElevated : COLORS.gold,
            borderRadius: RADIUS.lg, paddingVertical: rp(14), alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: rs(8),
            opacity: liking ? 0.6 : 1,
            shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: liked ? 0 : 0.4, shadowRadius: 10, elevation: liked ? 0 : 8 }}
            onPress={handleLike} disabled={liking || liked} activeOpacity={0.85}>
            {liking
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={{ fontSize: rf(18) }}>{liked ? '✓' : '✦'}</Text>
                  <Text style={{ fontFamily: FONTS.bodyBold, fontSize: rf(15), color: liked ? COLORS.textSecondary : '#fff' }}>
                    {liked ? 'Like Sent!' : 'Send Like'}
                  </Text>
                </>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
