// services/notifications.js
// Dynamic import prevents expo-notifications from loading in Expo Go.
// The SDK 53 error fires at module load time — a runtime guard is too late.

import Constants from "expo-constants";
import { Platform } from "react-native";

const IS_EXPO_GO = Constants.appOwnership === "expo";

const getNotifications = () => {
   if (IS_EXPO_GO) return null;
   try {
      return require("expo-notifications");
   } catch {
      return null;
   }
};

// Set foreground handler at load time (real builds only)
if (!IS_EXPO_GO) {
   try {
      const N = require("expo-notifications");
      N.setNotificationHandler({
         handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
         }),
      });
   } catch {
      /* skip */
   }
}

export const registerForPushNotifications = async () => {
   if (IS_EXPO_GO) {
      console.log("[PUSH] Expo Go — push skipped (use npx expo run:android)");
      return null;
   }
   const N = getNotifications();
   if (!N) return null;
   try {
      const { status: existing } = await N.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
         const { status } = await N.requestPermissionsAsync();
         finalStatus = status;
      }
      if (finalStatus !== "granted") return null;

      if (Platform.OS === "android") {
         await N.setNotificationChannelAsync("default", {
            name: "VedicMate",
            importance: N.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#F0C060",
            sound: "default",
         });
      }

      const projectId =
         Constants.expoConfig?.extra?.eas?.projectId ??
         Constants.easConfig?.projectId;

      const tokenData = await N.getExpoPushTokenAsync(
         projectId ? { projectId } : undefined,
      );
      const pushToken = tokenData.data;
      console.log("[PUSH] Token:", pushToken);

      try {
         const { authAPI } = require("./api");
         await authAPI.savePushToken(pushToken);
         console.log("[PUSH] Token saved ✅");
      } catch (err) {
         console.warn("[PUSH] Backend save failed:", err.message);
      }
      return pushToken;
   } catch (err) {
      console.error("[PUSH] Registration error:", err.message);
      return null;
   }
};

export const subscribeToForegroundNotifications = (onNotification) => {
   if (IS_EXPO_GO) return () => {};
   const N = getNotifications();
   if (!N) return () => {};
   const sub = N.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      onNotification?.({ title, body, data });
   });
   return () => sub.remove();
};

export const subscribeToNotificationResponse = (onResponse) => {
   if (IS_EXPO_GO) return () => {};
   const N = getNotifications();
   if (!N) return () => {};
   const sub = N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      onResponse?.(data);
   });
   return () => sub.remove();
};

export const getInitialNotification = async () => {
   if (IS_EXPO_GO) return null;
   const N = getNotifications();
   if (!N) return null;
   const response = await N.getLastNotificationResponseAsync();
   return response?.notification?.request?.content?.data ?? null;
};

export const clearBadgeCount = async () => {
   if (IS_EXPO_GO) return;
   const N = getNotifications();
   if (!N) return;
   try {
      await N.setBadgeCountAsync(0);
   } catch {
      /* not supported everywhere */
   }
};
