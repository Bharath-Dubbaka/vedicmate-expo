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
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { matchingAPI } from "../../services/api";
import { useSelector } from "react-redux";
import { selectMatches } from "../../store/slices/matchesSlice";
import BrandHeader from "../../components/BrandHeader";
import { rf, rs, rp } from "../../constants/responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLEARED_KEY = "vedicfind_cleared_notifications";

function buildNotifications(matches, likedMe, viewedMe) {
  const items = [];
  const now = new Date();

  for (const m of matches) {
    if (m.matchedAt) {
      items.push({
        id: `match_${m.matchId}`,
        type: "match",
        title: "💫 New Cosmic Match!",
        body: `You and ${m.user?.name} are cosmically connected — ${m.compatibility?.gunaScore}/36 Gunas`,
        navigateTo: `/(tabs)/chat/${m.matchId}`,
        time: new Date(m.matchedAt),
      });
    }
  }

  if (likedMe.length > 0) {
    items.push({
      id: "likes_batch",
      type: "likes",
      title: "❤️ Someone likes you",
      body: `${likedMe.length} person${
        likedMe.length > 1 ? "s" : ""
      } liked your profile`,
      navigateTo: "/(tabs)/matches",
      time: now,
    });
  }

  if (viewedMe.length > 0) {
    items.push({
      id: "views_batch",
      type: "views",
      title: "👁 Profile views",
      body: `${viewedMe.length} person${
        viewedMe.length > 1 ? "s" : ""
      } viewed your profile`,
      navigateTo: "/(tabs)/matches",
      time: now,
    });
  }

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
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifCard({ item, onPress, onDelete }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
  const typeColors = {
    match: COLORS.gold,
    likes: COLORS.rose,
    views: COLORS.teal || "#4ECDC4",
  };
  const accent = typeColors[item.type] || COLORS.gold;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: rp(12),
        paddingHorizontal: rp(20),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: rs(12),
      }}
    >
      {/* Icon */}
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: rs(12),
        }}
      >
        <View
          style={{
            width: rs(44),
            height: rs(44),
            borderRadius: rs(22),
            backgroundColor: accent + "20",
            borderWidth: 1.5,
            borderColor: accent + "50",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: rf(20) }}>
            {item.type === "match" ? "💫" : item.type === "likes" ? "❤️" : "👁"}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.bodyMedium,
              fontSize: rf(14),
              color: COLORS.textPrimary,
              marginBottom: rp(2),
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(12),
              color: COLORS.textSecondary,
              lineHeight: rf(17),
            }}
            numberOfLines={2}
          >
            {item.body}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(11),
              color: COLORS.textDim,
              marginTop: rp(4),
            }}
          >
            {timeAgo(item.time)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        style={{
          padding: rp(8),
          borderRadius: RADIUS.full,
          backgroundColor: COLORS.bgElevated,
        }}
      >
        <Text style={{ fontSize: rf(14), color: COLORS.textDim }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { COLORS, FONTS, RADIUS } = useTheme();
  const matches = useSelector(selectMatches);

  const [likedMe, setLikedMe] = useState([]);
  const [viewedMe, setViewedMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearedIds, setClearedIds] = useState(new Set());

  // Load cleared IDs from storage
  useEffect(() => {
    AsyncStorage.getItem(CLEARED_KEY)
      .then((val) => {
        if (val) setClearedIds(new Set(JSON.parse(val)));
      })
      .catch(() => {});
  }, []);

  const saveClearedIds = async (ids) => {
    try {
      await AsyncStorage.setItem(CLEARED_KEY, JSON.stringify([...ids]));
    } catch {}
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [a, b] = await Promise.all([
        matchingAPI.getLikedMe(),
        matchingAPI.getViewedMe(),
      ]);
      setLikedMe(a.data.users ?? []);
      setViewedMe(b.data.users ?? []);
    } catch (err) {
      console.error("[NOTIFICATIONS]", err.message);
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

  const allNotifications = buildNotifications(matches, likedMe, viewedMe);
  const notifications = allNotifications.filter((n) => !clearedIds.has(n.id));

  const handleDelete = (id) => {
    const next = new Set(clearedIds);
    next.add(id);
    setClearedIds(next);
    saveClearedIds(next);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert("Clear all?", "Remove all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          const next = new Set(clearedIds);
          allNotifications.forEach((n) => next.add(n.id));
          setClearedIds(next);
          saveClearedIds(next);
        },
      },
    ]);
  };

  const handlePress = (item) => {
    router.push(item.navigateTo);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <BrandHeader
        title="ACTIVITY"
        subtitle="Your recent cosmic connections"
        right={
          notifications.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                paddingHorizontal: rp(10),
                paddingVertical: rp(5),
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.rose + "60",
                backgroundColor: COLORS.rose + "10",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(12),
                  color: COLORS.rose,
                }}
              >
                Clear all
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(14),
              color: COLORS.textSecondary,
              marginTop: rs(16),
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
            <NotifCard
              item={item}
              onPress={handlePress}
              onDelete={handleDelete}
            />
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
                paddingTop: rp(80),
                paddingHorizontal: rp(40),
              }}
            >
              <Text style={{ fontSize: rf(48), marginBottom: rs(16) }}>🌌</Text>
              <Text
                style={{
                  fontFamily: FONTS.heading,
                  fontSize: rf(20),
                  color: COLORS.textPrimary,
                  marginBottom: rs(8),
                  textAlign: "center",
                }}
              >
                No activity yet
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(14),
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  lineHeight: rf(21),
                }}
              >
                When someone likes or matches with you, it will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
