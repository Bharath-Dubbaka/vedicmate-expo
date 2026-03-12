// app/(tabs)/matches.jsx
import { useEffect, useCallback } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import {
   fetchMatches,
   selectMatches,
   selectMatchesLoading,
   selectTotalUnread,
} from "../../store/slices/matchesSlice";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

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
   "Good Match": "#4CAF50",
   "Average Match": "#7B8CDE",
   "Challenging Match": "#FF9800",
};

export default function MatchesScreen() {
   const router = useRouter();
   const dispatch = useDispatch();
   const matches = useSelector(selectMatches);
   const loading = useSelector(selectMatchesLoading);

   useEffect(() => {
      console.log("[MATCHES] Tab focused — fetching matches...");
      dispatch(fetchMatches());
   }, []);

   const onRefresh = useCallback(() => {
      dispatch(fetchMatches());
   }, [dispatch]);

   const renderMatch = ({ item }) => {
      const color = VERDICT_COLORS[item.compatibility?.verdict] || COLORS.gold;
      const hasUnread = (item.unreadCount || 0) > 0;

      return (
         <TouchableOpacity
            style={styles.matchRow}
            onPress={() => router.push(`/(tabs)/chat/${item.matchId}`)}
            activeOpacity={0.75}
         >
            {/* Avatar with Guna score badge */}
            <View style={styles.avatarWrap}>
               <View style={styles.avatar}>
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

            {/* Match info */}
            <View style={styles.matchInfo}>
               <View style={styles.matchHeader}>
                  <Text style={styles.matchName}>{item.user?.name}</Text>
                  <Text style={styles.matchTime}>
                     {formatTime(item.matchedAt)}
                  </Text>
               </View>

               <Text style={styles.nakshatra}>
                  {item.user?.cosmicCard?.nakshatra}
               </Text>

               <View style={styles.matchFooter}>
                  <Text style={[styles.verdict, { color }]}>
                     {item.compatibility?.verdict}
                  </Text>
                  {hasUnread && (
                     <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                           {item.unreadCount}
                        </Text>
                     </View>
                  )}
               </View>
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

         {loading && matches.length === 0 ? (
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
                     refreshing={loading}
                     onRefresh={onRefresh}
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
      paddingHorizontal: SPACING.xl,
      paddingTop: 56,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      gap: SPACING.sm,
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
   avatar: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
   },
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
      justifyContent: "space-between",
      marginBottom: 2,
   },
   matchName: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: COLORS.textPrimary,
   },
   matchTime: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim },
   nakshatra: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      marginBottom: 2,
   },
   matchFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
   },
   verdict: { fontFamily: FONTS.bodyMedium, fontSize: 12 },
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
   separator: {
      height: 1,
      backgroundColor: COLORS.border,
      marginLeft: 78,
   },
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
