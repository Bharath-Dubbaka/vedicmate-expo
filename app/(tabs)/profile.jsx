// app/(tabs)/profile.jsx
import { useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Alert,
} from "react-native";
import { Image } from "expo-image";
import { useAuthStore } from "../../store/authStore";
import { disconnectSocket } from "../../services/socket";
import {
   COLORS,
   FONTS,
   SPACING,
   RADIUS,
   GANA_CONFIG,
   VERDICT_CONFIG,
} from "../../constants/theme";

const KOOTA_NAMES = [
   {
      key: "nadi",
      name: "Nadi",
      emoji: "🌊",
      max: 8,
      desc: "Health & genetics",
   },
   {
      key: "bhakoot",
      name: "Bhakoot",
      emoji: "🌕",
      max: 7,
      desc: "Emotional compatibility",
   },
   { key: "gana", name: "Gana", emoji: "✨", max: 6, desc: "Temperament" },
   {
      key: "grahaMaitri",
      name: "Graha",
      emoji: "🪐",
      max: 5,
      desc: "Mental compatibility",
   },
   {
      key: "yoni",
      name: "Yoni",
      emoji: "🐾",
      max: 4,
      desc: "Physical compatibility",
   },
   {
      key: "tara",
      name: "Tara",
      emoji: "⭐",
      max: 3,
      desc: "Birth star harmony",
   },
   {
      key: "vashya",
      name: "Vashya",
      emoji: "💫",
      max: 2,
      desc: "Mutual attraction",
   },
   {
      key: "varna",
      name: "Varna",
      emoji: "📿",
      max: 1,
      desc: "Spiritual compatibility",
   },
];

