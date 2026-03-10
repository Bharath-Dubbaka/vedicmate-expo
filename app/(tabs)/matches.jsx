// app/(tabs)/matches.jsx
import { useEffect, useState, useCallback } from "react";
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   ActivityIndicator,
   RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

// Shared in-memory match store — discover.jsx writes to this, matches.jsx reads it
// Import this from a shared location in real app; for now module-level works across tabs
export const DEV_MATCH_STORE = { matches: [] };

const formatTime = (date) => {
   if (!date) return "";
   const diffMin = Math.floor((Date.now() - new Date(date)) / 60000);
   if (diffMin < 1) return "now";
   if (diffMin < 60) return `${diffMin}m`;
   if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
   return `${Math.floor(diffMin / 1440)}d`;
};

const VERDICT_COLORS = {
   "Excellent Match": "#C9A84C",
   "Great Match": "#4CAF50",
   "Good Match": "#7B8CDE",
   "Average Match": "#FF9800",
};

export default function MatchesScreen() {
   const router = useRouter();
   const { token } = useAuthStore();
   const [matches, setMatches] = useState([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   const isDev = !token || token.startsWith("dev_token");

   const fetchMatches = useCallback(async () => {
      try {
         if (isDev) {
            // Only show matches the user actually liked (written by discover.jsx)
            setMatches([...DEV_MATCH_STORE.matches]);
            return;
         }
         const { matchingAPI } = await import("../../services/api");
         const res = await matchingAPI.getMatches();
         setMatches(res.data.matches);
      } catch (err) {
         console.log("Matches error:", err.message);
         setMatches([...DEV_MATCH_STORE.matches]);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }, []);

   // Refresh every time tab is focused
   useEffect(() => {
      const interval = setInterval(() => {
         setMatches([...DEV_MATCH_STORE.matches]);
      }, 1000);
      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      fetchMatches();
   }, []);

   const renderMatch = ({ item }) => {
      const color = VERDICT_COLORS[item.compatibility?.verdict] || COLORS.gold;
      const hasUnread = item.unreadCount > 0;
      return (
         <TouchableOpacity
            style={styles.matchRow}
            onPress={() => router.push(`/(tabs)/chat/${item.matchId}`)}
            activeOpacity={0.75}
         >
            <View style={styles.avatarWrap}>
               <View
                  style={[
                     styles.avatar,
                     {
                        backgroundColor: COLORS.bgElevated,
                        alignItems: "center",
                        justifyContent: "center",
                     },
                  ]}
               >
                  <Text style={{ fontSize: 28 }}>
                     {item.user?.cosmicCard?.nakshatra?.split(" ")[0] || "🌟"}
                  </Text>
               </View>
               <View style={[styles.scoreDot, { borderColor: color }]}>
                  <Text style={[styles.scoreDotText, { color }]}>
                     {item.compatibility?.gunaScore}
                  </Text>
               </View>
            </View>
            <View style={styles.matchInfo}>
               <View style={styles.matchHeader}>
                  <Text style={styles.matchName}>{item.user?.name}</Text>
                  <Text style={styles.matchTime}>
                     {formatTime(item.matchedAt)}
                  </Text>
               </View>
               <View style={styles.matchFooter}>
                  <Text style={styles.newMatch}>✨ New match! Say hello</Text>
                  {hasUnread && (
                     <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                           {item.unreadCount}
                        </Text>
                     </View>
                  )}
               </View>
               <Text style={styles.nakshatraRow}>
                  {item.user?.cosmicCard?.nakshatra}
                  {"  ·  "}
                  {item.compatibility?.verdict}
               </Text>
            </View>
         </TouchableOpacity>
      );
   };

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Text style={styles.headerTitle}>MATCHES</Text>
            <Text style={styles.headerCount}>{matches.length}</Text>
         </View>
         {loading ? (
            <View style={styles.loading}>
               <ActivityIndicator color={COLORS.gold} />
            </View>
         ) : (
            <FlatList
               data={matches}
               keyExtractor={(m) => m.matchId.toString()}
               renderItem={renderMatch}
               contentContainerStyle={styles.list}
               ItemSeparatorComponent={() => <View style={styles.separator} />}
               refreshControl={
                  <RefreshControl
                     refreshing={refreshing}
                     onRefresh={() => {
                        setRefreshing(true);
                        fetchMatches();
                     }}
                     tintColor={COLORS.gold}
                  />
               }
               ListEmptyComponent={
                  <View style={styles.empty}>
                     <Text style={styles.emptyEmoji}>🌌</Text>
                     <Text style={styles.emptyTitle}>No matches yet</Text>
                     <Text style={styles.emptySubtitle}>
                        Swipe right on Discover to find your cosmic counterpart
                     </Text>
                  </View>
               }
            />
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
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   headerTitle: {
      fontFamily: FONTS.headingBold,
      fontSize: 16,
      color: COLORS.gold,
      letterSpacing: 4,
      flex: 1,
   },
   headerCount: {
      fontFamily: FONTS.bodyBold,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   loading: { flex: 1, alignItems: "center", justifyContent: "center" },
   list: { padding: SPACING.md, flexGrow: 1 },
   matchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      padding: SPACING.sm,
   },
   avatarWrap: { position: "relative" },
   avatar: { width: 62, height: 62, borderRadius: 31 },
   scoreDot: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      backgroundColor: COLORS.bg,
      alignItems: "center",
      justifyContent: "center",
   },
   scoreDotText: { fontFamily: FONTS.bodyBold, fontSize: 9 },
   matchInfo: { flex: 1 },
   matchHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
   },
   matchName: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: COLORS.textPrimary,
   },
   matchTime: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim },
   matchFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
   },
   newMatch: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.gold },
   unreadBadge: {
      backgroundColor: COLORS.gold,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
   },
   unreadText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.bg },
   nakshatraRow: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textDim,
   },
   separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 78 },
   empty: { flex: 1, alignItems: "center", paddingTop: 100 },
   emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
   emptyTitle: {
      fontFamily: FONTS.heading,
      fontSize: 20,
      color: COLORS.textPrimary,
      marginBottom: SPACING.sm,
   },
   emptySubtitle: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: "center",
      paddingHorizontal: SPACING.xl,
   },
});
