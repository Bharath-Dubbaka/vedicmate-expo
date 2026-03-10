//

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

function TabIcon({ emoji, label, focused }) {
   return (
      <Text
         style={{
            fontSize: focused ? 22 : 20,
            opacity: focused ? 1 : 0.5,
         }}
      >
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
                  <TabIcon emoji="🔮" label="Discover" focused={focused} />
               ),
            }}
         />
         <Tabs.Screen
            name="matches"
            options={{
               title: "Matches",
               tabBarIcon: ({ focused }) => (
                  <TabIcon emoji="✨" label="Matches" focused={focused} />
               ),
            }}
         />
         <Tabs.Screen
            name="profile"
            options={{
               title: "Profile",
               tabBarIcon: ({ focused }) => (
                  <TabIcon emoji="👤" label="Profile" focused={focused} />
               ),
            }}
         />
         <Tabs.Screen
            name="chat/[matchId]"
            options={{
               href: null,
            }}
         />
      </Tabs>
   );
}
