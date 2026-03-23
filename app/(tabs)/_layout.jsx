// Tab bar layout. Only Discover, Matches, and Profile are visible tabs.
// All other screens in this folder (swipe-history, chat, paywall) are
// hidden from the tab bar using href: null.

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

function TabIcon({ emoji, focused }) {
   return (
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
         {emoji}
      </Text>
   );
}

export default function TabLayout() {
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
               tabBarIcon: ({ focused }) => (
                  <TabIcon emoji="🔮" focused={focused} />
               ),
            }}
         />
         <Tabs.Screen
            name="matches"
            options={{
               title: "Matches",
               tabBarIcon: ({ focused }) => (
                  <TabIcon emoji="✨" focused={focused} />
               ),
            }}
         />
         <Tabs.Screen
            name="profile"
            options={{
               title: "Profile",
               tabBarIcon: ({ focused }) => (
                  <TabIcon emoji="👤" focused={focused} />
               ),
            }}
         />

         {/* Hidden screens — not visible as tabs */}
         <Tabs.Screen name="chat/[matchId]" options={{ href: null }} />
         <Tabs.Screen name="swipe-history" options={{ href: null }} />
         <Tabs.Screen name="paywall" options={{ href: null }} />
      </Tabs>
   );
}
