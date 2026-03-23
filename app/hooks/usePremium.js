// app/hooks/usePremium.js
// Thin wrapper over premiumSlice in Redux.
// All state is global — every component reading isPremium sees the same value.

import { useCallback } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
   fetchPremiumStatus,
   purchasePremium,
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
      price: "₹499",
      period: "month",
      label: "Monthly",
      savingsLabel: null,
      monthlyEquivalent: null,
   },
   annual: {
      productId: "vedicmate_premium_annual",
      price: "₹3,999",
      period: "year",
      label: "Annual",
      savingsLabel: "Save 33%",
      monthlyEquivalent: "₹333/mo",
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

   // Purchase — dev mode simulation in Expo Go, real RC purchase needs a dev build
   const purchase = useCallback(
      async (planKey = "annual") => {
         const result = await dispatch(purchasePremium({ planKey }));
         if (purchasePremium.fulfilled.match(result)) {
            Alert.alert(
               "✨ Premium Activated (Dev Mode)",
               "Simulated purchase — no real payment. A dev build is needed for real Google Play billing.",
            );
            return { success: true };
         }
         Alert.alert("Error", result.payload || "Purchase failed");
         return { success: false };
      },
      [dispatch],
   );

   // Restore purchases — requires a real dev build with RC SDK
   const restore = useCallback(async () => {
      Alert.alert("Not Available", "Restore requires a development build.");
      return { success: false };
   }, []);

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
