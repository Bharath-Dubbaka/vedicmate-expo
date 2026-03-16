// // app/(tabs)/swipe-history.jsx
// // ─────────────────────────────────────────────────────────────────────────────
// // SWIPE HISTORY
// // Two-tab view:
// //   "I Liked"    — profiles you swiped right on (liked by you)
// //   "Liked Me"   — profiles that swiped right on you
// //
// // API:
// //   GET /api/matching/liked-me   → { users: [...] }  (new in Sprint 2)
// //   Uses matchingAPI.getDiscover() filter for "liked by me" (from user.likedUsers)
// //   Actually: we get the current user's likedUsers list from /api/auth/me
// //   and call a new GET /api/matching/swipe-history endpoint
// // ─────────────────────────────────────────────────────────────────────────────

// import { useState, useEffect, useCallback } from "react";
// import {
//    View,
//    Text,
//    FlatList,
//    Image,
//    TouchableOpacity,
//    ActivityIndicator,
//    RefreshControl,
//    StyleSheet,
//    SafeAreaView,
//    StatusBar,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useSelector } from "react-redux";
// import { selectToken } from "../../store/slices/authSlice";
// import { matchingAPI } from "../../services/api";
// import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

// // ── Nakshatra → gana mapping (same as backend, for badge colour) ──────────────
// const GANA_COLORS = {
//    Deva: { bg: "#1A3A5C", text: "#7EB8E8" },
//    Manav: { bg: "#2A1A0A", text: "#E8A850" },
//    Rakshasa: { bg: "#2A0A1A", text: "#E87070" },
// };

// // ── Small profile card ────────────────────────────────────────────────────────
// function ProfileCard({ user, onPress }) {
//    const ganaStyle = GANA_COLORS[user.kundli?.gana] ?? GANA_COLORS.Manav;

//    return (
//       <TouchableOpacity
//          style={styles.card}
//          onPress={() => onPress(user)}
//          activeOpacity={0.8}
//       >
//          <Image
//             source={{
//                uri: user.photos?.[0] ?? "https://via.placeholder.com/120",
//             }}
//             style={styles.cardImage}
//          />
//          <View style={styles.cardBody}>
//             <Text style={styles.cardName} numberOfLines={1}>
//                {user.name}, {user.age ?? "?"}
//             </Text>
//             {user.kundli?.nakshatra ? (
//                <View
//                   style={[
//                      styles.nakshatraBadge,
//                      { backgroundColor: ganaStyle.bg },
//                   ]}
//                >
//                   <Text
//                      style={[styles.nakshatraText, { color: ganaStyle.text }]}
//                   >
//                      ✦ {user.kundli.nakshatra}
//                   </Text>
//                </View>
//             ) : null}
//             {user.bio ? (
//                <Text style={styles.cardBio} numberOfLines={2}>
//                   {user.bio}
//                </Text>
//             ) : null}
//          </View>
//       </TouchableOpacity>
//    );
// }

// // ── Empty state ───────────────────────────────────────────────────────────────
// function EmptyState({ tab }) {
//    return (
//       <View style={styles.emptyContainer}>
//          <Text style={styles.emptyIcon}>{tab === "liked" ? "🔮" : "✨"}</Text>
//          <Text style={styles.emptyTitle}>
//             {tab === "liked" ? "No likes yet" : "Nobody yet"}
//          </Text>
//          <Text style={styles.emptyBody}>
//             {tab === "liked"
//                ? "Profiles you like will appear here"
//                : "When someone likes you, they'll appear here"}
//          </Text>
//       </View>
//    );
// }

// // ── Main screen ───────────────────────────────────────────────────────────────
// export default function SwipeHistoryScreen() {
//    const router = useRouter();
//    const token = useSelector(selectToken);

//    const [activeTab, setActiveTab] = useState("liked"); // "liked" | "likedMe"
//    const [likedUsers, setLikedUsers] = useState([]);
//    const [likedMeUsers, setLikedMeUsers] = useState([]);
//    const [loading, setLoading] = useState(true);
//    const [refreshing, setRefreshing] = useState(false);
//    const [error, setError] = useState(null);

