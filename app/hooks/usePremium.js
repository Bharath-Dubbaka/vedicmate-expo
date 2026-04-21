// app/hooks/usePremium.js
// Thin wrapper over premiumSlice in Redux.
// All state is global — every component reading isPremium sees the same value.

import { useCallback } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Purchases from "react-native-purchases";
// let Purchases = null;
// try {
//   Purchases = require("react-native-purchases").default;
// } catch (e) {
//   console.log("[RC] react-native-purchases not available in Expo Go");
// }

import {
  fetchPremiumStatus,
  decrementSwipe,
  selectIsPremium,
  selectPremiumPlan,
  selectPremiumExpiresAt,
  selectSwipesRemaining,
  selectSwipesAllowed,
  selectSwipeLimit,
  selectBoostActive,
  selectPremiumLoading,
} from "../../store/slices/premiumSlice";
import api from "../../services/api";

export const PRICING = {
  monthly: {
    productId: "vedicmate_premium_monthly",
    price: "₹70",
    period: "month",
    label: "Monthly",
    savingsLabel: null,
    monthlyEquivalent: null,
  },
  annual: {
    productId: "vedicmate_premium_annual",
    price: "600",
    period: "year",
    label: "Annual",
    savingsLabel: "Save 29%",
    monthlyEquivalent: "₹50/mo",
  },
};

export const usePremium = () => {
  const dispatch = useDispatch();

  const isPremium = useSelector(selectIsPremium);
  const plan = useSelector(selectPremiumPlan);
  const expiresAt = useSelector(selectPremiumExpiresAt);
  const swipesRemaining = useSelector(selectSwipesRemaining);
  const swipesAllowed = useSelector(selectSwipesAllowed);
  const swipeLimit = useSelector(selectSwipeLimit);
  const boostActive = useSelector(selectBoostActive);
  const isLoading = useSelector(selectPremiumLoading);

  // Re-fetch premium status from backend — called on tab focus, after paywall closes
  const refresh = useCallback(() => {
    dispatch(fetchPremiumStatus());
  }, [dispatch]);

  // Purchase
  const purchase = useCallback(
    async (planKey = "annual") => {
      try {
        const offerings = await Purchases.getOfferings();
        const offering = offerings.current;
        if (!offering) {
          Alert.alert("Error", "No offerings available. Please try again.");
          return { success: false };
        }
        const packageToPurchase =
          planKey === "monthly" ? offering.monthly : offering.annual;
        if (!packageToPurchase) {
          Alert.alert("Error", "Package not found.");
          return { success: false };
        }
        const { customerInfo } = await Purchases.purchasePackage(
          packageToPurchase
        );
        if (customerInfo.entitlements.active["premium"]) {
          const api = (await import("../../services/api")).default;
          await api.post("/premium/verify", {
            receipt: customerInfo.originalAppUserId,
            platform: "android",
          });
          dispatch(fetchPremiumStatus());
          Alert.alert("✨ Premium Activated!", "Welcome to VedicFind Premium!");
          return { success: true };
        }
        return { success: false };
      } catch (err) {
        if (!err.userCancelled) {
          Alert.alert("Error", err.message || "Purchase failed");
        }
        return { success: false };
      }
    },
    [dispatch]
  );

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active["premium"]) {
        dispatch(fetchPremiumStatus());
        Alert.alert("✅ Purchases Restored!", "Your premium is active.");
        return { success: true };
      }
      Alert.alert("No Purchases Found", "No active subscriptions to restore.");
      return { success: false };
    } catch (err) {
      Alert.alert("Error", err.message);
      return { success: false };
    }
  }, [dispatch]);

  // Activate profile boost (premium users only)
  const activateBoost = useCallback(async () => {
    try {
      const res = await api.post("/premium/boost");
      if (res.data?.success) {
        dispatch(fetchPremiumStatus());
        Alert.alert("🚀 Boost Active!", res.data.message);
        return { success: true };
      }
      if (res.data?.requiresPremium)
        return { success: false, requiresPremium: true };
      Alert.alert("", res.data?.message || "Something went wrong");
      return { success: false };
    } catch (err) {
      if (err.response?.data?.requiresPremium)
        return { success: false, requiresPremium: true };
      Alert.alert("Error", err.response?.data?.message || err.message);
      return { success: false };
    }
  }, [dispatch]);

  // Optimistic local swipe decrement — keeps the UI snappy without waiting for API
  const handleDecrementSwipe = useCallback(() => {
    dispatch(decrementSwipe());
  }, [dispatch]);

  return {
    isLoading,
    isPremium,
    plan,
    expiresAt,
    swipesRemaining: isPremium ? null : swipesRemaining,
    swipeLimit: isPremium ? null : swipeLimit,
    swipesAllowed: isPremium ? true : swipesAllowed,
    decrementSwipe: handleDecrementSwipe,
    boostActive,
    purchase,
    restore,
    activateBoost,
    refresh,
  };
};

export default usePremium;
