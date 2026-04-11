// app/(tabs)/matches.jsx
//
// Matches screen — three top-level tabs: MESSAGES, REQUESTS, VIEWS.
// REQUESTS subtabs (RECEIVED / SENT) and VIEWS subtabs (VIEWED YOU / YOU VIEWED)
// are rendered only inside their respective sections, not at the top level.
// Free users see blurred cards in RECEIVED and VIEWED YOU with a paywall CTA.

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
import { useRouter, useFocusEffect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
   fetchMatches,
   selectMatches,
   selectMatchesLoading,
} from "../../store/slices/matchesSlice";
import { matchingAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "./paywall";
import { fetchProfiles } from "../../store/slices/discoverSlice";
import CompatibilityModal from "../../components/CompatibilityModal";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Top tab bar (MESSAGES / REQUESTS / VIEWS) ────────────────────────────────
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

// ── Sub tab bar (RECEIVED / SENT or VIEWED YOU / YOU VIEWED) ─────────────────
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

// ── Chat / match card (MESSAGES tab) ─────────────────────────────────────────
function MatchCard({ match, onPress, onPressCompat }) {
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
                  <TouchableOpacity
                     style={mc.scoreBadge}
                     onPress={() => onPressCompat?.(match)}
                     activeOpacity={0.7}
                  >
                     <Text style={mc.scoreText}>{gunaScore}/36 ✦ ›</Text>
                  </TouchableOpacity>
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

// ── Blurred locked card for free users ───────────────────────────────────────
function LockedCard({ user, onUnlock }) {
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
      <View style={lc.card}>
         <View style={lc.photoWrap}>
            {photo ? (
               <Image
                  source={{ uri: photo }}
                  style={lc.photo}
                  blurRadius={25}
               />
            ) : (
               <View style={[lc.photo, lc.photoFallback]}>
                  <Text style={lc.initial}>?</Text>
               </View>
            )}
            <View style={lc.lockOverlay}>
               <Text style={lc.lockIcon}>🔒</Text>
            </View>
         </View>
         <View style={lc.info}>
            <View style={lc.blurredName}>
               <Text style={lc.blurredText}>████████</Text>
            </View>
            {user?.kundli?.nakshatra && (
               <View
                  style={[
                     lc.nBadge,
                     { backgroundColor: GANA_BG[gana] ?? "#1A1A2E" },
                  ]}
               >
                  <Text
                     style={[
                        lc.nText,
                        { color: GANA_COLOR[gana] ?? "#C0A060" },
                     ]}
                  >
                     ✦ {user.kundli.nakshatra}
                  </Text>
               </View>
            )}
            <TouchableOpacity style={lc.unlockBtn} onPress={onUnlock}>
               <Text style={lc.unlockText}>Unlock ✨</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

// ── Upgrade banner shown above locked list ────────────────────────────────────
function PremiumGateHeader({ count, label, onUpgrade }) {
   return (
      <TouchableOpacity
         style={pg.container}
         onPress={onUpgrade}
         activeOpacity={0.85}
      >
         <View style={pg.left}>
            <Text style={pg.emoji}>👑</Text>
            <View>
               <Text style={pg.title}>
                  {count} {label}
               </Text>
               <Text style={pg.sub}>Upgrade to reveal who they are</Text>
            </View>
         </View>
         <View style={pg.btn}>
            <Text style={pg.btnText}>Upgrade</Text>
         </View>
      </TouchableOpacity>
   );
}

// ── Regular card (visible to all — Sent tab and premium users) ────────────────
function RequestCard({ user, onPress }) {
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
      <TouchableOpacity
         style={rc.card}
         onPress={() => onPress?.(user)}
         activeOpacity={0.8}
      >
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
      </TouchableOpacity>
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
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const TOP_TABS = ["MESSAGES", "REQUESTS", "VIEWS"];
const REQUEST_SUBS = ["RECEIVED", "SENT"];
const VIEWS_SUBS = ["VIEWED YOU", "YOU VIEWED"];

export default function MatchesScreen() {
   const router = useRouter();
   const dispatch = useDispatch();

   const matches = useSelector(selectMatches);
   const matchesLoading = useSelector(selectMatchesLoading);

   const [topTab, setTopTab] = useState(0);
   const [reqSubTab, setReqSubTab] = useState(0);
   const [viewSubTab, setViewSubTab] = useState(0);

   const [likedMe, setLikedMe] = useState([]);
   const [likedByMe, setLikedByMe] = useState([]);
   const [reqLoading, setReqLoading] = useState(false);

   const [viewedMe, setViewedMe] = useState([]);
   const [viewedByMe, setViewedByMe] = useState([]);
   const [viewLoading, setViewLoading] = useState(false);

   const [refreshing, setRefreshing] = useState(false);

   const [showPaywall, setShowPaywall] = useState(false);
   const [paywallReason, setPaywallReason] = useState("default");
   const [selectedProfile, setSelectedProfile] = useState(null);

   const {
      isPremium,
      boostActive,
      activateBoost,
      refresh: refreshPremium,
   } = usePremium();

   useFocusEffect(
      useCallback(() => {
         refreshPremium();
         if (matches.length === 0) loadMatches();
      }, []),
   );

   const openPaywall = (reason) => {
      setPaywallReason(reason);
      setShowPaywall(true);
   };
   const closePaywall = () => {
      setShowPaywall(false);
      refreshPremium();
   };

   const loadMatches = useCallback(() => dispatch(fetchMatches()), [dispatch]);

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
         console.error("[Matches] loadRequests error:", err.message);
      } finally {
         setReqLoading(false);
         setRefreshing(false);
      }
   }, []);

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
         console.error("[Matches] loadViews error:", err.message);
      } finally {
         setViewLoading(false);
         setRefreshing(false);
      }
   }, []);

   useEffect(() => {
      loadMatches();
   }, []);
   useEffect(() => {
      if (topTab === 1) loadRequests();
   }, [topTab]);
   useEffect(() => {
      if (topTab === 2) loadViews();
   }, [topTab]);

   const onRefresh = () => {
      setRefreshing(true);
      if (topTab === 0) loadMatches();
      else if (topTab === 1) loadRequests(true);
      else loadViews(true);
   };

   const onMatchPress = (match) => {
      router.push(`/(tabs)/chat/${match.matchId ?? match._id}`);
   };

   const renderRefresh = (
      <RefreshControl
         refreshing={refreshing}
         onRefresh={onRefresh}
         tintColor={COLORS.gold}
      />
   );

   // ── MESSAGES tab ──────────────────────────────────────────────────────────
   const renderMessages = () => {
      if (matchesLoading && matches.length === 0 && !refreshing) {
         return (
            <View style={s.center}>
               <ActivityIndicator size="large" color={COLORS.gold} />
            </View>
         );
      }
      return (
         <FlatList
            data={matches}
            keyExtractor={(m) => String(m.matchId ?? m._id)}
            renderItem={({ item }) => (
               <MatchCard
                  match={item}
                  onPress={onMatchPress}
                  onPressCompat={(match) =>
                     setSelectedProfile({
                        name: match.user?.name,
                        nakshatra: match.user?.cosmicCard?.nakshatra,
                        gunaScore: match.compatibility?.gunaScore,
                        verdict: match.compatibility?.verdict,
                     })
                  }
               />
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
            refreshControl={renderRefresh}
            showsVerticalScrollIndicator={false}
         />
      );
   };

   // ── REQUESTS tab ─────────────────────────────────────────────────────────
   const renderRequests = () => {
      const isReceived = reqSubTab === 0;
      const listData = isReceived ? likedMe : likedByMe;
      const showLocked = isReceived && !isPremium && likedMe.length > 0;

      return (
         <>
            {/* Subtabs rendered ONCE here — not also at the top level */}
            <SubTabBar
               tabs={REQUEST_SUBS}
               active={reqSubTab}
               onSelect={setReqSubTab}
            />

            {reqLoading && !refreshing ? (
               <View style={s.center}>
                  <ActivityIndicator size="large" color={COLORS.gold} />
               </View>
            ) : showLocked ? (
               // Free users see blurred cards
               <FlatList
                  data={likedMe}
                  keyExtractor={(u) => String(u._id)}
                  ListHeaderComponent={
                     <PremiumGateHeader
                        count={likedMe.length}
                        label={`person${likedMe.length !== 1 ? "s" : ""} liked you`}
                        onUpgrade={() => openPaywall("liked_you")}
                     />
                  }
                  renderItem={({ item }) => (
                     <LockedCard
                        user={item}
                        onUnlock={() => openPaywall("liked_you")}
                     />
                  )}
                  contentContainerStyle={s.listPad}
                  refreshControl={renderRefresh}
                  showsVerticalScrollIndicator={false}
               />
            ) : (
               <FlatList
                  data={listData}
                  keyExtractor={(u) => String(u._id)}
                  renderItem={({ item }) => (
                     <RequestCard user={item} onPress={setSelectedProfile} />
                  )}
                  contentContainerStyle={
                     listData.length === 0 ? s.fillCenter : s.listPad
                  }
                  ListEmptyComponent={
                     isReceived ? (
                        <Empty
                           icon="💫"
                           title="No one yet"
                           body="When someone likes you, they'll appear here"
                        />
                     ) : (
                        <Empty
                           icon="🔮"
                           title="No likes sent"
                           body="Profiles you like will appear here"
                        />
                     )
                  }
                  refreshControl={renderRefresh}
                  showsVerticalScrollIndicator={false}
               />
            )}
         </>
      );
   };

   // ── VIEWS tab ─────────────────────────────────────────────────────────────
   const renderViews = () => {
      const isViewedYou = viewSubTab === 0;
      const listData = isViewedYou ? viewedMe : viewedByMe;
      const showLocked = isViewedYou && !isPremium && viewedMe.length > 0;

      return (
         <>
            <SubTabBar
               tabs={VIEWS_SUBS}
               active={viewSubTab}
               onSelect={setViewSubTab}
            />

            {viewLoading && !refreshing ? (
               <View style={s.center}>
                  <ActivityIndicator size="large" color={COLORS.gold} />
               </View>
            ) : showLocked ? (
               <FlatList
                  data={viewedMe}
                  keyExtractor={(u) => String(u._id)}
                  ListHeaderComponent={
                     <PremiumGateHeader
                        count={viewedMe.length}
                        label={`person${viewedMe.length !== 1 ? "s" : ""} viewed your profile`}
                        onUpgrade={() => openPaywall("profile_views")}
                     />
                  }
                  renderItem={({ item }) => (
                     <LockedCard
                        user={item}
                        onUnlock={() => openPaywall("profile_views")}
                     />
                  )}
                  contentContainerStyle={s.listPad}
                  refreshControl={renderRefresh}
                  showsVerticalScrollIndicator={false}
               />
            ) : (
               <FlatList
                  data={listData}
                  keyExtractor={(u) => String(u._id)}
                  renderItem={({ item }) => (
                     <RequestCard user={item} onPress={setSelectedProfile} />
                  )}
                  contentContainerStyle={
                     listData.length === 0 ? s.fillCenter : s.listPad
                  }
                  ListEmptyComponent={
                     isViewedYou ? (
                        <Empty
                           icon="👁"
                           title="No views yet"
                           body="When someone views your profile, they'll appear here"
                        />
                     ) : (
                        <Empty
                           icon="🔍"
                           title="You haven't viewed anyone"
                           body="Profiles you open will appear here"
                        />
                     )
                  }
                  refreshControl={renderRefresh}
                  showsVerticalScrollIndicator={false}
               />
            )}
         </>
      );
   };

   return (
      <SafeAreaView style={s.safe}>
         {/* Header */}
         <View style={s.header}>
            <Text style={s.headerTitle}>Matches</Text>
            <View style={s.headerRight}>
               <TouchableOpacity
                  onPress={() => {
                     if (topTab === 0) loadMatches();
                     else if (topTab === 1) loadRequests();
                     else loadViews();
                  }}
                  style={{ padding: 8, marginRight: 4 }}
               >
                  <Text style={{ fontSize: 18 }}>🔄</Text>
               </TouchableOpacity>
               {isPremium ? (
                  <>
                     <View style={s.premiumBadge}>
                        <Text style={s.premiumBadgeText}>✨ Premium</Text>
                     </View>
                     <TouchableOpacity
                        style={[s.boostBtn, boostActive && s.boostBtnActive]}
                        onPress={async () => {
                           const result = await activateBoost();
                           if (result?.success) {
                              // Re-fetch discover deck so boosted profiles sort to top
                              dispatch(fetchProfiles());
                           }
                        }}
                     >
                        <Text style={s.boostBtnText}>
                           {boostActive ? "🚀 Boosting" : "🚀 Boost"}
                        </Text>
                     </TouchableOpacity>
                  </>
               ) : (
                  <TouchableOpacity onPress={() => openPaywall("default")}>
                     <Text style={s.upgradeHeaderBtn}>✨ Upgrade</Text>
                  </TouchableOpacity>
               )}
            </View>
         </View>

         {/* Top tab bar */}
         <TopTabBar tabs={TOP_TABS} active={topTab} onSelect={setTopTab} />

         {/* Content — each section handles its own subtabs internally */}
         <View style={{ flex: 1 }}>
            {topTab === 0 && renderMessages()}
            {topTab === 1 && renderRequests()}
            {topTab === 2 && renderViews()}
         </View>

         <PaywallModal
            visible={showPaywall}
            onClose={closePaywall}
            triggerReason={paywallReason}
         />
         <CompatibilityModal
            visible={!!selectedProfile}
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
         />
      </SafeAreaView>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
   safe: { flex: 1, backgroundColor: COLORS.bg },
   header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.xl,
      paddingTop: 52,
      paddingBottom: 4,
   },
   headerTitle: {
      fontFamily: FONTS.headingBold,
      fontSize: 16,
      color: COLORS.gold,
      letterSpacing: 4,
   },
   headerRight: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
   premiumBadge: {
      backgroundColor: "rgba(240,192,96,0.15)",
      borderRadius: RADIUS.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: COLORS.gold + "40",
   },
   premiumBadgeText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 11,
      color: COLORS.gold,
   },
   boostBtn: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: COLORS.border,
   },
   boostBtnActive: {
      borderColor: COLORS.gold,
      backgroundColor: "rgba(240,192,96,0.1)",
   },
   boostBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      color: COLORS.textPrimary,
   },
   upgradeHeaderBtn: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 12,
      color: COLORS.gold,
   },
   center: { flex: 1, justifyContent: "center", alignItems: "center" },
   fillCenter: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
   },
   listPad: { paddingHorizontal: SPACING.xl, paddingBottom: 32, paddingTop: 8 },
});

