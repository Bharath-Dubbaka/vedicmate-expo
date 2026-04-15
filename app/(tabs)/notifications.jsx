// app/(tabs)/notifications.jsx
// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS / ACTIVITY TAB
//
// Shows recent activity: new matches, messages, likes, profile views.
// Data comes from the existing match/like/view APIs — no new backend needed
// for initial version. Each item is a tap-to-navigate card.
// ─────────────────────────────────────────────────────────────────────────────


import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { matchingAPI } from "../../services/api";
import { useSelector } from "react-redux";
import { selectMatches } from "../../store/slices/matchesSlice";

// ── Notification types ────────────────────────────────────────────────────────
function buildNotifications(matches, likedMe, viewedMe) {
  const items = [];
  const now = new Date();

  // New matches (last 7 days)
  for (const m of matches) {
    if (m.matchedAt) {
      items.push({
        id: `match_${m.matchId}`,
        type: "match",
        title: "💫 New Cosmic Match!",
        body: `You and ${m.user?.name} are cosmically connected — ${m.compatibility?.gunaScore}/36 Gunas`,
        photo: m.user?.photo,
        navigateTo: `/(tabs)/chat/${m.matchId}`,
        time: new Date(m.matchedAt),
      });
    }
  }

  // People who liked you (premium shows real, free shows count)
  if (likedMe.length > 0) {
    items.push({
      id: "likes_batch",
      type: "likes",
      title: "❤️ Someone likes you",
      body: `${likedMe.length} person${
        likedMe.length > 1 ? "s" : ""
      } liked your profile`,
      photo: likedMe[0]?.photos?.[0] || null,
      navigateTo: "/(tabs)/matches",
      time: now,
    });
  }

  // Profile views (premium)
  if (viewedMe.length > 0) {
    items.push({
      id: "views_batch",
      type: "views",
      title: "👁 Profile views",
      body: `${viewedMe.length} person${
        viewedMe.length > 1 ? "s" : ""
      } viewed your profile`,
      photo: viewedMe[0]?.photos?.[0] || null,
      navigateTo: "/(tabs)/matches",
      time: now,
    });
  }

  // Sort by time, newest first
  items.sort((a, b) => b.time - a.time);
  return items;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Single notification card ─────────────────────────────────────────────────
function NotifCard({ item, onPress }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();

  const typeColors = {
    match: COLORS.gold,
    likes: COLORS.rose,
    views: COLORS.teal,
    message: COLORS.manushya,
  };
  const accent = typeColors[item.type] || COLORS.gold;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SPACING.md,
      }}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar / placeholder */}
      <View style={{ position: "relative" }}>
        {item.photo ? (
          <Image
            source={{ uri: item.photo }}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
        ) : (
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: COLORS.bgElevated,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: accent,
            }}
          >
            <Text style={{ fontSize: 22 }}>
              {item.type === "match"
                ? "💫"
                : item.type === "likes"
                ? "❤️"
                : item.type === "views"
                ? "👁"
                : "💬"}
            </Text>
          </View>
        )}
        {/* Accent dot */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: accent,
            borderWidth: 2,
            borderColor: COLORS.bg,
          }}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.bodyMedium,
            fontSize: 14,
            color: COLORS.textPrimary,
            marginBottom: 2,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.textSecondary,
            lineHeight: 17,
          }}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>

      {/* Time */}
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 11,
          color: COLORS.textDim,
          flexShrink: 0,
        }}
      >
        {timeAgo(item.time)}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { COLORS, FONTS, SPACING } = useTheme();
  const matches = useSelector(selectMatches);

  const [likedMe, setLikedMe] = useState([]);
  const [viewedMe, setViewedMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [likedRes, viewedRes] = await Promise.all([
        matchingAPI.getLikedMe(),
        matchingAPI.getViewedMe(),
      ]);
      setLikedMe(likedRes.data.users ?? []);
      setViewedMe(viewedRes.data.users ?? []);
    } catch (err) {
      console.error("[NOTIFICATIONS] Load error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [])
  );
  useEffect(() => {
    load();
  }, []);

  const notifications = buildNotifications(matches, likedMe, viewedMe);

  const handlePress = (item) => {
    router.push(item.navigateTo);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: SPACING.xl,
          paddingTop: 52,
          paddingBottom: SPACING.md,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.headingBold,
            fontSize: 16,
            color: COLORS.gold,
            letterSpacing: 4,
          }}
        >
          ACTIVITY
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.textSecondary,
            marginTop: 2,
          }}
        >
          Your recent cosmic connections
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginTop: SPACING.md,
            }}
          >
            Reading the stars...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotifCard item={item} onPress={handlePress} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={COLORS.gold}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 80,
                paddingHorizontal: SPACING.xl,
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🌌</Text>
              <Text
                style={{
                  fontFamily: FONTS.heading,
                  fontSize: 20,
                  color: COLORS.textPrimary,
                  marginBottom: SPACING.sm,
                  textAlign: "center",
                }}
              >
                No activity yet
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  lineHeight: 21,
                }}
              >
                When someone likes or matches with you, it will appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
