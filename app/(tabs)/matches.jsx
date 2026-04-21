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
  Animated,
  StyleSheet,
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
import BrandHeader from "../../components/BrandHeader";
import ProfileViewer from "../../components/ProfileViewer";
import { rf, rs, rp } from "../../constants/responsive";

function TopTabBar({ tabs, active, onSelect }) {
  const { COLORS, FONTS } = useTheme();
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
            paddingVertical: rp(12),
            position: "relative",
          }}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyMedium,
              fontSize: rf(12),
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
                height: rs(3),
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
  const { COLORS, FONTS } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: rp(20),
        paddingTop: rp(12),
        paddingBottom: rp(4),
      }}
    >
      {tabs.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={{
            marginRight: rs(24),
            paddingBottom: rp(10),
            position: "relative",
          }}
          onPress={() => onSelect(i)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(12),
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
                height: rs(2),
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

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({ match, onPress, onPressCompat, onLongPress }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
  const other = match.user ?? match.matchedUser;
  const photo = other?.photo ?? other?.photos?.[0];
  const unread = typeof match.unreadCount === "number" ? match.unreadCount : 0;
  const gunaScore = match.compatibility?.gunaScore ?? match.gunaScore;
  const verdict = match.compatibility?.verdict ?? match.verdict ?? "";
  const nakshatra =
    other?.cosmicCard?.nakshatra || other?.kundli?.nakshatra || "";

  const VERDICT_DOT = {
    "Excellent Match": "#FFD700",
    "Good Match": "#4ADE80",
    "Average Match": "#FB923C",
    "Challenging Match": "#F87171",
  };
  const dot = VERDICT_DOT[verdict] || COLORS.gold;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: rp(12),
        paddingHorizontal: rp(20),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: rs(12),
      }}
      onPress={() => onPress(match)}
      onLongPress={() => onLongPress?.(match)}
      activeOpacity={0.8}
    >
      <View style={{ position: "relative" }}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={{
              width: rs(54),
              height: rs(54),
              borderRadius: rs(27),
              borderWidth: 2,
              borderColor: dot + "80",
            }}
          />
        ) : (
          <View
            style={{
              width: rs(54),
              height: rs(54),
              borderRadius: rs(27),
              backgroundColor: COLORS.bgElevated,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(20),
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
              minWidth: rs(18),
              height: rs(18),
              borderRadius: rs(9),
              backgroundColor: COLORS.rose,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: COLORS.bg,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: rf(9),
                color: "#fff",
              }}
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
            marginBottom: rp(2),
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: rf(15),
              color: COLORS.textPrimary,
              flex: 1,
              marginRight: rs(8),
            }}
            numberOfLines={1}
          >
            {other?.name ?? "—"}
            {other?.age ? `, ${other.age}` : ""}
          </Text>
          {gunaScore != null && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: rs(4),
                backgroundColor: dot + "15",
                borderRadius: RADIUS.full,
                paddingHorizontal: rp(8),
                paddingVertical: rp(3),
                borderWidth: 1,
                borderColor: dot + "40",
              }}
              onPress={() => onPressCompat?.(match)}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: rs(6),
                  height: rs(6),
                  borderRadius: rs(3),
                  backgroundColor: dot,
                }}
              />
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: rf(11),
                  color: dot,
                }}
              >
                {gunaScore}/36
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {nakshatra ? (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(11),
              color: COLORS.gold,
              marginBottom: rp(2),
            }}
          >
            ✦ {nakshatra}
          </Text>
        ) : null}
        {match.lastMessage ? (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(12),
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
              fontSize: rf(12),
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

// ── Locked card ───────────────────────────────────────────────────────────────
function LockedCard({ user, onUnlock }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
  const gana = user?.kundli?.gana;
  const GANA_COLOR = {
    Deva: COLORS.deva,
    Manushya: COLORS.manushya,
    Rakshasa: COLORS.rakshasa,
  };
  const ganaColor = GANA_COLOR[gana] || COLORS.gold;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity
      style={{
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        marginBottom: rp(10),
        height: rs(100),
        borderWidth: 1,
        borderColor: ganaColor + "30",
        shadowColor: ganaColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
      }}
      onPress={onUnlock}
      activeOpacity={0.85}
    >
      <View style={StyleSheet.absoluteFill}>
        {user?.photos?.[0] ? (
          <Image
            source={{ uri: user.photos[0] }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            blurRadius={18}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: COLORS.bgElevated }} />
        )}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(10,11,20,0.72)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: rs(3),
            backgroundColor: ganaColor,
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: rp(16),
          paddingVertical: rp(12),
          gap: rs(12),
        }}
      >
        <Animated.View
          style={{
            width: rs(44),
            height: rs(44),
            borderRadius: rs(22),
            backgroundColor: ganaColor + "25",
            borderWidth: 1.5,
            borderColor: ganaColor + "60",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Text style={{ fontSize: rf(20) }}>🔒</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: rs(4),
              width: rs(80),
              height: rs(12),
              marginBottom: rp(6),
            }}
          />
          {user?.kundli?.nakshatra && (
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: rs(4),
                paddingHorizontal: rp(8),
                paddingVertical: rp(3),
                borderRadius: RADIUS.full,
                backgroundColor: ganaColor + "30",
                borderWidth: 1,
                borderColor: ganaColor + "50",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: ganaColor,
                }}
              >
                ✦ {user.kundli.nakshatra}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: ganaColor,
            borderRadius: RADIUS.md,
            paddingHorizontal: rp(14),
            paddingVertical: rp(8),
          }}
          onPress={onUnlock}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: rf(12),
              color: "#fff",
            }}
          >
            Reveal ✨
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Profile card (revealed — premium) ────────────────────────────────────────
// Tappable → opens full ProfileViewer with compatibility + Send Like button
function RevealedCard({ user, onPress, badge }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
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
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        marginBottom: rp(10),
        height: rs(110),
        borderWidth: 1,
        borderColor: ganaColor + "50",
        shadowColor: ganaColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
      }}
      onPress={() => onPress?.(user)}
      activeOpacity={0.85}
    >
      <View style={StyleSheet.absoluteFill}>
        {user?.photos?.[0] ? (
          <Image
            source={{ uri: user.photos[0] }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: ganaColor + "20" }} />
        )}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: user?.photos?.[0]
              ? "rgba(0,0,0,0.4)"
              : "rgba(0,0,0,0.05)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: rs(3),
            backgroundColor: ganaColor,
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: rp(16),
          paddingVertical: rp(12),
          gap: rs(12),
        }}
      >
        <View
          style={{
            width: rs(48),
            height: rs(48),
            borderRadius: rs(24),
            borderWidth: 2,
            borderColor: ganaColor,
            backgroundColor: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {user?.photos?.[0] ? (
            <Image
              source={{ uri: user.photos[0] }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(18),
                color: ganaColor,
              }}
            >
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: rf(15),
              color: user?.photos?.[0] ? "#fff" : COLORS.textPrimary,
              marginBottom: rp(3),
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
                flexDirection: "row",
                alignItems: "center",
                gap: rs(4),
                paddingHorizontal: rp(8),
                paddingVertical: rp(2),
                borderRadius: RADIUS.full,
                backgroundColor: ganaColor + (user?.photos?.[0] ? "40" : "20"),
                borderWidth: 1,
                borderColor: ganaColor + "60",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: user?.photos?.[0] ? "#fff" : ganaColor,
                }}
              >
                ✦ {user.kundli.nakshatra}
              </Text>
            </View>
          )}
        </View>
        {badge && (
          <View
            style={{
              backgroundColor: ganaColor + "30",
              borderRadius: RADIUS.md,
              paddingHorizontal: rp(8),
              paddingVertical: rp(5),
              borderWidth: 1,
              borderColor: ganaColor + "60",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: rf(16) }}>{badge.emoji}</Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(9),
                color: user?.photos?.[0] ? "#fff" : ganaColor,
                marginTop: 2,
              }}
            >
              {badge.label}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PremiumGateHeader({ count, label, onUpgrade }) {
  const { COLORS, FONTS, RADIUS } = useTheme();
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
        padding: rp(14),
        marginBottom: rp(12),
      }}
      onPress={onUpgrade}
      activeOpacity={0.85}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: rs(10),
          flex: 1,
        }}
      >
        <Text style={{ fontSize: rf(20) }}>👑</Text>
        <View>
          <Text
            style={{
              fontFamily: FONTS.bodyMedium,
              fontSize: rf(13),
              color: COLORS.textPrimary,
            }}
          >
            {count} {label}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(11),
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
          paddingHorizontal: rp(12),
          paddingVertical: rp(6),
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bodyBold,
            fontSize: rf(12),
            color: "#fff",
          }}
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
    <View style={{ alignItems: "center", gap: rs(10) }}>
      <Text style={{ fontSize: rf(44), marginBottom: rs(6) }}>{icon}</Text>
      <Text
        style={{
          fontFamily: FONTS.headingBold,
          fontSize: rf(18),
          color: COLORS.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: rf(13),
          color: COLORS.textSecondary,
          textAlign: "center",
          lineHeight: rf(20),
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
  const { COLORS, FONTS, RADIUS } = useTheme();
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
  const [selectedProfile, setSelectedProfile] = useState(null); // for CompatibilityModal
  const [viewingUser, setViewingUser] = useState(null); // for ProfileViewer
  const [blockReportTarget, setBlockReportTarget] = useState(null);

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

  // When clicking on a viewed/liked user:
  // - Premium: open full ProfileViewer
  // - Free: open paywall
  const handleProfileCardPress = (user, paywallReason) => {
    if (isPremium) {
      setViewingUser(user);
    } else {
      openPaywall(paywallReason);
    }
  };

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
                // Pass userId so CompatibilityModal can fetch live data
                userId: m.user?.id,
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
                padding: rp(40),
              }
            : { paddingBottom: rp(32) }
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
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(u) => String(u._id)}
            ListHeaderComponent={
              showLocked ? (
                <PremiumGateHeader
                  count={likedMe.length}
                  label={`person${likedMe.length !== 1 ? "s" : ""} liked you`}
                  onUpgrade={() => openPaywall("liked_you")}
                />
              ) : null
            }
            renderItem={({ item }) =>
              showLocked ? (
                <LockedCard
                  user={item}
                  onUnlock={() => openPaywall("liked_you")}
                />
              ) : (
                <RevealedCard
                  user={item}
                  onPress={(u) => handleProfileCardPress(u, "liked_you")}
                  badge={
                    isReceived
                      ? { emoji: "❤️", label: "Liked you" }
                      : { emoji: "✦", label: "You liked" }
                  }
                />
              )
            }
            contentContainerStyle={
              listData.length === 0
                ? {
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: rp(40),
                  }
                : {
                    paddingHorizontal: rp(20),
                    paddingBottom: rp(32),
                    paddingTop: rp(4),
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
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(u) => String(u._id)}
            ListHeaderComponent={
              showLocked ? (
                <PremiumGateHeader
                  count={viewedMe.length}
                  label={`person${
                    viewedMe.length !== 1 ? "s" : ""
                  } viewed your profile`}
                  onUpgrade={() => openPaywall("profile_views")}
                />
              ) : null
            }
            renderItem={({ item }) =>
              showLocked ? (
                <LockedCard
                  user={item}
                  onUnlock={() => openPaywall("profile_views")}
                />
              ) : (
                <RevealedCard
                  user={item}
                  onPress={(u) => handleProfileCardPress(u, "profile_views")}
                  badge={
                    isViewedYou
                      ? { emoji: "👁", label: "Viewed you" }
                      : { emoji: "🔍", label: "You viewed" }
                  }
                />
              )
            }
            contentContainerStyle={
              listData.length === 0
                ? {
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: rp(40),
                  }
                : {
                    paddingHorizontal: rp(20),
                    paddingBottom: rp(32),
                    paddingTop: rp(4),
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
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <BrandHeader
        title="MATCHES"
        right={
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: rs(8) }}
          >
            <TouchableOpacity
              onPress={() => {
                if (topTab === 0) loadMatches();
                else if (topTab === 1) loadRequests();
                else loadViews();
              }}
              style={{ padding: rp(6) }}
            >
              <Text style={{ fontSize: rf(18) }}>🔄</Text>
            </TouchableOpacity>
            {isPremium ? (
              <>
                <View
                  style={{
                    backgroundColor: COLORS.gold + "25",
                    borderRadius: 999,
                    paddingHorizontal: rp(8),
                    paddingVertical: rp(3),
                    borderWidth: 1,
                    borderColor: COLORS.gold + "40",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: rf(11),
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
                    borderRadius: rs(8),
                    paddingHorizontal: rp(8),
                    paddingVertical: rp(4),
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
                      fontSize: rf(11),
                      color: COLORS.textPrimary,
                    }}
                  >
                    {boostActive ? "🚀 On" : "🚀 Boost"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => openPaywall("default")}
                style={{
                  backgroundColor: COLORS.gold + "15",
                  borderRadius: RADIUS.full,
                  paddingHorizontal: rp(10),
                  paddingVertical: rp(4),
                  borderWidth: 1,
                  borderColor: COLORS.gold + "40",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(11),
                    color: COLORS.gold,
                  }}
                >
                  ✨ Upgrade
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

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

      {/* CompatibilityModal — now passes userId so it can fetch live data including for already-matched */}
      <CompatibilityModal
        visible={!!selectedProfile}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />



      {/* Full profile viewer for premium users */}
      <ProfileViewer
        visible={!!viewingUser}
        user={viewingUser}
        onClose={() => setViewingUser(null)}
        onLiked={() => {
          setViewingUser(null);
          loadRequests(true);
          loadViews(true);
        }}
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
    </View>
  );
}
