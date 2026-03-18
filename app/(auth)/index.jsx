// app/(auth)/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE AUTH ADDITION:
//   - Google Sign-In button using expo-auth-session
//   - Calls POST /api/auth/google with the idToken
//   - On success: saves token + user to AsyncStorage, dispatches to Redux
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   TextInput,
   Animated,
   Dimensions,
   KeyboardAvoidingView,
   Platform,
   ScrollView,
   ActivityIndicator,
   Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { authAPI } from "../../services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";
import {
   login,
   register,
   clearError,
   setAuth,
   selectAuthLoading,
   selectAuthError,
} from "../../store/slices/authSlice";
import {
   GoogleSignin,
   statusCodes,
   isSuccessResponse,
} from "@react-native-google-signin/google-signin";

const { width, height } = Dimensions.get("window");

const STARS = Array.from({ length: 50 }, (_, i) => ({
   id: i,
   top: Math.random() * height,
   left: Math.random() * width,
   size: Math.random() * 2.5 + 0.5,
   opacity: Math.random() * 0.6 + 0.2,
}));

export default function AuthScreen() {
   const dispatch = useDispatch();
   const authLoading = useSelector(selectAuthLoading);
   const authError = useSelector(selectAuthError);

   const [mode, setMode] = useState("login");
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [googleLoading, setGoogleLoading] = useState(false);

   useEffect(() => {
      GoogleSignin.configure({
         webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      });
   }, []);

   const handleGoogleSignIn = async () => {
      setGoogleLoading(true);
      try {
         // Sign out first to force account picker every time
         await GoogleSignin.signOut();

         await GoogleSignin.hasPlayServices();
         const response = await GoogleSignin.signIn();
         if (isSuccessResponse(response)) {
            const googleUser = response.data.user;
            const res = await authAPI.googleAuth({
               googleId: googleUser.id,
               email: googleUser.email,
               name: googleUser.name,
               avatar: googleUser.photo,
            });
            const { token, user } = res.data;
            await AsyncStorage.setItem("token", token);
            await AsyncStorage.setItem("user", JSON.stringify(user));
            dispatch(setAuth({ token, user }));
         }
      } catch (error) {
         if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log("[GOOGLE AUTH] Cancelled");
         } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            Alert.alert("Error", "Google Play Services not available.");
         } else {
            Alert.alert("Sign-In Failed", error.message || "Please try again.");
         }
      } finally {
         setGoogleLoading(false);
      }
   };

   // ── Animations ────────────────────────────────────────────────────────────
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const slideAnim = useRef(new Animated.Value(40)).current;
   const glowAnim = useRef(new Animated.Value(0)).current;
   const formAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      Animated.parallel([
         Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
         }),
         Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            delay: 200,
            useNativeDriver: true,
         }),
      ]).start();

      Animated.loop(
         Animated.sequence([
            Animated.timing(glowAnim, {
               toValue: 1,
               duration: 2500,
               useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
               toValue: 0,
               duration: 2500,
               useNativeDriver: true,
            }),
         ]),
      ).start();

      Animated.timing(formAnim, {
         toValue: 1,
         duration: 600,
         delay: 600,
         useNativeDriver: true,
      }).start();
   }, []);

   useEffect(() => {
      dispatch(clearError());
      setName("");
      setPassword("");
   }, [mode]);

   const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.5],
   });

   const handleSubmit = async () => {
      console.log(`[AUTH SCREEN] handleSubmit: mode=${mode}, email=${email}`);

      if (!email.trim() || !password.trim()) {
         Alert.alert("Missing Fields", "Please enter your email and password.");
         return;
      }

      if (mode === "register") {
         if (!name.trim()) {
            Alert.alert("Missing Fields", "Please enter your name.");
            return;
         }
         if (password.length < 6) {
            Alert.alert(
               "Weak Password",
               "Password must be at least 6 characters.",
            );
            return;
         }
         const result = await dispatch(
            register({ name: name.trim(), email: email.trim(), password }),
         );
         if (register.rejected.match(result)) {
            console.log("[AUTH SCREEN] Register failed:", result.payload);
         }
      } else {
         const result = await dispatch(
            login({ email: email.trim(), password }),
         );
         if (login.rejected.match(result)) {
            console.log("[AUTH SCREEN] Login failed:", result.payload);
         }
      }
   };

   return (
      <KeyboardAvoidingView
         style={{ flex: 1 }}
         behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
         <View style={styles.container}>
            {STARS.map((star) => (
               <View
                  key={star.id}
                  style={[
                     styles.star,
                     {
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        opacity: star.opacity,
                     },
                  ]}
               />
            ))}

            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            <ScrollView
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
               keyboardShouldPersistTaps="handled"
            >
               {/* Logo + Title */}
               <Animated.View
                  style={[
                     styles.header,
                     {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                     },
                  ]}
               >
                  <View style={styles.logoRing}>
                     <Text style={styles.logoEmoji}>🔮</Text>
                  </View>
                  <Text style={styles.appName}>COSMIC MATCH</Text>
                  <Text style={styles.tagline}>
                     Vedic compatibility, redefined
                  </Text>
                  <View style={styles.divider}>
                     <View style={styles.dividerLine} />
                     <Text style={styles.dividerText}>✦</Text>
                     <View style={styles.dividerLine} />
                  </View>
               </Animated.View>

               {/* Auth Form */}
               <Animated.View style={[styles.form, { opacity: formAnim }]}>
                  {/* ── Google Sign-In Button ── */}
                  <TouchableOpacity
                     style={styles.googleBtn}
                     onPress={handleGoogleSignIn}
                     disabled={googleLoading}
                     activeOpacity={0.85}
                  >
                     {googleLoading ? (
                        <ActivityIndicator
                           size="small"
                           color={COLORS.textPrimary}
                        />
                     ) : (
                        <>
                           <Text style={styles.googleIcon}>G</Text>
                           <Text style={styles.googleBtnText}>
                              Continue with Google
                           </Text>
                        </>
                     )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.orDivider}>
                     <View style={styles.orLine} />
                     <Text style={styles.orText}>or</Text>
                     <View style={styles.orLine} />
                  </View>

                  {/* Mode Toggle */}
                  <View style={styles.modeToggle}>
                     <TouchableOpacity
                        style={[
                           styles.modeBtn,
                           mode === "login" && styles.modeBtnActive,
                        ]}
                        onPress={() => setMode("login")}
                     >
                        <Text
                           style={[
                              styles.modeBtnText,
                              mode === "login" && styles.modeBtnTextActive,
                           ]}
                        >
                           Sign In
                        </Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        style={[
                           styles.modeBtn,
                           mode === "register" && styles.modeBtnActive,
                        ]}
                        onPress={() => setMode("register")}
                     >
                        <Text
                           style={[
                              styles.modeBtnText,
                              mode === "register" && styles.modeBtnTextActive,
                           ]}
                        >
                           Create Account
                        </Text>
                     </TouchableOpacity>
                  </View>

                  {mode === "register" && (
                     <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <TextInput
                           style={styles.input}
                           placeholder="Your name"
                           placeholderTextColor={COLORS.textDim}
                           value={name}
                           onChangeText={setName}
                           autoCapitalize="words"
                           returnKeyType="next"
                        />
                     </View>
                  )}

                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>EMAIL</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor={COLORS.textDim}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                     />
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>PASSWORD</Text>
                     <View style={styles.passwordRow}>
                        <TextInput
                           style={[styles.input, { flex: 1, marginBottom: 0 }]}
                           placeholder={
                              mode === "register"
                                 ? "Min 6 characters"
                                 : "Your password"
                           }
                           placeholderTextColor={COLORS.textDim}
                           value={password}
                           onChangeText={setPassword}
                           secureTextEntry={!showPassword}
                           returnKeyType="done"
                           onSubmitEditing={handleSubmit}
                        />
                        <TouchableOpacity
                           style={styles.eyeBtn}
                           onPress={() => setShowPassword((v) => !v)}
                        >
                           <Text style={styles.eyeIcon}>
                              {showPassword ? "🙈" : "👁"}
                           </Text>
                        </TouchableOpacity>
                     </View>
                  </View>

                  {authError ? (
                     <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {authError}</Text>
                     </View>
                  ) : null}

                  <TouchableOpacity
                     style={[
                        styles.submitBtn,
                        authLoading && styles.submitBtnDisabled,
                     ]}
                     onPress={handleSubmit}
                     disabled={authLoading}
                     activeOpacity={0.85}
                  >
                     {authLoading ? (
                        <ActivityIndicator color={COLORS.bg} size="small" />
                     ) : (
                        <Text style={styles.submitBtnText}>
                           {mode === "login"
                              ? "Sign In ✨"
                              : "Create Account 🔮"}
                        </Text>
                     )}
                  </TouchableOpacity>

                  <View style={styles.pills}>
                     {[
                        "🐾 Yoni Match",
                        "✨ Guna Milan",
                        "🔯 36-Point Score",
                     ].map((pill) => (
                        <View key={pill} style={styles.pill}>
                           <Text style={styles.pillText}>{pill}</Text>
                        </View>
                     ))}
                  </View>
               </Animated.View>
            </ScrollView>

            <Text style={styles.bottomText}>नक्षत्र • राशि • गण</Text>
         </View>
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   scrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xxl,
   },
   star: { position: "absolute", borderRadius: 99, backgroundColor: "#FFFFFF" },
   glow: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: COLORS.gold,
      top: height * 0.2,
      alignSelf: "center",
   },
   header: { width: "100%", alignItems: "center", marginBottom: SPACING.xl },
   logoRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1.5,
      borderColor: COLORS.gold,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.lg,
      backgroundColor: COLORS.bgElevated,
   },
   logoEmoji: { fontSize: 44 },
   appName: {
      fontFamily: FONTS.headingBold,
      fontSize: 26,
      color: COLORS.gold,
      letterSpacing: 6,
      marginBottom: SPACING.sm,
   },
   tagline: {
      fontFamily: FONTS.body,
      fontSize: 14,
      color: COLORS.textSecondary,
      letterSpacing: 1,
      marginBottom: SPACING.lg,
   },
   divider: { flexDirection: "row", alignItems: "center", width: "60%" },
   dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
   dividerText: {
      color: COLORS.goldDim,
      marginHorizontal: SPACING.sm,
      fontSize: 12,
   },
   form: {
      width: "100%",
      backgroundColor: COLORS.bgCard,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.lg,
      marginTop: SPACING.lg,
   },

   // Google button
   googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingVertical: SPACING.md,
      marginBottom: SPACING.md,
   },
   googleIcon: {
      fontFamily: FONTS.bodyBold,
      fontSize: 18,
      color: "#4285F4",
      width: 24,
      textAlign: "center",
   },
   googleBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 15,
      color: COLORS.textPrimary,
   },

   // OR divider
   orDivider: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      gap: SPACING.sm,
   },
   orLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
   orText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim },

   modeToggle: {
      flexDirection: "row",
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.lg,
      padding: 4,
      marginBottom: SPACING.lg,
   },
   modeBtn: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      borderRadius: RADIUS.md,
   },
   modeBtnActive: { backgroundColor: COLORS.gold },
   modeBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   modeBtnTextActive: { color: COLORS.bg },
   inputGroup: { marginBottom: SPACING.md },
   inputLabel: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.gold,
      letterSpacing: 2,
      marginBottom: SPACING.xs,
   },
   input: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontFamily: FONTS.body,
      fontSize: 16,
      color: COLORS.textPrimary,
   },
   passwordRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
   eyeBtn: { padding: SPACING.sm },
   eyeIcon: { fontSize: 20 },
   errorBox: {
      backgroundColor: "rgba(232, 96, 122, 0.1)",
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.rose,
      padding: SPACING.sm,
      marginBottom: SPACING.md,
   },
   errorText: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: COLORS.rose,
      textAlign: "center",
   },
   submitBtn: {
      backgroundColor: COLORS.gold,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md + 2,
      alignItems: "center",
      marginBottom: SPACING.lg,
      elevation: 8,
      shadowColor: COLORS.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
   },
   submitBtnDisabled: { opacity: 0.6 },
   submitBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: COLORS.bg,
      letterSpacing: 0.5,
   },
   pills: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: SPACING.xs,
   },
   pill: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      backgroundColor: COLORS.bgElevated,
   },
   pillText: {
      fontFamily: FONTS.body,
      fontSize: 11,
      color: COLORS.textSecondary,
   },
   bottomText: {
      position: "absolute",
      bottom: SPACING.xl,
      alignSelf: "center",
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textDim,
      letterSpacing: 3,
   },
});