export default function ProfileScreen() {
   const { user, logout } = useAuthStore();
   const [loggingOut, setLoggingOut] = useState(false);

   const handleLogout = () => {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
         { text: "Cancel", style: "cancel" },
         {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
               setLoggingOut(true);
               disconnectSocket();
               await logout();
            },
         },
      ]);
   };

   const kundli = user?.kundli;
   const ganaConfig = kundli
      ? GANA_CONFIG[kundli.gana] || GANA_CONFIG.Manushya
      : null;

   return (
      <ScrollView
         style={styles.container}
         contentContainerStyle={styles.scroll}
         showsVerticalScrollIndicator={false}
      >
         {/* Header */}
         <View style={styles.header}>
            <Text style={styles.headerTitle}>PROFILE</Text>
         </View>

         {/* Avatar + basic info */}
         <View style={styles.avatarSection}>
            {user?.avatar ? (
               <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
               />
            ) : (
               <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                     {user?.name?.[0] || "?"}
                  </Text>
               </View>
            )}
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
         </View>

         {/* Cosmic Identity Card */}
         {kundli && (
            <View
               style={[styles.cosmicCard, { borderColor: ganaConfig.color }]}
            >
               <Text style={styles.cosmicCardTitle}>YOUR COSMIC IDENTITY</Text>

               {/* Nakshatra hero */}
               <View style={styles.nakshatraHero}>
                  <Text style={styles.nakshatraEmoji}>
                     {kundli.nakshatraSymbol}
                  </Text>
                  <View>
                     <Text style={styles.nakshatraName}>
                        {kundli.nakshatra}
                     </Text>
                     <Text style={styles.nakshatraRashi}>
                        {kundli.rashi} • Pada {kundli.pada}
                     </Text>
                  </View>
               </View>

               {/* Gana badge */}
               <View
                  style={[styles.ganaBadge, { backgroundColor: ganaConfig.bg }]}
               >
                  <Text style={styles.ganaEmoji}>{ganaConfig.emoji}</Text>
                  <Text style={[styles.ganaTitle, { color: ganaConfig.color }]}>
                     {kundli.gana} — {ganaConfig.title}
                  </Text>
               </View>

               {/* Stats grid */}
               <View style={styles.statsGrid}>
                  {[
                     { label: "Animal", value: kundli.animal, emoji: "🐾" },
                     { label: "Nadi", value: kundli.nadi, emoji: "🌊" },
                     { label: "Varna", value: kundli.varna, emoji: "📿" },
                     { label: "Vashya", value: kundli.vashya, emoji: "💫" },
                     { label: "Planet", value: kundli.lordPlanet, emoji: "🪐" },
                     { label: "Nadi", value: kundli.nadi, emoji: "⚡" },
                  ].map((s, i) => (
                     <View key={i} style={styles.statBox}>
                        <Text style={styles.statEmoji}>{s.emoji}</Text>
                        <Text style={styles.statValue}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                     </View>
                  ))}
               </View>

               {/* Koota weight bars */}
               <Text style={styles.kootaTitle}>Koota Weights</Text>
               {KOOTA_NAMES.map((k) => (
                  <View key={k.key} style={styles.kootaRow}>
                     <Text style={styles.kootaEmoji}>{k.emoji}</Text>
                     <Text style={styles.kootaName}>{k.name}</Text>
                     <View style={styles.kootaBarTrack}>
                        <View
                           style={[
                              styles.kootaBarFill,
                              {
                                 width: `${(k.max / 8) * 100}%`,
                                 backgroundColor: COLORS.gold,
                                 opacity: 0.3 + (k.max / 8) * 0.7,
                              },
                           ]}
                        />
                     </View>
                     <Text style={styles.kootaMax}>{k.max}</Text>
                  </View>
               ))}
            </View>
         )}

         {/* Preferences summary */}
         {user?.preferences && (
            <View style={styles.prefsCard}>
               <Text style={styles.prefsTitle}>PREFERENCES</Text>
               <View style={styles.prefRow}>
                  <Text style={styles.prefLabel}>Age range</Text>
                  <Text style={styles.prefValue}>
                     {user.preferences.minAge}–{user.preferences.maxAge} yrs
                  </Text>
               </View>
               <View style={styles.prefRow}>
                  <Text style={styles.prefLabel}>Min Guna score</Text>
                  <Text style={styles.prefValue}>
                     {user.preferences.minGunaScore}+/36
                  </Text>
               </View>
               <View style={styles.prefRow}>
                  <Text style={styles.prefLabel}>Looking for</Text>
                  <Text style={styles.prefValue}>
                     {user?.lookingFor || "both"}
                  </Text>
               </View>
            </View>
         )}

         {/* Sign out */}
         <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={loggingOut}
         >
            <Text style={styles.logoutText}>
               {loggingOut ? "Signing out..." : "Sign Out"}
            </Text>
         </TouchableOpacity>

         <View style={{ height: 40 }} />
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   scroll: { paddingBottom: 40 },
   header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: 56,
      paddingBottom: SPACING.md,
   },
   headerTitle: {
      fontFamily: FONTS.headingBold,
      fontSize: 16,
      color: COLORS.gold,
      letterSpacing: 4,
   },
   avatarSection: { alignItems: "center", paddingVertical: SPACING.xl },
   avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      marginBottom: SPACING.md,
      borderWidth: 2,
      borderColor: COLORS.gold,
   },
   avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.md,
      borderWidth: 2,
      borderColor: COLORS.gold,
   },
   avatarInitial: {
      fontFamily: FONTS.headingBold,
      fontSize: 32,
      color: COLORS.gold,
   },
   userName: {
      fontFamily: FONTS.heading,
      fontSize: 22,
      color: COLORS.textPrimary,
      marginBottom: 4,
   },
   userEmail: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   cosmicCard: {
      marginHorizontal: SPACING.xl,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      backgroundColor: COLORS.bgCard,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
   },
   cosmicCardTitle: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: SPACING.lg,
   },
   nakshatraHero: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      marginBottom: SPACING.md,
   },
   nakshatraEmoji: { fontSize: 48 },
   nakshatraName: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.textPrimary,
   },
   nakshatraRashi: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   ganaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.lg,
      alignSelf: "flex-start",
   },
   ganaEmoji: { fontSize: 16 },
   ganaTitle: { fontFamily: FONTS.bodyMedium, fontSize: 14 },
   statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: SPACING.lg,
   },
   statBox: {
      width: "33.33%",
      alignItems: "center",
      paddingVertical: SPACING.sm,
   },
   statEmoji: { fontSize: 18, marginBottom: 2 },
   statValue: {
      fontFamily: FONTS.bodyBold,
      fontSize: 13,
      color: COLORS.textPrimary,
   },
   statLabel: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.textDim },
   kootaTitle: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
      letterSpacing: 2,
      marginBottom: SPACING.sm,
   },
   kootaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.xs,
   },
   kootaEmoji: { fontSize: 14, width: 20 },
   kootaName: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      width: 56,
   },
   kootaBarTrack: {
      flex: 1,
      height: 4,
      backgroundColor: COLORS.border,
      borderRadius: 2,
      overflow: "hidden",
   },
   kootaBarFill: { height: 4, borderRadius: 2 },
   kootaMax: {
      fontFamily: FONTS.bodyBold,
      fontSize: 11,
      color: COLORS.textDim,
      width: 16,
      textAlign: "right",
   },
   prefsCard: {
      marginHorizontal: SPACING.xl,
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   prefsTitle: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textDim,
      letterSpacing: 3,
      marginBottom: SPACING.md,
   },
   prefRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   prefLabel: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   prefValue: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textPrimary,
   },
   logoutBtn: {
      marginHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.rose,
      alignItems: "center",
   },
   logoutText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 15,
      color: COLORS.rose,
   },
});
