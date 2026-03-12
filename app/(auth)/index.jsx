// app/(auth)/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN — Email/Password Login & Register
//
// React.js vs React Native — KEY DIFFERENCES IN THIS FILE:
//
// 1. No <div>, <p>, <input> — use <View>, <Text>, <TextInput>
//    View = div (layout container)
//    Text = p / span (all text MUST be inside <Text>)
//    TextInput = input (no type="email" — use keyboardType prop instead)
//
// 2. No CSS files — use StyleSheet.create() at bottom of file
//    Styles look like CSS but use camelCase: fontSize not font-size
//    No cascading — styles don't inherit from parent (except Text color)
//    Flexbox is THE layout system — no grid, no float
//
// 3. No onClick — use onPress (TouchableOpacity, Pressable)
//
// 4. No window.alert — use Alert.alert()
//
// 5. Animations: React Native has Animated API (not CSS transitions)
//    We use Animated.Value and Animated.timing/spring
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
import { useDispatch, useSelector } from "react-redux";
import {
   login,
   register,
   clearError,
   selectAuthLoading,
   selectAuthError,
} from "../../store/slices/authSlice";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

// Generate random star positions once (not on every render)
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

   // ── Local UI state ────────────────────────────────────────────────────────
   const [mode, setMode] = useState("login"); // "login" | "register"
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);

   // ── Animation values ──────────────────────────────────────────────────────
   // Animated.Value is like useState but drives CSS-like animations
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const slideAnim = useRef(new Animated.Value(40)).current;
   const glowAnim = useRef(new Animated.Value(0)).current;
   const formAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      // Entrance animation — runs once on mount
      Animated.parallel([
         Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true, // run on UI thread (60fps), not JS thread
         }),
         Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            delay: 200,
            useNativeDriver: true,
         }),
      ]).start();

      // Continuous glow pulse
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

      // Form fade in
      Animated.timing(formAnim, {
         toValue: 1,
         duration: 600,
         delay: 600,
         useNativeDriver: true,
      }).start();
   }, []);

   // Clear error when switching modes
   useEffect(() => {
      dispatch(clearError());
      setName("");
      setPassword("");
   }, [mode]);

   const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.5],
   });

   // ── Submit handler ────────────────────────────────────────────────────────
   const handleSubmit = async () => {
      console.log(`[AUTH SCREEN] handleSubmit: mode=${mode}, email=${email}`);

      // Client-side validation
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

         // dispatch() returns a Promise with Redux Toolkit thunks
         // We can unwrap() to get the actual value or throw on error
         const result = await dispatch(
            register({ name: name.trim(), email: email.trim(), password }),
         );

         if (register.rejected.match(result)) {
            // Error is already set in authSlice state — shown below input
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
      // On success: NavigationGuard in _layout.jsx detects token change and redirects
   };

   return (
      // KeyboardAvoidingView pushes content up when keyboard opens
      // React.js equivalent: nothing — browser handles this automatically
      // behavior="padding" = add padding at bottom equal to keyboard height
      <KeyboardAvoidingView
         style={{ flex: 1 }}
         behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
         <View style={styles.container}>
            {/* Stars background */}
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

            {/* Glow effect */}
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            {/* ScrollView so form doesn't get cut off on small screens */}
            <ScrollView
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
               keyboardShouldPersistTaps="handled"
               // keyboardShouldPersistTaps — without this, tapping outside keyboard
               // dismisses it AND consumes the tap (buttons don't fire). "handled" fixes this.
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

                  {/* Name field (register only) */}
                  {mode === "register" && (
                     <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <TextInput
                           style={styles.input}
                           placeholder="Your name"
                           placeholderTextColor={COLORS.textDim}
                           value={name}
                           onChangeText={setName}
                           autoCapitalize="words" // capitalize first letter of each word
                           returnKeyType="next" // "next" shows ➡ on keyboard (vs "done")
                        />
                     </View>
                  )}

                  {/* Email */}
                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>EMAIL</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor={COLORS.textDim}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address" // shows @ key on keyboard
                        autoCapitalize="none" // don't auto-capitalize email
                        autoCorrect={false} // don't autocorrect email
                        returnKeyType="next"
                     />
                  </View>

                  {/* Password */}
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
                           secureTextEntry={!showPassword} // toggles password dots
                           returnKeyType="done"
                           onSubmitEditing={handleSubmit} // submit on keyboard "done"
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

                  {/* Error message from Redux state */}
                  {authError ? (
                     <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {authError}</Text>
                     </View>
                  ) : null}

                  {/* Submit button */}
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
                        // ActivityIndicator = loading spinner
                        // React.js: you'd use a CSS spinner or a library like react-spinners
                        <ActivityIndicator color={COLORS.bg} size="small" />
                     ) : (
                        <Text style={styles.submitBtnText}>
                           {mode === "login"
                              ? "Sign In ✨"
                              : "Create Account 🔮"}
                        </Text>
                     )}
                  </TouchableOpacity>

                  {/* Nakshatra teaser pills */}
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

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// React.js: .className { font-size: 16px; background-color: #fff; }
// React Native: StyleSheet.create({ name: { fontSize: 16, backgroundColor: "#fff" } })
//
// Key differences:
// - Numbers for most values (no "px" units — RN uses logical pixels / dp)
// - No shorthand: no "margin: 10 20" — use marginVertical/marginHorizontal
// - No :hover, :focus — no CSS pseudo-selectors
// - Flexbox by default (direction is column, not row)
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
   container: {
      flex: 1, // flex: 1 in RN = fill parent — like height: 100% + flex: 1 in CSS
      backgroundColor: COLORS.bg,
   },
   scrollContent: {
      flexGrow: 1, // like min-height: 100% in CSS
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xxl,
   },
   star: {
      position: "absolute", // same as CSS position: absolute
      borderRadius: 99,
      backgroundColor: "#FFFFFF",
   },
   glow: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: COLORS.gold,
      top: height * 0.2,
      alignSelf: "center", // centering in RN — no margin: auto
   },
   header: {
      width: "100%",
      alignItems: "center",
      marginBottom: SPACING.xl,
   },
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
   divider: {
      flexDirection: "row", // row = horizontal (unlike CSS default which is already row)
      alignItems: "center",
      width: "60%",
   },
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
   modeBtnActive: {
      backgroundColor: COLORS.gold,
   },
   modeBtnText: {
      fontFamily: FONTS.bodyMedium,
      fontSize: 14,
      color: COLORS.textSecondary,
   },
   modeBtnTextActive: {
      color: COLORS.bg,
   },
   inputGroup: {
      marginBottom: SPACING.md,
   },
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
      // No outline! RN doesn't have focus outlines (use borderColor change with onFocus/onBlur)
   },
   passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
   },
   eyeBtn: {
      padding: SPACING.sm,
   },
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
      // elevation = drop shadow on Android (no box-shadow in RN Android)
      // shadowColor/Offset/Opacity/Radius = iOS shadow
      elevation: 8,
      shadowColor: COLORS.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
   },
   submitBtnDisabled: {
      opacity: 0.6,
   },
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
