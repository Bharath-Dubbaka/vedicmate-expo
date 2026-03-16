// app/(tabs)/matches.jsx
// ─────────────────────────────────────────────────────────────────────────────
// MATCHES SCREEN — 3 top-level tabs matching the screenshot layout:
//
//   MESSAGES  — your mutual matches (chat list)
//   REQUESTS  — likes: RECEIVED (liked-me) | SENT (liked-by-me)
//   VIEWS     — profile views: VIEWED YOU | YOU VIEWED  (placeholder for now)
//
// This replaces both the old matches tab AND swipe-history screen.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import {
   View,
   Text,
   FlatList,
   Image,
   TouchableOpacity,
   ActivityIndicator,
   RefreshControl,
   StyleSheet,
   SafeAreaView,
   Animated,
   Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
   fetchMatches,
   selectMatches,
   selectMatchesLoading,
} from "../../store/slices/matchesSlice";
import { matchingAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// TOP TAB BAR  (Messages / Requests / Views)
// ─────────────────────────────────────────────────────────────────────────────
function TopTabBar({ tabs, active, onSelect }) {
   const indicatorX = useRef(new Animated.Value(0)).current;
   const tabW = SCREEN_W / tabs.length;

   useEffect(() => {
      Animated.spring(indicatorX, {
         toValue: active * tabW,
         useNativeDriver: true,
         tension: 80,
         friction: 12,
      }).start();
   }, [active]);

   return (
      <View style={tt.container}>
         {tabs.map((label, i) => (
            <TouchableOpacity
               key={label}
               style={tt.tab}
               onPress={() => onSelect(i)}
               activeOpacity={0.7}
            >
               <Text style={[tt.label, active === i && tt.labelActive]}>
                  {label}
               </Text>
               {active === i && <View style={tt.pill} />}
            </TouchableOpacity>
         ))}
      </View>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB TAB BAR  (Received / Sent  or  Viewed You / You Viewed)
// ─────────────────────────────────────────────────────────────────────────────
function SubTabBar({ tabs, active, onSelect }) {
   return (
      <View style={st.container}>
         {tabs.map((label, i) => (
            <TouchableOpacity
               key={label}
               style={st.tab}
               onPress={() => onSelect(i)}
               activeOpacity={0.7}
            >
               <Text style={[st.label, active === i && st.labelActive]}>
                  {label}
               </Text>
               {active === i && <View style={st.underline} />}
            </TouchableOpacity>
         ))}
      </View>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH CARD  (Messages tab)
// ─────────────────────────────────────────────────────────────────────────────
function MatchCard({ match, onPress }) {
   const other = match.user ?? match.matchedUser;
   const photo = other?.photo ?? other?.photos?.[0];
   // unreadCount can be a Map object, a plain object, or a number depending on how Mongoose serializes it
   const unread = typeof match.unreadCount === "number" ? match.unreadCount : 0;
   const gunaScore = match.compatibility?.gunaScore ?? match.gunaScore;

   return (
      <TouchableOpacity
         style={mc.card}
         onPress={() => onPress(match)}
         activeOpacity={0.8}
      >
         <View style={mc.avatarWrap}>
            {photo ? (
               <Image source={{ uri: photo }} style={mc.avatar} />
            ) : (
               <View style={mc.avatarFallback}>
                  <Text style={mc.avatarInitial}>
                     {other?.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
               </View>
            )}
            {unread > 0 && (
               <View style={mc.badge}>
                  <Text style={mc.badgeText}>{unread > 9 ? "9+" : unread}</Text>
               </View>
            )}
         </View>

         <View style={mc.body}>
            <View style={mc.nameRow}>
               <Text style={mc.name} numberOfLines={1}>
                  {other?.name ?? "—"}
                  {other?.age ? `, ${other.age}` : ""}
               </Text>
               {gunaScore != null && (
                  <View style={mc.scoreBadge}>
                     <Text style={mc.scoreText}>{gunaScore}/36 ✦</Text>
                  </View>
               )}
            </View>
            {match.lastMessage ? (
               <Text style={mc.lastMsg} numberOfLines={1}>
                  {typeof match.lastMessage === "string"
                     ? match.lastMessage
                     : (match.lastMessage?.text ?? "")}
               </Text>
            ) : (
               <Text style={mc.lastMsgDim}>Tap to say namaste 🙏</Text>
            )}
         </View>
      </TouchableOpacity>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST CARD  (Requests tab — liked me / liked by me)
// ─────────────────────────────────────────────────────────────────────────────
function RequestCard({ user }) {
   const photo = user?.photos?.[0];
   const gana = user?.kundli?.gana;
   const GANA_COLOR = {
      Deva: "#7EB8E8",
      Manushya: "#E8A850",
      Rakshasa: "#E87070",
   };
   const GANA_BG = {
      Deva: "#1A3A5C",
      Manushya: "#2A1A0A",
      Rakshasa: "#2A0A1A",
   };

   return (
      <View style={rc.card}>
         {photo ? (
            <Image source={{ uri: photo }} style={rc.photo} />
         ) : (
            <View style={[rc.photo, rc.photoFallback]}>
               <Text style={rc.initial}>
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
               </Text>
            </View>
         )}
         <View style={rc.info}>
            <Text style={rc.name} numberOfLines={1}>
               {user?.name ?? "—"}
               {user?.age ? `, ${user.age}` : ""}
            </Text>
            {user?.kundli?.nakshatra && (
               <View
                  style={[
                     rc.nBadge,
                     { backgroundColor: GANA_BG[gana] ?? "#1A1A2E" },
                  ]}
               >
                  <Text
                     style={[
                        rc.nText,
                        { color: GANA_COLOR[gana] ?? "#C0A060" },
                     ]}
                  >
                     ✦ {user.kundli.nakshatra}
                  </Text>
               </View>
            )}
            {user?.bio ? (
               <Text style={rc.bio} numberOfLines={2}>
                  {user.bio}
               </Text>
            ) : null}
         </View>
      </View>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function Empty({ icon, title, body }) {
   return (
      <View style={em.wrap}>
         <Text style={em.icon}>{icon}</Text>
         <Text style={em.title}>{title}</Text>
         <Text style={em.body}>{body}</Text>
      </View>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const TOP_TABS = ["MESSAGES", "REQUESTS", "VIEWS"];
const REQUEST_SUBTABS = ["RECEIVED", "SENT"];
const VIEWS_SUBTABS = ["VIEWED YOU", "YOU VIEWED"];

export default function MatchesScreen() {
   const router = useRouter();
   const dispatch = useDispatch();

   const matches = useSelector(selectMatches);
   const matchesLoading = useSelector(selectMatchesLoading);

   const [topTab, setTopTab] = useState(0); // 0=Messages 1=Requests 2=Views
   const [reqSubTab, setReqSubTab] = useState(0); // 0=Received 1=Sent
   const [viewSubTab, setViewSubTab] = useState(0);

   const [likedMe, setLikedMe] = useState([]);
   const [likedByMe, setLikedByMe] = useState([]);
   const [reqLoading, setReqLoading] = useState(false);
   const [refreshing, setRefreshing] = useState(false);

   const [viewedMe, setViewedMe] = useState([]);
   const [viewedByMe, setViewedByMe] = useState([]);
   const [viewLoading, setViewLoading] = useState(false);

   // Add to useEffect for tab changes:
   useEffect(() => {
      if (topTab === 2) loadViews();
   }, [topTab]);

   const loadViews = useCallback(async (silent = false) => {
      if (!silent) setViewLoading(true);
      try {
         const [viewedMeRes, viewedByMeRes] = await Promise.all([
            matchingAPI.getViewedMe(),
            matchingAPI.getViewedByMe(),
         ]);
         setViewedMe(viewedMeRes.data.users ?? []);
         setViewedByMe(viewedByMeRes.data.users ?? []);
      } catch (err) {
         console.error("[MATCHES] loadViews error:", err.message);
      } finally {
         setViewLoading(false);
         setRefreshing(false);
      }
   }, []);

   // ── Load matches ──────────────────────────────────────────────────────────
   const loadMatches = useCallback(() => {
      dispatch(fetchMatches());
   }, [dispatch]);

   // ── Load requests (liked-me + liked-by-me) ───────────────────────────────
   const loadRequests = useCallback(async (silent = false) => {
      if (!silent) setReqLoading(true);
      try {
         const [likedMeRes, likedByMeRes] = await Promise.all([
            matchingAPI.getLikedMe(),
            matchingAPI.getLikedByMe(),
         ]);
         setLikedMe(likedMeRes.data.users ?? []);
         setLikedByMe(likedByMeRes.data.users ?? []);
      } catch (err) {
         console.error("[MATCHES] loadRequests error:", err.message);
      } finally {
         setReqLoading(false);
         setRefreshing(false);
      }
   }, []);

   useEffect(() => {
      loadMatches();
   }, []);
   useEffect(() => {
      if (topTab === 1) loadRequests();
   }, [topTab]);

   const onRefresh = () => {
      setRefreshing(true);
      if (topTab === 0) loadMatches();
      else if (topTab === 1) loadRequests(true);
      else if (topTab === 2) loadViews(true);
      else setRefreshing(false);
   };

   const onMatchPress = (match) => {
      const matchId = match.matchId ?? match._id;
      router.push(`/(tabs)/chat/${matchId}`);
   };

   // ── Render content by top tab ─────────────────────────────────────────────
   const renderContent = () => {
      // ── MESSAGES ──
      if (topTab === 0) {
         if (matchesLoading && !refreshing) {
            return (
               <View style={s.center}>
                  <ActivityIndicator
                     size="large"
                     color={COLORS.primary ?? COLORS.gold}
                  />
               </View>
            );
         }
         return (
            <FlatList
               data={matches}
               keyExtractor={(m) => String(m.matchId ?? m._id)}
               renderItem={({ item }) => (
                  <MatchCard match={item} onPress={onMatchPress} />
               )}
               contentContainerStyle={
                  matches.length === 0 ? s.fillCenter : s.listPad
               }
               ListEmptyComponent={
                  <Empty
                     icon="✨"
                     title="No matches yet"
                     body="Like profiles to get matched!"
                  />
               }
               refreshControl={
                  <RefreshControl
                     refreshing={refreshing}
                     onRefresh={onRefresh}
                     tintColor={COLORS.primary ?? COLORS.gold}
                  />
               }
               showsVerticalScrollIndicator={false}
            />
         );
      }

      // ── REQUESTS ──
      if (topTab === 1) {
         const listData = reqSubTab === 0 ? likedMe : likedByMe;
         const emptyConfig =
            reqSubTab === 0
               ? {
                    icon: "💫",
                    title: "No one yet",
                    body: "When someone likes you, they'll appear here",
                 }
               : {
                    icon: "🔮",
                    title: "No likes sent",
                    body: "Profiles you like will appear here",
                 };

         return (
            <>
               <SubTabBar
                  tabs={REQUEST_SUBTABS}
                  active={reqSubTab}
                  onSelect={setReqSubTab}
               />
               {reqLoading && !refreshing ? (
                  <View style={s.center}>
                     <ActivityIndicator
                        size="large"
                        color={COLORS.primary ?? COLORS.gold}
                     />
                  </View>
               ) : (
                  <FlatList
                     data={listData}
                     keyExtractor={(u) => String(u._id)}
                     renderItem={({ item }) => <RequestCard user={item} />}
                     contentContainerStyle={
                        listData.length === 0 ? s.fillCenter : s.listPad
                     }
                     ListEmptyComponent={<Empty {...emptyConfig} />}
                     refreshControl={
                        <RefreshControl
                           refreshing={refreshing}
                           onRefresh={onRefresh}
                           tintColor={COLORS.primary ?? COLORS.gold}
                        />
                     }
                     showsVerticalScrollIndicator={false}
                  />
               )}
            </>
         );
      }

      // ── VIEWS ──
      return (
         <>
            <SubTabBar
               tabs={VIEWS_SUBTABS}
               active={viewSubTab}
               onSelect={setViewSubTab}
            />
            {viewLoading && !refreshing ? (
               <View style={s.center}>
                  <ActivityIndicator
                     size="large"
                     color={COLORS.primary ?? COLORS.gold}
                  />
               </View>
            ) : (
               <FlatList
                  data={viewSubTab === 0 ? viewedMe : viewedByMe}
                  keyExtractor={(u) => String(u._id)}
                  renderItem={({ item }) => <RequestCard user={item} />}
                  contentContainerStyle={
                     (viewSubTab === 0 ? viewedMe : viewedByMe).length === 0
                        ? s.fillCenter
                        : s.listPad
                  }
                  ListEmptyComponent={
                     <Empty
                        icon={viewSubTab === 0 ? "👁" : "🔍"}
                        title={
                           viewSubTab === 0
                              ? "No views yet"
                              : "You haven't viewed anyone"
                        }
                        body={
                           viewSubTab === 0
                              ? "When someone views your profile, they'll appear here"
                              : "Profiles you open will appear here"
                        }
                     />
                  }
                  refreshControl={
                     <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary ?? COLORS.gold}
                     />
                  }
                  showsVerticalScrollIndicator={false}
               />
            )}
         </>
      );
   };

   return (
      <SafeAreaView style={s.safe}>
         <View style={s.header}>
            <Text style={s.headerTitle}>Matches</Text>
         </View>

         <TopTabBar tabs={TOP_TABS} active={topTab} onSelect={setTopTab} />

         <View style={{ flex: 1 }}>{renderContent()}</View>
      </SafeAreaView>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
   safe: { flex: 1, backgroundColor: COLORS.bg ?? COLORS.background },
   header: {
      paddingHorizontal: SPACING.xl ?? 24,
      paddingTop: 52,
      paddingBottom: 4,
   },
   headerTitle: {
      fontFamily: FONTS.headingBold ?? FONTS.heading,
      fontSize: 16,
      color: COLORS.gold ?? COLORS.primary,
      letterSpacing: 4,
   },
   center: { flex: 1, justifyContent: "center", alignItems: "center" },
   fillCenter: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
   },
   listPad: {
      paddingHorizontal: SPACING.xl ?? 24,
      paddingBottom: 32,
      paddingTop: 8,
   },
});

// Top tab bar
const tt = StyleSheet.create({
   container: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border ?? "#222",
   },
   tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      position: "relative",
   },
   label: {
      fontFamily: FONTS.bodySemiBold ?? FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary ?? "#888",
      letterSpacing: 1.5,
   },
   labelActive: { color: COLORS.textPrimary ?? "#fff" },
   pill: {
      position: "absolute",
      bottom: 0,
      left: "15%",
      right: "15%",
      height: 3,
      borderRadius: 2,
      backgroundColor: COLORS.gold ?? COLORS.primary,
   },
});

// Sub tab bar
const st = StyleSheet.create({
   container: {
      flexDirection: "row",
      paddingHorizontal: SPACING.xl ?? 24,
      paddingTop: 12,
      paddingBottom: 2,
   },
   tab: { marginRight: 28, paddingBottom: 10, position: "relative" },
   label: {
      fontFamily: FONTS.bodySemiBold ?? FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary ?? "#888",
      letterSpacing: 1.5,
   },
   labelActive: { color: COLORS.textPrimary ?? "#fff" },
   underline: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: COLORS.gold ?? COLORS.primary,
      borderRadius: 1,
   },
});

// Match card
const mc = StyleSheet.create({
   card: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border ?? "#1E1E2E",
   },
   avatarWrap: { position: "relative", marginRight: 14 },
   avatar: { width: 58, height: 58, borderRadius: 29 },
   avatarFallback: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: COLORS.surface ?? "#1A1A2E",
      alignItems: "center",
      justifyContent: "center",
   },
   avatarInitial: {
      fontFamily: FONTS.headingBold ?? FONTS.heading,
      fontSize: 22,
      color: COLORS.gold ?? COLORS.primary,
   },
   badge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: COLORS.gold ?? COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
   },
   badgeText: {
      fontFamily: FONTS.bodySemiBold ?? FONTS.body,
      fontSize: 10,
      color: COLORS.bg ?? "#000",
   },
   body: { flex: 1 },
   nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
   },
   name: {
      fontFamily: FONTS.bodySemiBold ?? FONTS.body,
      fontSize: 15,
      color: COLORS.textPrimary ?? "#fff",
      flex: 1,
      marginRight: 8,
   },
   scoreBadge: {
      backgroundColor: "rgba(240,192,96,0.15)",
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
   },
   scoreText: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.gold ?? COLORS.primary,
   },
   lastMsg: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary ?? "#888",
   },
   lastMsgDim: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textDim ?? "#555",
      fontStyle: "italic",
   },
});

