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
import { useTheme } from "../../context/ThemeContext";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "./paywall";
import { fetchProfiles } from "../../store/slices/discoverSlice";
import CompatibilityModal from "../../components/CompatibilityModal";
import BlockReportModal from "../../components/BlockReportModal";

const { width: SCREEN_W } = Dimensions.get("window");

function TopTabBar({ tabs, active, onSelect }) {
  const { COLORS, FONTS } = useTheme();
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
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      {tabs.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 14,
            position: "relative",
          }}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              letterSpacing: 1.5,
              color: active === i ? COLORS.textPrimary : COLORS.textSecondary,
            }}
          >
            {label}
          </Text>
          {active === i && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: "15%",
                right: "15%",
                height: 3,
                borderRadius: 2,
                backgroundColor: COLORS.gold,
              }}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SubTabBar({ tabs, active, onSelect }) {
  const { COLORS, FONTS, SPACING } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: SPACING.xl,
        paddingTop: 12,
        paddingBottom: 2,
      }}
    >
      {tabs.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={{ marginRight: 28, paddingBottom: 10, position: "relative" }}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              letterSpacing: 1.5,
              color: active === i ? COLORS.textPrimary : COLORS.textSecondary,
            }}
          >
            {label}
          </Text>
          {active === i && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: COLORS.gold,
                borderRadius: 1,
              }}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MatchCard({ match, onPress, onPressCompat, onLongPress }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const other = match.user ?? match.matchedUser;
  const photo = other?.photo ?? other?.photos?.[0];
  const unread = typeof match.unreadCount === "number" ? match.unreadCount : 0;
  const gunaScore = match.compatibility?.gunaScore ?? match.gunaScore;
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
      onPress={() => onPress(match)}
      onLongPress={() => onLongPress?.(match)}
      activeOpacity={0.8}
    >
      <View style={{ position: "relative", marginRight: 14 }}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={{ width: 58, height: 58, borderRadius: 29 }}
          />
        ) : (
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: COLORS.bgElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: 22,
                color: COLORS.gold,
              }}
            >
              {other?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        {unread > 0 && (
          <View
            style={{
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
            }}
          >
            <Text
              style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.bg }}
            >
              {unread > 9 ? "9+" : unread}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyMedium,
              fontSize: 15,
              color: COLORS.textPrimary,
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {other?.name ?? "—"}
            {other?.age ? `, ${other.age}` : ""}
          </Text>
          {gunaScore != null && (
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.gold + "25",
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
              onPress={() => onPressCompat?.(match)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.gold,
                }}
              >
                {gunaScore}/36 ✦ ›
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {match.lastMessage ? (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textSecondary,
            }}
            numberOfLines={1}
          >
            {typeof match.lastMessage === "string"
              ? match.lastMessage
              : match.lastMessage?.text ?? ""}
          </Text>
        ) : (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textDim,
              fontStyle: "italic",
            }}
          >
            Tap to say namaste 🙏
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function LockedCard({ user, onUnlock }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  const gana = user?.kundli?.gana;
  const GANA_COLOR = {
    Deva: COLORS.deva,
    Manushya: COLORS.manushya,
    Rakshasa: COLORS.rakshasa,
  };
  const ganaColor = GANA_COLOR[gana] || COLORS.gold;
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.md,
        overflow: "hidden",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View style={{ position: "relative", width: 90 }}>
        {user?.photos?.[0] ? (
          <Image
            source={{ uri: user.photos[0] }}
            style={{ width: 90, height: 110 }}
            blurRadius={25}
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
              ?
            </Text>
          </View>
        )}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(10,11,20,0.5)",
          }}
        >
          <Text style={{ fontSize: 20 }}>🔒</Text>
        </View>
      </View>
      <View style={{ flex: 1, padding: 12, justifyContent: "center", gap: 6 }}>
        <View
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 3,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.bgElevated,
              letterSpacing: 2,
            }}
          >
            ████████
          </Text>
        </View>
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
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.gold,
            borderRadius: RADIUS.sm,
            paddingHorizontal: 12,
            paddingVertical: 5,
            alignSelf: "flex-start",
          }}
          onPress={onUnlock}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 12,
              color: COLORS.bg,
            }}
          >
            Unlock ✨
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RequestCard({ user, onPress }) {
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
          numberOfLines={1}
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
        {user?.bio && (
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
        )}
      </View>
    </TouchableOpacity>
  );
}

function PremiumGateHeader({ count, label, onUpgrade }) {
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.gold + "12",
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gold + "40",
        padding: SPACING.md,
        marginBottom: SPACING.md,
      }}
      onPress={onUpgrade}
      activeOpacity={0.85}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          flex: 1,
        }}
      >
        <Text style={{ fontSize: 20 }}>👑</Text>
        <View>
          <Text
            style={{
              fontFamily: FONTS.bodyMedium,
              fontSize: 13,
              color: COLORS.textPrimary,
            }}
          >
            {count} {label}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            Upgrade to reveal who they are
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: COLORS.gold,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md,
          paddingVertical: 6,
        }}
      >
        <Text
          style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.bg }}
        >
          Upgrade
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function Empty({ icon, title, body }) {
  const { COLORS, FONTS } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <Text style={{ fontSize: 44, marginBottom: 6 }}>{icon}</Text>
      <Text
        style={{
          fontFamily: FONTS.headingBold,
          fontSize: 18,
          color: COLORS.textPrimary,
        }}
      >
        {title}
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
        {body}
      </Text>
    </View>
  );
}