//    const load = useCallback(async (silent = false) => {
//       if (!silent) setLoading(true);
//       setError(null);
//       try {
//          const [likedRes, likedMeRes] = await Promise.all([
//             matchingAPI.getLikedByMe(), // GET /api/matching/liked-by-me
//             matchingAPI.getLikedMe(), // GET /api/matching/liked-me
//          ]);
//          setLikedUsers(likedRes.data.users ?? []);
//          setLikedMeUsers(likedMeRes.data.users ?? []);
//       } catch (err) {
//          console.error("[SWIPE HISTORY] Load error:", err.message);
//          setError("Couldn't load swipe history. Pull to retry.");
//       } finally {
//          setLoading(false);
//          setRefreshing(false);
//       }
//    }, []);

//    useEffect(() => {
//       load();
//    }, []);

//    const onRefresh = () => {
//       setRefreshing(true);
//       load(true);
//    };

//    const onCardPress = (user) => {
//       // Navigate to a read-only cosmic profile view
//       // For now, no deep-link — just inform user they matched or not
//       // Future: router.push(`/(tabs)/cosmic-profile/${user._id}`)
//       console.log("[SWIPE HISTORY] Tapped profile:", user._id);
//    };

//    const currentList = activeTab === "liked" ? likedUsers : likedMeUsers;

//    return (
//       <SafeAreaView style={styles.safe}>
//          <StatusBar
//             barStyle="light-content"
//             backgroundColor={COLORS.background}
//          />

//          {/* Header */}
//          <View style={styles.header}>
//             <Text style={styles.headerTitle}>Swipe History</Text>
//             <Text style={styles.headerSub}>Your cosmic connections</Text>
//          </View>

//          {/* Tab bar */}
//          <View style={styles.tabBar}>
//             <TouchableOpacity
//                style={[styles.tab, activeTab === "liked" && styles.tabActive]}
//                onPress={() => setActiveTab("liked")}
//             >
//                <Text
//                   style={[
//                      styles.tabText,
//                      activeTab === "liked" && styles.tabTextActive,
//                   ]}
//                >
//                   I Liked ({likedUsers.length})
//                </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//                style={[styles.tab, activeTab === "likedMe" && styles.tabActive]}
//                onPress={() => setActiveTab("likedMe")}
//             >
//                <Text
//                   style={[
//                      styles.tabText,
//                      activeTab === "likedMe" && styles.tabTextActive,
//                   ]}
//                >
//                   Liked Me ({likedMeUsers.length})
//                </Text>
//             </TouchableOpacity>
//          </View>

//          {/* Content */}
//          {loading ? (
//             <View style={styles.centerFlex}>
//                <ActivityIndicator size="large" color={COLORS.primary} />
//                <Text style={styles.loadingText}>Reading the stars…</Text>
//             </View>
//          ) : error ? (
//             <View style={styles.centerFlex}>
//                <Text style={styles.errorText}>{error}</Text>
//                <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
//                   <Text style={styles.retryText}>Retry</Text>
//                </TouchableOpacity>
//             </View>
//          ) : (
//             <FlatList
//                data={currentList}
//                keyExtractor={(item) => item._id}
//                renderItem={({ item }) => (
//                   <ProfileCard user={item} onPress={onCardPress} />
//                )}
//                contentContainerStyle={
//                   currentList.length === 0
//                      ? styles.listEmpty
//                      : styles.listContent
//                }
//                ListEmptyComponent={<EmptyState tab={activeTab} />}
//                refreshControl={
//                   <RefreshControl
//                      refreshing={refreshing}
//                      onRefresh={onRefresh}
//                      tintColor={COLORS.primary}
//                   />
//                }
//                showsVerticalScrollIndicator={false}
//             />
//          )}
//       </SafeAreaView>
//    );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//    safe: {
//       flex: 1,
//       backgroundColor: COLORS.background,
//    },
//    header: {
//       paddingHorizontal: SPACING.lg,
//       paddingTop: SPACING.md,
//       paddingBottom: SPACING.sm,
//    },
//    headerTitle: {
//       fontFamily: FONTS.heading,
//       fontSize: 26,
//       color: COLORS.textPrimary,
//       letterSpacing: 1,
//    },
//    headerSub: {
//       fontFamily: FONTS.body,
//       fontSize: 13,
//       color: COLORS.textSecondary,
//       marginTop: 2,
//    },