// Top tab bar
const tt = StyleSheet.create({
   container: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
   },
   tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      position: "relative",
   },
   label: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      letterSpacing: 1.5,
   },
   labelActive: { color: COLORS.textPrimary },
   pill: {
      position: "absolute",
      bottom: 0,
      left: "15%",
      right: "15%",
      height: 3,
      borderRadius: 2,
      backgroundColor: COLORS.gold,
   },
});

// Sub tab bar
const st = StyleSheet.create({
   container: {
      flexDirection: "row",
      paddingHorizontal: SPACING.xl,
      paddingTop: 12,
      paddingBottom: 2,
   },
   tab: { marginRight: 28, paddingBottom: 10, position: "relative" },
   label: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
      letterSpacing: 1.5,
   },
   labelActive: { color: COLORS.textPrimary },
   underline: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: COLORS.gold,
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
      borderBottomColor: COLORS.border,
   },
   avatarWrap: { position: "relative", marginRight: 14 },
   avatar: { width: 58, height: 58, borderRadius: 29 },
   avatarFallback: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
   },
   avatarInitial: {
      fontFamily: FONTS.headingBold,
      fontSize: 22,
      color: COLORS.gold,
   },
   badge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: COLORS.gold,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
   },
   badgeText: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.bg },
   body: { flex: 1 },
   nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
   },
   name: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 15,
      color: COLORS.textPrimary,
      flex: 1,
      marginRight: 8,
   },
   scoreBadge: {
      backgroundColor: "rgba(240,192,96,0.15)",
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
   },
   scoreText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.gold },
   lastMsg: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
   },
   lastMsgDim: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textDim,
      fontStyle: "italic",
   },
});