const TOP_TABS = ["MESSAGES", "REQUESTS", "VIEWS"];
const REQUEST_SUBS = ["RECEIVED", "SENT"];
const VIEWS_SUBS = ["VIEWED YOU", "YOU VIEWED"];

export default function MatchesScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { COLORS, FONTS, SPACING } = useTheme();
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
  const [blockReportTarget, setBlockReportTarget] = useState(null); // { matchId, userId, userName }

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
    }, [])
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
      const [a, b] = await Promise.all([
        matchingAPI.getLikedMe(),
        matchingAPI.getLikedByMe(),
      ]);
      setLikedMe(a.data.users ?? []);
      setLikedByMe(b.data.users ?? []);
    } catch {
    } finally {
      setReqLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadViews = useCallback(async (silent = false) => {
    if (!silent) setViewLoading(true);
    try {
      const [a, b] = await Promise.all([
        matchingAPI.getViewedMe(),
        matchingAPI.getViewedByMe(),
      ]);
      setViewedMe(a.data.users ?? []);
      setViewedByMe(b.data.users ?? []);
    } catch {
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
  const renderRefresh = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={COLORS.gold}
    />
  );

  const renderMessages = () => {
    if (matchesLoading && matches.length === 0 && !refreshing)
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      );
    return (
      <FlatList
        data={matches}
        keyExtractor={(m) => String(m.matchId ?? m._id)}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={(m) => router.push(`/(tabs)/chat/${m.matchId ?? m._id}`)}
            onPressCompat={(m) =>
              setSelectedProfile({
                name: m.user?.name,
                nakshatra: m.user?.cosmicCard?.nakshatra,
                gunaScore: m.compatibility?.gunaScore,
                verdict: m.compatibility?.verdict,
              })
            }
            onLongPress={(m) =>
              setBlockReportTarget({
                matchId: m.matchId,
                userId: m.user?.id,
                userName: m.user?.name,
              })
            }
          />
        )}
        contentContainerStyle={
          matches.length === 0
            ? {
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 40,
              }
            : {
                paddingHorizontal: SPACING.xl,
                paddingBottom: 32,
                paddingTop: 8,
              }
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

  const renderRequests = () => {
    const isReceived = reqSubTab === 0;
    const listData = isReceived ? likedMe : likedByMe;
    const showLocked = isReceived && !isPremium && likedMe.length > 0;
    return (
      <>
        <SubTabBar
          tabs={REQUEST_SUBS}
          active={reqSubTab}
          onSelect={setReqSubTab}
        />
        {reqLoading && !refreshing ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.gold} />
          </View>
        ) : showLocked ? (
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
            contentContainerStyle={{
              paddingHorizontal: SPACING.xl,
              paddingBottom: 32,
              paddingTop: 8,
            }}
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
              listData.length === 0
                ? {
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 40,
                  }
                : {
                    paddingHorizontal: SPACING.xl,
                    paddingBottom: 32,
                    paddingTop: 8,
                  }
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
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.gold} />
          </View>
        ) : showLocked ? (
          <FlatList
            data={viewedMe}
            keyExtractor={(u) => String(u._id)}
            ListHeaderComponent={
              <PremiumGateHeader
                count={viewedMe.length}
                label={`person${
                  viewedMe.length !== 1 ? "s" : ""
                } viewed your profile`}
                onUpgrade={() => openPaywall("profile_views")}
              />
            }
            renderItem={({ item }) => (
              <LockedCard
                user={item}
                onUnlock={() => openPaywall("profile_views")}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: SPACING.xl,
              paddingBottom: 32,
              paddingTop: 8,
            }}
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
              listData.length === 0
                ? {
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 40,
                  }
                : {
                    paddingHorizontal: SPACING.xl,
                    paddingBottom: 32,
                    paddingTop: 8,
                  }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
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
          MATCHES
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.sm,
          }}
        >
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
              <View
                style={{
                  backgroundColor: COLORS.gold + "25",
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: COLORS.gold + "40",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: 11,
                    color: COLORS.gold,
                  }}
                >
                  ✨ Premium
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: boostActive
                    ? COLORS.gold + "20"
                    : COLORS.bgElevated,
                  borderRadius: SPACING.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: boostActive ? COLORS.gold : COLORS.border,
                }}
                onPress={async () => {
                  const r = await activateBoost();
                  if (r?.success) dispatch(fetchProfiles());
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: 12,
                    color: COLORS.textPrimary,
                  }}
                >
                  {boostActive ? "🚀 Boosting" : "🚀 Boost"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => openPaywall("default")}>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 12,
                  color: COLORS.gold,
                }}
              >
                ✨ Upgrade
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TopTabBar tabs={TOP_TABS} active={topTab} onSelect={setTopTab} />
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
      {blockReportTarget && (
        <BlockReportModal
          visible={!!blockReportTarget}
          matchId={blockReportTarget.matchId}
          userId={blockReportTarget.userId}
          userName={blockReportTarget.userName}
          onClose={() => setBlockReportTarget(null)}
          onBlocked={() => {
            setBlockReportTarget(null);
            loadMatches();
          }}
        />
      )}
    </SafeAreaView>
  );
}
