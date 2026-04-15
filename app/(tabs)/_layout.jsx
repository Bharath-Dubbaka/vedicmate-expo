// Tab bar layout. Only Discover, Matches, and Profile are visible tabs.
// All other screens in this folder (swipe-history, chat, paywall) are
// hidden from the tab bar using href: null.
// Tab bar now uses theme colors. Added Notifications tab.

import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";
import { selectTotalUnread } from "../../store/slices/matchesSlice";

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

// Small dot badge for unread notifications
function NotifIcon({ focused, unread }) {
  return (
    <View style={{ position: "relative" }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
        🔔
      </Text>
      {unread > 0 && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: "#E8607A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 8, color: "#fff", fontWeight: "bold" }}>
            {unread > 9 ? "9+" : unread}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { COLORS, FONTS } = useTheme();
  const totalUnread = useSelector(selectTotalUnread);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: {
          fontFamily: FONTS.body,
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔮" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused }) => (
            <NotifIcon focused={focused} unread={totalUnread} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="chat/[matchId]" options={{ href: null }} />
      <Tabs.Screen name="swipe-history" options={{ href: null }} />
      <Tabs.Screen name="paywall" options={{ href: null }} />
    </Tabs>
  );
}
