// components/BrandHeader.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Consistent branded header used across all 4 tabs.
// Uses Cinzel font + 🔮 as the brand mark since no logo image file exists yet.
// Replace the emoji with an <Image> when a logo PNG is available.
//
// Usage:
//   <BrandHeader title="DISCOVER" right={<SomeButton />} />
// ───────────────────────────────────────────────────────  ──────────────────────

import { View, Text, Image } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { rf, rs, rp } from "../constants/responsive";

export default function BrandHeader({
  title,
  subtitle,
  right,
  showLogo = true,
  style,
}) {
  const { COLORS, FONTS } = useTheme();

  return (
    <View
      style={[
        {
          paddingHorizontal: rp(20),
          paddingTop: rs(54),
          paddingBottom: rp(12),
          backgroundColor: COLORS.bg,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: logo + title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: rs(10),
            flex: 1,
          }}
        >
          {showLogo && (
            <View
              style={{
                width: rs(36),
                height: rs(36),
                borderRadius: rs(10),
                overflow: "hidden",
                borderWidth: 1,
                borderColor: COLORS.gold + "40",
              }}
            >
              <Image
                source={require("../assets/icon.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
          )}
          <View>
            <Text
              style={{
                fontFamily: FONTS.headingBold,
                fontSize: rf(18),
                color: COLORS.gold,
                letterSpacing: 3,
                lineHeight: rf(22),
              }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(11),
                  color: COLORS.textSecondary,
                  letterSpacing: 0.5,
                  marginTop: 1,
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right slot */}
        {right && (
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: rs(8) }}
          >
            {right}
          </View>
        )}
      </View>
    </View>
  );
}
