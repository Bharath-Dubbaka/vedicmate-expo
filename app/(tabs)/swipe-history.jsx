// app/(tabs)/swipe-history.jsx
//
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { matchingAPI } from "../../services/api";

function ProfileCard({ user, onPress }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const gana = user?.kundli?.gana;
  const GANA_COLOR = {
    Deva: COLORS.deva,
    Manushya: COLORS.manushya,
    Rakshasa: COLORS.rakshasa,
  };
  const ganaColor = GANA_COLOR[gana] || COLORS.gold;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.md,
        overflow: "hidden",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
      onPress={() => onPress?.(user)}
      activeOpacity={0.8}
    >
      {user?.photos?.[0] ? (
        <Image
          source={{ uri: user.photos[0] }}
          style={{ width: 90, height: 110 }}
        />
      ) : (
        <View
          style={{
            width: 90,
            height: 110,
            backgroundColor: COLORS.bgElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.headingBold,
              fontSize: 28,
              color: COLORS.textDim,
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, padding: 12, justifyContent: "center", gap: 5 }}>
        <Text
          style={{
            fontFamily: FONTS.bodyMedium,
            fontSize: 15,
            color: COLORS.textPrimary,
          }}
        >
          {user?.name ?? "—"}
          {user?.age ? `, ${user.age}` : ""}
        </Text>
        {user?.kundli?.nakshatra && (
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 20,
              backgroundColor: ganaColor + "20",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 11,
                color: ganaColor,
                letterSpacing: 0.5,
              }}
            >
              ✦ {user.kundli.nakshatra}
            </Text>
          </View>
        )}
        {user?.bio ? (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.textSecondary,
              lineHeight: 17,
            }}
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab }) {
  const { COLORS, FONTS, SPACING } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        gap: 10,
        paddingTop: 60,
        paddingHorizontal: SPACING.xl,
      }}
    >
      <Text style={{ fontSize: 44, marginBottom: 6 }}>
        {tab === "liked" ? "🔮" : "⏩"}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.headingBold,
          fontSize: 18,
          color: COLORS.textPrimary,
        }}
      >
        {tab === "liked" ? "No likes yet" : "No passes yet"}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 13,
          color: COLORS.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {tab === "liked"
          ? "Profiles you liked will appear here"
          : "Profiles you passed will appear here"}
      </Text>
    </View>
  );
}

export default function SwipeHistoryScreen() {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const [activeTab, setActiveTab] = useState("liked");
  const [likedUsers, setLikedUsers] = useState([]);
  const [passedUsers, setPassedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [likedRes, passedRes] = await Promise.all([
        matchingAPI.getLikedByMe(),
        matchingAPI.getPassedByMe(),
      ]);
      setLikedUsers(likedRes.data.users ?? []);
      setPassedUsers(passedRes.data.users ?? []);
    } catch (err) {
      console.error("[SWIPE HISTORY] Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const currentList = activeTab === "liked" ? likedUsers : passedUsers;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: SPACING.xl,
          paddingTop: 52,
          paddingBottom: 4,
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
          SWIPE HISTORY
        </Text>
      </View>

      {/* Tab bar */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: SPACING.xl,
          marginVertical: SPACING.md,
          borderRadius: RADIUS.lg,
          backgroundColor: COLORS.bgElevated,
          padding: 4,
        }}
      >
        {[
          { key: "liked", label: `I Liked (${likedUsers.length})` },
          { key: "passed", label: `Passed (${passedUsers.length})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              {
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: RADIUS.md,
              },
              activeTab === tab.key && { backgroundColor: COLORS.gold },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                { fontFamily: FONTS.bodyMedium, fontSize: 14 },
                {
                  color:
                    activeTab === tab.key ? COLORS.bg : COLORS.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
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
            Loading...
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(u) => String(u._id)}
          renderItem={({ item }) => <ProfileCard user={item} />}
          contentContainerStyle={{
            paddingHorizontal: SPACING.xl,
            paddingBottom: 32,
            ...(currentList.length === 0
              ? { flexGrow: 1, justifyContent: "center" }
              : {}),
          }}
          ListEmptyComponent={<EmptyState tab={activeTab} />}
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
        />
      )}
    </SafeAreaView>
  );
}