//    // Tabs
//    tabBar: {
//       flexDirection: "row",
//       marginHorizontal: SPACING.lg,
//       marginBottom: SPACING.md,
//       borderRadius: RADIUS.md,
//       backgroundColor: COLORS.surface,
//       padding: 4,
//    },
//    tab: {
//       flex: 1,
//       paddingVertical: 10,
//       alignItems: "center",
//       borderRadius: RADIUS.sm,
//    },
//    tabActive: {
//       backgroundColor: COLORS.primary,
//    },
//    tabText: {
//       fontFamily: FONTS.bodySemiBold,
//       fontSize: 14,
//       color: COLORS.textSecondary,
//    },
//    tabTextActive: {
//       color: COLORS.background,
//    },

//    // List
//    listContent: {
//       paddingHorizontal: SPACING.lg,
//       paddingBottom: SPACING.xl,
//       gap: SPACING.sm,
//    },
//    listEmpty: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       paddingTop: 80,
//    },

//    // Card
//    card: {
//       flexDirection: "row",
//       backgroundColor: COLORS.surface,
//       borderRadius: RADIUS.md,
//       overflow: "hidden",
//       marginBottom: SPACING.sm,
//    },
//    cardImage: {
//       width: 90,
//       height: 100,
//       backgroundColor: COLORS.surfaceAlt,
//    },
//    cardBody: {
//       flex: 1,
//       padding: SPACING.sm,
//       justifyContent: "center",
//       gap: 4,
//    },
//    cardName: {
//       fontFamily: FONTS.bodySemiBold,
//       fontSize: 16,
//       color: COLORS.textPrimary,
//    },
//    nakshatraBadge: {
//       alignSelf: "flex-start",
//       paddingHorizontal: 8,
//       paddingVertical: 3,
//       borderRadius: 20,
//    },
//    nakshatraText: {
//       fontFamily: FONTS.body,
//       fontSize: 11,
//       letterSpacing: 0.5,
//    },
//    cardBio: {
//       fontFamily: FONTS.body,
//       fontSize: 12,
//       color: COLORS.textSecondary,
//       lineHeight: 17,
//    },

//    // Empty / loading
//    centerFlex: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       gap: SPACING.sm,
//    },
//    loadingText: {
//       fontFamily: FONTS.body,
//       fontSize: 14,
//       color: COLORS.textSecondary,
//       marginTop: SPACING.sm,
//    },
//    errorText: {
//       fontFamily: FONTS.body,
//       fontSize: 14,
//       color: COLORS.error ?? "#E87070",
//       textAlign: "center",
//       paddingHorizontal: SPACING.xl,
//    },
//    retryBtn: {
//       marginTop: SPACING.sm,
//       paddingHorizontal: SPACING.lg,
//       paddingVertical: SPACING.sm,
//       backgroundColor: COLORS.primary,
//       borderRadius: RADIUS.full,
//    },
//    retryText: {
//       fontFamily: FONTS.bodySemiBold,
//       fontSize: 14,
//       color: COLORS.background,
//    },

//    // Empty state
//    emptyContainer: {
//       alignItems: "center",
//       gap: SPACING.sm,
//       paddingHorizontal: SPACING.xl,
//    },
//    emptyIcon: {
//       fontSize: 48,
//       marginBottom: SPACING.sm,
//    },
//    emptyTitle: {
//       fontFamily: FONTS.heading,
//       fontSize: 20,
//       color: COLORS.textPrimary,
//    },
//    emptyBody: {
//       fontFamily: FONTS.body,
//       fontSize: 14,
//       color: COLORS.textSecondary,
//       textAlign: "center",
//       lineHeight: 20,
//    },
// });
