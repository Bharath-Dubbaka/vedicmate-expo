// components/CompatibilityModal.jsx
// Shared modal — works for discover profiles AND matched users
// Profile shape from discover: { user, compatibility }
// Profile shape from matches: { name, nakshatra, gunaScore, verdict, gana, animal, nadi, rashi, pada, lordPlanet, breakdown, doshas, highlights }

import {
   Modal,
   View,
   Text,
   ScrollView,
   TouchableOpacity,
   StyleSheet,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";

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

// Normalize different data shapes into one consistent shape
function normalizeProfile(profile) {
   if (!profile) return null;

   // Discover shape: { user, compatibility }
   if (profile.user && profile.compatibility) {
      return {
         name: profile.user.name,
         age: profile.user.age,
         nakshatra: profile.user.cosmicCard?.nakshatra,
         rashi: profile.user.cosmicCard?.rashi,
         pada: profile.user.cosmicCard?.pada,
         gana: profile.user.cosmicCard?.gana,
         animal: profile.user.cosmicCard?.animal,
         nadi: profile.user.cosmicCard?.nadi,
         lordPlanet: profile.user.cosmicCard?.lordPlanet,
         totalScore: profile.compatibility.totalScore,
         verdict: profile.compatibility.verdict,
         breakdown: profile.compatibility.breakdown,
         doshas: profile.compatibility.doshas,
         highlights: profile.compatibility.highlights,
      };
   }

   // Matches/views/requests shape — already flat
   return {
      name: profile.name,
      age: profile.age,
      nakshatra: profile.nakshatra || profile.kundli?.nakshatra,
      rashi: profile.rashi || profile.kundli?.rashi,
      pada: profile.pada || profile.kundli?.pada,
      gana: profile.gana || profile.kundli?.gana,
      animal: profile.animal || profile.kundli?.animal,
      nadi: profile.nadi || profile.kundli?.nadi,
      lordPlanet: profile.lordPlanet || profile.kundli?.lordPlanet,
      totalScore:
         profile.gunaScore ??
         profile.totalScore ??
         profile.compatibility?.gunaScore,
      verdict:
         profile.verdict ?? profile.compatibility?.verdict ?? "Average Match",
      breakdown: profile.breakdown ?? profile.compatibility?.breakdown,
      doshas: profile.doshas ?? profile.compatibility?.doshas,
      highlights: profile.highlights ?? profile.compatibility?.highlights,
   };
}

export default function CompatibilityModal({ visible, profile, onClose }) {
   const data = normalizeProfile(profile);
   if (!data) return null;

   const vc = VERDICT_CONFIG[data.verdict] || VERDICT_CONFIG["Average Match"];
   const gc = GANA_CONFIG[data.gana] || GANA_CONFIG.Manushya;
   const pct = data.totalScore ? Math.round((data.totalScore / 36) * 100) : 0;

   return (
      <Modal
         visible={visible}
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={onClose}
      >
         <View style={s.container}>
            <View style={s.handle} />

            <ScrollView
               style={{ flex: 1 }}
               contentContainerStyle={s.scroll}
               showsVerticalScrollIndicator={false}
            >
               {/* Header */}
               <View style={s.header}>
                  <View style={s.headerLeft}>
                     <Text style={s.personName}>
                        {data.name}
                        {data.age ? `, ${data.age}` : ""}
                     </Text>
                     <Text style={s.personSub}>
                        {data.nakshatra}
                        {data.rashi ? ` · ${data.rashi} Moon` : ""}
                     </Text>
                  </View>
                  <View style={[s.verdictBadge, { borderColor: vc.color }]}>
                     <Text style={s.verdictEmoji}>{vc.emoji}</Text>
                     <View>
                        <Text style={[s.verdictScore, { color: vc.color }]}>
                           {data.totalScore ?? "—"}/36
                        </Text>
                        <Text style={[s.verdictLabel, { color: vc.color }]}>
                           {data.verdict}
                        </Text>
                     </View>
                  </View>
               </View>

               {/* Score circle */}
               <View style={s.scoreHero}>
                  <View style={[s.scoreCircle, { borderColor: vc.color }]}>
                     <Text style={[s.scoreNumber, { color: vc.color }]}>
                        {pct}%
                     </Text>
                     <Text style={s.scoreLabel}>compatible</Text>
                  </View>
                  <View style={s.cosmicIdentity}>
                     <View
                        style={[
                           s.ganaChip,
                           { backgroundColor: gc.bg, borderColor: gc.color },
                        ]}
                     >
                        <Text style={s.ganaChipEmoji}>{gc.emoji}</Text>
                        <Text style={[s.ganaChipText, { color: gc.color }]}>
                           {data.gana} · {gc.label}
                        </Text>
                     </View>
                     <View style={s.cosmicDetails}>
                        {data.animal && (
                           <Text style={s.cosmicDetail}>🐾 {data.animal}</Text>
                        )}
                        {data.rashi && (
                           <>
                              <Text style={s.cosmicDetailDot}>·</Text>
                              <Text style={s.cosmicDetail}>
                                 🌙 {data.rashi}
                              </Text>
                           </>
                        )}
                        {data.nadi && (
                           <>
                              <Text style={s.cosmicDetailDot}>·</Text>
                              <Text style={s.cosmicDetail}>💫 {data.nadi}</Text>
                           </>
                        )}
                     </View>
                  </View>
               </View>

               {/* Koota breakdown */}
               {data.breakdown ? (
                  <>
                     <Text style={s.sectionTitle}>ASHTA KOOTA BREAKDOWN</Text>
                     <View style={s.kootaCard}>
                        {KOOTA_LIST.map((k, idx) => {
                           const entry = data.breakdown?.[k.key];
                           const score = entry?.score ?? 0;
                           const maxVal = entry?.max ?? k.max;
                           const isPerfect = score === maxVal;
                           const isZero = score === 0;
                           const barColor = isPerfect
                              ? COLORS.gold
                              : isZero
                                ? "#E05C5C"
                                : vc.color;
                           return (
                              <View
                                 key={k.key}
                                 style={[
                                    s.kootaRow,
                                    idx < KOOTA_LIST.length - 1 &&
                                       s.kootaRowBorder,
                                 ]}
                              >
                                 <Text style={s.kootaEmoji}>{k.emoji}</Text>
                                 <View style={{ flex: 1 }}>
                                    <View style={s.kootaTopRow}>
                                       <Text style={s.kootaName}>{k.name}</Text>
                                       <Text
                                          style={[
                                             s.kootaScore,
                                             isPerfect && {
                                                color: COLORS.gold,
                                             },
                                             isZero && { color: "#E05C5C" },
                                          ]}
                                       >
                                          {score}/{maxVal}
                                          {isPerfect
                                             ? " ✓"
                                             : isZero
                                               ? " ✕"
                                               : ""}
                                       </Text>
                                    </View>
                                    <View style={s.kootaBarTrack}>
                                       <View
                                          style={[
                                             s.kootaBarFill,
                                             {
                                                width: `${(score / maxVal) * 100}%`,
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
                  </>
               ) : (
                  <View style={s.noBreakdown}>
                     <Text style={s.noBreakdownText}>
                        Full compatibility breakdown available after matching ✨
                     </Text>
                  </View>
               )}

               {/* Doshas */}
               {data.doshas?.length > 0 && (
                  <>
                     <Text style={s.sectionTitle}>DOSHAS</Text>
                     <View style={s.doshaCard}>
                        {data.doshas.map((d, i) => (
                           <View
                              key={i}
                              style={[
                                 s.doshaRow,
                                 i < data.doshas.length - 1 && s.doshaRowBorder,
                              ]}
                           >
                              <Text style={{ fontSize: 16 }}>
                                 {d.severity === "high" ? "⚠️" : "ℹ️"}
                              </Text>
                              <View style={{ flex: 1 }}>
                                 <Text style={s.doshaName}>{d.name}</Text>
                                 <Text style={s.doshaDesc}>
                                    {d.description}
                                 </Text>
                                 {d.cancellation && (
                                    <Text style={s.doshaCancelled}>
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
               {data.highlights?.length > 0 && (
                  <>
                     <Text style={s.sectionTitle}>TOP STRENGTHS</Text>
                     <View style={s.highlightsRow}>
                        {data.highlights.slice(0, 4).map((h) => (
                           <View
                              key={h.name}
                              style={[
                                 s.strengthChip,
                                 h.score === h.max && {
                                    borderColor: COLORS.gold,
                                    backgroundColor: "rgba(201,168,76,0.1)",
                                 },
                              ]}
                           >
                              <Text
                                 style={[
                                    s.strengthScore,
                                    h.score === h.max && { color: COLORS.gold },
                                 ]}
                              >
                                 {h.score}/{h.max}
                              </Text>
                              <Text style={s.strengthName}>{h.name}</Text>
                           </View>
                        ))}
                     </View>
                  </>
               )}

               <View style={{ height: 40 }} />
            </ScrollView>

            <View style={s.footer}>
               <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <Text style={s.closeBtnText}>Close</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
   );
}

const s = StyleSheet.create({
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
   cosmicDetailDot: { color: COLORS.textDim, fontSize: 13 },
   sectionTitle: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: SPACING.sm,
   },
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
   kootaRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
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
   doshaCard: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: "#FF980040",
      marginBottom: SPACING.xl,
      overflow: "hidden",
   },
   doshaRow: { flexDirection: "row", gap: SPACING.sm, padding: SPACING.md },
   doshaRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
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
   noBreakdown: {
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      padding: SPACING.xl,
      alignItems: "center",
      marginBottom: SPACING.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   noBreakdownText: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      textAlign: "center",
      lineHeight: 20,
   },
});