// Request card
const rc = StyleSheet.create({
   card: {
      flexDirection: "row",
      backgroundColor: COLORS.bgCard ?? COLORS.surface,
      borderRadius: RADIUS.md ?? 12,
      overflow: "hidden",
      marginBottom: 10,
   },
   photo: { width: 90, height: 110 },
   photoFallback: {
      backgroundColor: COLORS.surface ?? "#1A1A2E",
      alignItems: "center",
      justifyContent: "center",
   },
   initial: {
      fontFamily: FONTS.headingBold ?? FONTS.heading,
      fontSize: 28,
      color: COLORS.gold ?? COLORS.primary,
   },
   info: { flex: 1, padding: 12, justifyContent: "center", gap: 5 },
   name: {
      fontFamily: FONTS.bodySemiBold ?? FONTS.body,
      fontSize: 15,
      color: COLORS.textPrimary ?? "#fff",
   },
   nBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
   },
   nText: { fontFamily: FONTS.body, fontSize: 11, letterSpacing: 0.5 },
   bio: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary ?? "#888",
      lineHeight: 17,
   },
});

// Empty state
const em = StyleSheet.create({
   wrap: { alignItems: "center", gap: 10 },
   icon: { fontSize: 44, marginBottom: 6 },
   title: {
      fontFamily: FONTS.headingBold ?? FONTS.heading,
      fontSize: 18,
      color: COLORS.textPrimary ?? "#fff",
   },
   body: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary ?? "#888",
      textAlign: "center",
      lineHeight: 20,
   },
});
