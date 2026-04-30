// app/(auth)/index.jsx
//
// Auth screen — email/password login + Google Sign-In.
// Google Sign-In requires a native dev build and is safely disabled in Expo Go.

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
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { authAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import {
  login,
  register,
  clearError,
  setAuth,
  selectAuthLoading,
  selectAuthError,
} from "../../store/slices/authSlice";
import * as Sentry from "@sentry/react-native";

// Safely try to import Google Sign-In — only works in a native dev build.
// In Expo Go this import crashes the app, so we guard it.
let GoogleSignin = null;
let statusCodes = null;
let isSuccessResponse = null;
let googleSignInAvailable = false;
try {
  const g = require("@react-native-google-signin/google-signin");
  GoogleSignin = g.GoogleSignin;
  statusCodes = g.statusCodes;
  isSuccessResponse = g.isSuccessResponse;
  googleSignInAvailable = true;
} catch {}

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
  const { COLORS, FONTS, SPACING, RADIUS, isDark } = useTheme();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (googleSignInAvailable && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (!googleSignInAvailable || !GoogleSignin) {
      Alert.alert(
        "Not Available in Expo Go",
        "Google Sign-In requires a development build.",
      );
      return;
    }
    setGoogleLoading(true);
    try {
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
      Sentry.captureException(error, {
        tags: { flow: "google_signin" },
        extra: { errorCode: error.code, errorMessage: error.message },
      });
      if (error.code !== statusCodes?.SIGN_IN_CANCELLED) {
        Alert.alert("Sign-In Failed", error.message || "Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

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
    outputRange: [0.15, isDark ? 0.4 : 0.25],
  });

  const handleSubmit = async () => {
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
        Alert.alert("Weak Password", "Password must be at least 6 characters.");
        return;
      }
      await dispatch(
        register({ name: name.trim(), email: email.trim(), password }),
      );
    } else {
      await dispatch(login({ email: email.trim(), password }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Stars — only in dark mode */}
        {isDark &&
          STARS.map((star) => (
            <View
              key={star.id}
              style={{
                position: "absolute",
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                borderRadius: 99,
                backgroundColor: "#FFFFFF",
                opacity: star.opacity,
              }}
            />
          ))}

        {/* Glow orb */}
        <Animated.View
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: COLORS.gold,
            top: height * 0.15,
            alignSelf: "center",
            opacity: glowOpacity,
          }}
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: SPACING.xl,
            paddingVertical: SPACING.xxl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View
            style={{
              width: "100%",
              alignItems: "center",
              marginBottom: SPACING.xl,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 1.5,
                borderColor: COLORS.gold,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: SPACING.lg,
                backgroundColor: COLORS.bgElevated,
              }}
            >
              <Image
                source={require("../../assets/icon.png")} // adjust path to your logo file
                style={{ width: 120, height: 120, borderRadius: 40 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: 26,
                color: COLORS.gold,
                letterSpacing: 6,
                marginBottom: SPACING.sm,
              }}
            >
              VEDICFIND
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.textSecondary,
                letterSpacing: 1,
                marginBottom: SPACING.lg,
              }}
            >
              Vedic compatibility, redefined
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "60%",
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: COLORS.border }}
              />
              <Text
                style={{
                  color: COLORS.goldDim,
                  marginHorizontal: SPACING.sm,
                  fontSize: 12,
                }}
              >
                ✦
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: COLORS.border }}
              />
            </View>
          </Animated.View>

          {/* Form card for manual login , wasy testing using expo n preview*/}
          {/* <Animated.View
            style={{
              width: "100%",
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.lg,
              marginTop: SPACING.sm,
              opacity: formAnim,
            }}
          >
            <TouchableOpacity
              style={{
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
                opacity: googleSignInAvailable ? 1 : 0.4,
              }}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || !googleSignInAvailable}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: 18,
                      color: "#4285F4",
                      width: 24,
                      textAlign: "center",
                    }}
                  >
                    G
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 15,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {googleSignInAvailable
                      ? "Continue with Google"
                      : "Google Sign-In (dev build only)"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: SPACING.md,
                gap: SPACING.sm,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: COLORS.border }}
              />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textDim,
                }}
              >
                or
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: COLORS.border }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.lg,
                padding: 4,
                marginBottom: SPACING.lg,
              }}
            >
              {["login", "register"].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={{
                    flex: 1,
                    paddingVertical: SPACING.sm,
                    alignItems: "center",
                    borderRadius: RADIUS.md,
                    backgroundColor: mode === m ? COLORS.gold : "transparent",
                  }}
                  onPress={() => setMode(m)}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 14,
                      color: mode === m ? COLORS.bg : COLORS.textSecondary,
                    }}
                  >
                    {m === "login" ? "Sign In" : "Create Account"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === "register" && (
              <View style={{ marginBottom: SPACING.md }}>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.gold,
                    letterSpacing: 2,
                    marginBottom: SPACING.xs,
                  }}
                >
                  FULL NAME
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.inputBg,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: COLORS.inputBorder,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.md,
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    color: COLORS.textPrimary,
                  }}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textDim}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={{ marginBottom: SPACING.md }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.gold,
                  letterSpacing: 2,
                  marginBottom: SPACING.xs,
                }}
              >
                EMAIL
              </Text>
              <TextInput
                style={{
                  backgroundColor: COLORS.inputBg,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                  fontFamily: FONTS.body,
                  fontSize: 16,
                  color: COLORS.textPrimary,
                }}
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

            <View style={{ marginBottom: SPACING.md }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.gold,
                  letterSpacing: 2,
                  marginBottom: SPACING.xs,
                }}
              >
                PASSWORD
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.sm,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.inputBg,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: COLORS.inputBorder,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.md,
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    color: COLORS.textPrimary,
                  }}
                  placeholder={
                    mode === "register" ? "Min 6 characters" : "Your password"
                  }
                  placeholderTextColor={COLORS.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={{ padding: SPACING.sm }}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Text style={{ fontSize: 20 }}>
                    {showPassword ? "🙈" : "👁"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {authError && (
              <View
                style={{
                  backgroundColor: COLORS.rose + "18",
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: COLORS.rose,
                  padding: SPACING.sm,
                  marginBottom: SPACING.md,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.rose,
                    textAlign: "center",
                  }}
                >
                  ⚠️ {authError}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={{
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
                opacity: authLoading ? 0.6 : 1,
              }}
              onPress={handleSubmit}
              disabled={authLoading}
              activeOpacity={0.85}
            >
              {authLoading ? (
                <ActivityIndicator color={COLORS.bg} size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: 16,
                    color: COLORS.bg,
                    letterSpacing: 0.5,
                  }}
                >
                  {mode === "login" ? "Sign In ✨" : "Create Account 🔮"}
                </Text>
              )}
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: SPACING.xs,
              }}
            >
              {["🐾 Yoni Match", "✨ Guna Milan", "🔯 36-Point Score"].map(
                (pill) => (
                  <View
                    key={pill}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: RADIUS.full,
                      paddingHorizontal: SPACING.sm,
                      paddingVertical: 4,
                      backgroundColor: COLORS.bgElevated,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {pill}
                    </Text>
                  </View>
                )
              )}
            </View>
          </Animated.View> */}

          {/* Form card for production only google oauth*/}
          <Animated.View
            style={{
              width: "100%",
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.lg,
              marginTop: SPACING.lg,
              opacity: formAnim,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACING.sm,
                backgroundColor: COLORS.bgElevated,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingVertical: SPACING.md + 4,
                marginBottom: SPACING.md,
                opacity: googleSignInAvailable ? 1 : 0.5,
              }}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || !googleSignInAvailable}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: 20,
                      color: "#4285F4",
                      width: 26,
                      textAlign: "center",
                    }}
                  >
                    G
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 16,
                      color: COLORS.textPrimary,
                    }}
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {!googleSignInAvailable && (
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textDim,
                  textAlign: "center",
                  marginBottom: SPACING.md,
                }}
              >
                Google Sign-In requires a native build
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: SPACING.xs,
                marginTop: SPACING.sm,
              }}
            >
              {["🐾 Yoni Match", "✨ Guna Milan", "🔯 36-Point Score"].map(
                (pill) => (
                  <View
                    key={pill}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: RADIUS.full,
                      paddingHorizontal: SPACING.sm,
                      paddingVertical: 4,
                      backgroundColor: COLORS.bgElevated,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {pill}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </Animated.View>
        </ScrollView>

        <Text
          style={{
            position: "absolute",
            bottom: SPACING.xl,
            alignSelf: "center",
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.textDim,
            letterSpacing: 3,
          }}
        >
          नक्षत्र • राशि • गण
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