const lc = StyleSheet.create({
   card: {
      flexDirection: "row",
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.md,
      overflow: "hidden",
      marginBottom: 10,
   },
   photoWrap: { position: "relative", width: 90 },
   photo: { width: 90, height: 110 },
   photoFallback: {
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
   },
   lockOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10,11,20,0.5)",
   },
   lockIcon: { fontSize: 20 },
   initial: { fontFamily: FONTS.headingBold, fontSize: 28, color: COLORS.gold },
   info: { flex: 1, padding: 12, justifyContent: "center", gap: 6 },
   blurredName: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 3,
      alignSelf: "flex-start",
   },
   blurredText: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.bgElevated,
      letterSpacing: 2,
   },
   nBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
   },
   nText: { fontFamily: FONTS.body, fontSize: 11, letterSpacing: 0.5 },
   unlockBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.sm,
      paddingHorizontal: 12,
      paddingVertical: 5,
      alignSelf: "flex-start",
   },
   unlockText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.bg },
});

const pg = StyleSheet.create({
   container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(240,192,96,0.08)",
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.gold + "40",
      padding: SPACING.md,
      marginBottom: SPACING.md,
   },
   left: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      flex: 1,
   },
   emoji: { fontSize: 20 },
   title: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 13,
      color: COLORS.textPrimary,
   },
   sub: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary },
   btn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
   },
   btnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.bg },
});

const rc = StyleSheet.create({
   card: {
      flexDirection: "row",
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.md,
      overflow: "hidden",
      marginBottom: 10,
   },
   photo: { width: 90, height: 110 },
   photoFallback: {
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
   },
   initial: { fontFamily: FONTS.headingBold, fontSize: 28, color: COLORS.gold },
   info: { flex: 1, padding: 12, justifyContent: "center", gap: 5 },
   name: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 15,
      color: COLORS.textPrimary,
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
      color: COLORS.textSecondary,
      lineHeight: 17,
   },
});

// Empty state
const em = StyleSheet.create({
   wrap: { alignItems: "center", gap: 10 },
   icon: { fontSize: 44, marginBottom: 6 },
   title: {
      fontFamily: FONTS.headingBold,
      fontSize: 18,
      color: COLORS.textPrimary,
   },
   body: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.textSecondary,
      textAlign: "center",
      lineHeight: 20,
   },
});
