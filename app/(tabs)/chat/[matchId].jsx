// app/(tabs)/chat/[matchId].jsx
// ─────────────────────────────────────────────────────────────────────────────
// CHAT SCREEN — Real-time messaging via Socket.io
//
// React.js vs React Native:
//   - FlatList (RN) vs <ul>/<div scroll> (React.js)
//     FlatList is VIRTUALIZED — only renders visible items (huge performance win)
//     React.js: you'd use react-virtual or similar for large lists
//   - Keyboard handling: KeyboardAvoidingView pushes content up
//   - No CSS :focus — use onFocus/onBlur props on TextInput
// ─────────────────────────────────────────────────────────────────────────────
// Profile modal: Tab 1 = compatibility card (m1 vs f1)
//                Tab 2 = userf1's own Koota chart (her personal attributes)
// Profile modal: clickable photo full view
// Their Chart tab: full cosmic identity (animal, nadi, varna, vashya, lord) from cosmicCard
// All fields now populated — no more "not available"

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessages,
  addMessage,
  selectMessages,
  selectChatLoading,
} from "../../../store/slices/chatSlice";
import { clearUnread } from "../../../store/slices/matchesSlice";
import { selectUser } from "../../../store/slices/authSlice";
import {
  connectSocket,
  sendSocketMessage,
  emitTypingStart,
  emitTypingStop,
} from "../../../services/socket";
import { useTheme } from "../../../context/ThemeContext";
import BlockReportModal from "../../../components/BlockReportModal";
import { matchingAPI } from "../../../services/api";
import { rf, rs, rp } from "../../../constants/responsive";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const KOOTA_LIST = [
  {
    key: "nadi",
    name: "Nadi",
    emoji: "🌊",
    max: 8,
    desc: "Health & body constitution",
  },
  {
    key: "bhakoot",
    name: "Bhakoot",
    emoji: "🌕",
    max: 7,
    desc: "Emotional compatibility",
  },
  { key: "gana", name: "Gana", emoji: "✨", max: 6, desc: "Temperament match" },
  {
    key: "grahaMaitri",
    name: "Graha Maitri",
    emoji: "🪐",
    max: 5,
    desc: "Mental compatibility",
  },
  {
    key: "yoni",
    name: "Yoni",
    emoji: "🐾",
    max: 4,
    desc: "Physical compatibility",
  },
  {
    key: "tara",
    name: "Tara",
    emoji: "⭐",
    max: 3,
    desc: "Birth star harmony",
  },
  {
    key: "vashya",
    name: "Vashya",
    emoji: "💫",
    max: 2,
    desc: "Mutual attraction",
  },
  {
    key: "varna",
    name: "Varna",
    emoji: "📿",
    max: 1,
    desc: "Spiritual alignment",
  },
];

// ── Full screen photo viewer ──────────────────────────────────────────────────
function PhotoViewer({ visible, photoUri, onClose }) {
  const { COLORS } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: rs(56),
            right: rp(20),
            zIndex: 10,
            padding: rp(12),
          }}
          onPress={onClose}
        >
          <Text style={{ fontSize: rf(24), color: "#fff" }}>✕</Text>
        </TouchableOpacity>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: SCREEN_W, height: SCREEN_H * 0.8 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: rf(64), opacity: 0.3 }}>👤</Text>
        )}
      </View>
    </Modal>
  );
}

// ── Profile + Compat modal ────────────────────────────────────────────────────
function ProfileModal({ visible, matchInfo, onClose }) {
  const { COLORS, FONTS, RADIUS, VERDICT_CONFIG, GANA_CONFIG } = useTheme();
  const [activeTab, setActiveTab] = useState("compat");
  const [compatData, setCompatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    if (visible && matchInfo?.userId && !compatData) {
      setLoading(true);
      matchingAPI
        .getCompatibility(matchInfo.userId)
        .then((res) => {
          if (res.data?.compatibility) setCompatData(res.data.compatibility);
        })
        .catch((err) => console.warn("[CHAT] Compat fetch:", err.message))
        .finally(() => setLoading(false));
    }
  }, [visible, matchInfo?.userId]);

  const handleClose = () => {
    setActiveTab("compat");
    onClose?.();
  };

  const vc = compatData
    ? VERDICT_CONFIG[compatData.verdict] || VERDICT_CONFIG["Average Match"]
    : null;
  const pct = compatData ? Math.round((compatData.totalScore / 36) * 100) : 0;

  // Build their cosmic attributes from cosmicCard stored in matchInfo
  const cosmicCard = matchInfo?.cosmicCard || {};
  const gc = cosmicCard.gana
    ? GANA_CONFIG[cosmicCard.gana] || GANA_CONFIG.Manushya
    : null;

  const theirAttributes = [
    {
      emoji: "🌟",
      label: "Nakshatra",
      value: cosmicCard.nakshatra || matchInfo?.nakshatra || "—",
    },
    { emoji: "🌙", label: "Moon Sign", value: cosmicCard.rashi || "—" },
    {
      emoji: "🔢",
      label: "Pada",
      value: cosmicCard.pada ? `Pada ${cosmicCard.pada}` : "—",
    },
    { emoji: "✨", label: "Gana", value: cosmicCard.gana || "—" },
    { emoji: "🐾", label: "Yoni Animal", value: cosmicCard.animal || "—" },
    { emoji: "🌊", label: "Nadi", value: cosmicCard.nadi || "—" },
    { emoji: "📿", label: "Varna", value: cosmicCard.varna || "—" },
    { emoji: "💫", label: "Vashya", value: cosmicCard.vashya || "—" },
    { emoji: "🪐", label: "Lord Planet", value: cosmicCard.lordPlanet || "—" },
  ];

  const hasAnyData = theirAttributes.some((a) => a.value !== "—");

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: rp(20),
              paddingTop: rs(56),
              paddingBottom: rp(16),
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ padding: rp(8) }}>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(22),
                  color: COLORS.textPrimary,
                }}
              >
                ←
              </Text>
            </TouchableOpacity>

            {/* Clickable avatar */}
            <TouchableOpacity
              onPress={() => setShowPhoto(true)}
              style={{ marginHorizontal: rs(10) }}
              activeOpacity={0.85}
            >
              <View
                style={{
                  width: rs(44),
                  height: rs(44),
                  borderRadius: rs(22),
                  borderWidth: 2,
                  borderColor: gc?.color || COLORS.gold,
                  overflow: "hidden",
                  backgroundColor: COLORS.bgElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {matchInfo?.photo ? (
                  <Image
                    source={{ uri: matchInfo.photo }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text
                    style={{
                      fontFamily: FONTS.headingBold,
                      fontSize: rf(18),
                      color: COLORS.gold,
                    }}
                  >
                    {matchInfo?.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(17),
                  color: COLORS.textPrimary,
                }}
              >
                {matchInfo?.name || "Profile"}
              </Text>
              {cosmicCard.nakshatra || matchInfo?.nakshatra ? (
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(12),
                    color: COLORS.gold,
                  }}
                >
                  ✦ {cosmicCard.nakshatra || matchInfo?.nakshatra}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            {[
              { key: "compat", label: "❤️ Compatibility" },
              { key: "koota", label: "🔯 Their Chart" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: rp(12),
                  position: "relative",
                }}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyMedium,
                    fontSize: rf(13),
                    color:
                      activeTab === tab.key
                        ? COLORS.gold
                        : COLORS.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
                {activeTab === tab.key && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "15%",
                      right: "15%",
                      height: rs(2),
                      backgroundColor: COLORS.gold,
                      borderRadius: 1,
                    }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator color={COLORS.gold} size="large" />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(14),
                  color: COLORS.textSecondary,
                  marginTop: rs(12),
                }}
              >
                Computing compatibility...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: rp(20) }}
              showsVerticalScrollIndicator={false}
            >
              {/* ── TAB 1: COMPATIBILITY ──────────────────────────────────── */}
              {activeTab === "compat" && (
                <>
                  <View
                    style={{
                      backgroundColor: COLORS.bgElevated,
                      borderRadius: RADIUS.md,
                      padding: rp(12),
                      marginBottom: rp(16),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(12),
                        color: COLORS.textSecondary,
                        lineHeight: rf(18),
                      }}
                    >
                      This is the{" "}
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          color: COLORS.textPrimary,
                        }}
                      >
                        pairwise compatibility
                      </Text>{" "}
                      between you and {matchInfo?.name}. Each of 8 Kootas
                      compares your cosmic attributes against theirs using Ashta
                      Koota rules.
                    </Text>
                  </View>

                  {compatData && vc ? (
                    <>
                      <View
                        style={{ alignItems: "center", marginBottom: rp(20) }}
                      >
                        <View
                          style={{
                            width: rs(90),
                            height: rs(90),
                            borderRadius: rs(45),
                            borderWidth: 2.5,
                            borderColor: vc.color,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: vc.color + "15",
                            marginBottom: rp(12),
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: FONTS.headingBold,
                              fontSize: rf(24),
                              color: vc.color,
                            }}
                          >
                            {pct}%
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(10),
                              color: COLORS.textSecondary,
                            }}
                          >
                            compatible
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: FONTS.headingBold,
                            fontSize: rf(20),
                            color: COLORS.textPrimary,
                            marginBottom: rp(4),
                          }}
                        >
                          {vc.emoji} {compatData.verdict}
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: rf(14),
                            color: COLORS.textSecondary,
                          }}
                        >
                          {compatData.totalScore}/36 Gunas
                        </Text>
                      </View>

                      <View
                        style={{
                          height: rs(5),
                          backgroundColor: COLORS.border,
                          borderRadius: 3,
                          overflow: "hidden",
                          marginBottom: rp(20),
                        }}
                      >
                        <View
                          style={{
                            height: rs(5),
                            width: `${pct}%`,
                            backgroundColor: vc.color,
                            borderRadius: 3,
                          }}
                        />
                      </View>

                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: rf(10),
                          color: COLORS.textDim,
                          letterSpacing: 2,
                          marginBottom: rp(10),
                        }}
                      >
                        ASHTA KOOTA BREAKDOWN
                      </Text>
                      <View
                        style={{
                          backgroundColor: COLORS.bgCard,
                          borderRadius: RADIUS.xl,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          overflow: "hidden",
                          marginBottom: rp(20),
                        }}
                      >
                        {KOOTA_LIST.map((k, idx) => {
                          const entry = compatData.breakdown?.[k.key];
                          const score = entry?.score ?? 0;
                          const maxVal = entry?.max ?? k.max;
                          const detail = entry?.detail ?? "";
                          const isPerfect = score === maxVal;
                          const isZero = score === 0;
                          const barColor = isPerfect
                            ? COLORS.gold
                            : isZero
                            ? COLORS.rose
                            : vc.color;
                          return (
                            <View
                              key={k.key}
                              style={{
                                paddingHorizontal: rp(16),
                                paddingVertical: rp(12),
                                borderBottomWidth:
                                  idx < KOOTA_LIST.length - 1 ? 1 : 0,
                                borderBottomColor: COLORS.border,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: rs(10),
                                  marginBottom: rp(6),
                                }}
                              >
                                <Text
                                  style={{ fontSize: rf(18), width: rs(24) }}
                                >
                                  {k.emoji}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <View>
                                      <Text
                                        style={{
                                          fontFamily: FONTS.bodyMedium,
                                          fontSize: rf(14),
                                          color: COLORS.textPrimary,
                                        }}
                                      >
                                        {k.name}
                                      </Text>
                                      <Text
                                        style={{
                                          fontFamily: FONTS.body,
                                          fontSize: rf(11),
                                          color: COLORS.textDim,
                                        }}
                                      >
                                        {k.desc}
                                      </Text>
                                    </View>
                                    <Text
                                      style={{
                                        fontFamily: FONTS.bodyBold,
                                        fontSize: rf(14),
                                        color: isPerfect
                                          ? COLORS.gold
                                          : isZero
                                          ? COLORS.rose
                                          : COLORS.textSecondary,
                                      }}
                                    >
                                      {score}/{maxVal}
                                      {isPerfect ? " ✓" : isZero ? " ✕" : ""}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              <View
                                style={{
                                  height: rs(4),
                                  backgroundColor: COLORS.border,
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  marginLeft: rs(34),
                                }}
                              >
                                <View
                                  style={{
                                    height: rs(4),
                                    width: `${(score / maxVal) * 100}%`,
                                    backgroundColor: barColor,
                                    borderRadius: 2,
                                  }}
                                />
                              </View>
                              {detail ? (
                                <Text
                                  style={{
                                    fontFamily: FONTS.body,
                                    fontSize: rf(11),
                                    color: COLORS.textSecondary,
                                    marginTop: rp(4),
                                    marginLeft: rs(34),
                                    fontStyle: "italic",
                                  }}
                                >
                                  {detail}
                                </Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>

                      {compatData.doshas?.length > 0 && (
                        <>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(10),
                              color: COLORS.textDim,
                              letterSpacing: 2,
                              marginBottom: rp(10),
                            }}
                          >
                            DOSHAS
                          </Text>
                          <View
                            style={{
                              backgroundColor: COLORS.bgCard,
                              borderRadius: RADIUS.xl,
                              borderWidth: 1,
                              borderColor: "#FF980040",
                              overflow: "hidden",
                              marginBottom: rp(20),
                            }}
                          >
                            {compatData.doshas.map((d, i) => (
                              <View
                                key={i}
                                style={{
                                  flexDirection: "row",
                                  gap: rs(10),
                                  padding: rp(14),
                                  borderBottomWidth:
                                    i < compatData.doshas.length - 1 ? 1 : 0,
                                  borderBottomColor: COLORS.border,
                                }}
                              >
                                <Text style={{ fontSize: rf(18) }}>
                                  {d.severity === "high" ? "⚠️" : "ℹ️"}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      fontFamily: FONTS.bodyMedium,
                                      fontSize: rf(14),
                                      color: COLORS.textPrimary,
                                      marginBottom: rp(2),
                                    }}
                                  >
                                    {d.name}
                                  </Text>
                                  <Text
                                    style={{
                                      fontFamily: FONTS.body,
                                      fontSize: rf(12),
                                      color: COLORS.textSecondary,
                                      lineHeight: rf(18),
                                    }}
                                  >
                                    {d.description}
                                  </Text>
                                  {d.cancellation && (
                                    <Text
                                      style={{
                                        fontFamily: FONTS.body,
                                        fontSize: rf(11),
                                        color: COLORS.good || "#4ADE80",
                                        marginTop: rp(4),
                                      }}
                                    >
                                      ✓ {d.cancellation}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        </>
                      )}
                    </>
                  ) : (
                    <View style={{ alignItems: "center", padding: rp(40) }}>
                      <Text style={{ fontSize: rf(40), marginBottom: rs(12) }}>
                        ❤️
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: rf(14),
                          color: COLORS.textSecondary,
                          textAlign: "center",
                        }}
                      >
                        Compatibility data not available
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* ── TAB 2: THEIR CHART ────────────────────────────────────── */}
              {activeTab === "koota" && (
                <>
                  <View
                    style={{
                      backgroundColor: COLORS.bgElevated,
                      borderRadius: RADIUS.md,
                      padding: rp(12),
                      marginBottom: rp(16),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: rf(12),
                        color: COLORS.textSecondary,
                        lineHeight: rf(18),
                      }}
                    >
                      These are{" "}
                      <Text
                        style={{
                          fontFamily: FONTS.bodyBold,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {matchInfo?.name}'s personal cosmic attributes
                      </Text>{" "}
                      — their fixed cosmic fingerprint derived from their birth
                      Nakshatra. These were used to calculate compatibility in
                      Tab 1.
                    </Text>
                  </View>

                  {/* Clickable photo */}
                  {matchInfo?.photo && (
                    <TouchableOpacity
                      onPress={() => setShowPhoto(true)}
                      activeOpacity={0.9}
                      style={{
                        borderRadius: RADIUS.xl,
                        overflow: "hidden",
                        marginBottom: rp(16),
                        height: rs(200),
                      }}
                    >
                      <Image
                        source={{ uri: matchInfo.photo }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                      <View
                        style={{
                          position: "absolute",
                          bottom: rp(10),
                          right: rp(10),
                          backgroundColor: "rgba(0,0,0,0.6)",
                          borderRadius: RADIUS.md,
                          paddingHorizontal: rp(10),
                          paddingVertical: rp(5),
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: rf(11),
                            color: "#fff",
                          }}
                        >
                          Tap to expand 🔍
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Gana hero */}
                  {gc && (
                    <View
                      style={{
                        backgroundColor: gc.bg,
                        borderRadius: RADIUS.xl,
                        padding: rp(16),
                        marginBottom: rp(16),
                        borderWidth: 1,
                        borderColor: gc.color + "40",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: rs(12),
                        }}
                      >
                        <Text style={{ fontSize: rf(32) }}>{gc.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.headingBold,
                              fontSize: rf(20),
                              color: COLORS.textPrimary,
                            }}
                          >
                            {cosmicCard.gana} Gana
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(13),
                              color: gc.color,
                            }}
                          >
                            {gc.title}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* All attributes */}
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(10),
                      color: COLORS.textDim,
                      letterSpacing: 3,
                      marginBottom: rp(10),
                    }}
                  >
                    COSMIC ATTRIBUTES
                  </Text>
                  <View
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: RADIUS.xl,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      overflow: "hidden",
                      marginBottom: rp(20),
                    }}
                  >
                    {theirAttributes.map((attr, idx) => {
                      const hasValue = attr.value !== "—";
                      return (
                        <View
                          key={attr.label}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: rp(16),
                            paddingVertical: rp(12),
                            borderBottomWidth:
                              idx < theirAttributes.length - 1 ? 1 : 0,
                            borderBottomColor: COLORS.border,
                          }}
                        >
                          <Text style={{ fontSize: rf(18), width: rs(28) }}>
                            {attr.emoji}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: rf(13),
                              color: COLORS.textSecondary,
                              flex: 1,
                            }}
                          >
                            {attr.label}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.bodyBold,
                              fontSize: rf(14),
                              color: hasValue
                                ? COLORS.textPrimary
                                : COLORS.textDim,
                            }}
                          >
                            {attr.value}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {!hasAnyData && (
                    <View
                      style={{
                        backgroundColor: COLORS.bgElevated,
                        borderRadius: RADIUS.md,
                        padding: rp(14),
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: rf(12),
                          color: COLORS.textSecondary,
                          lineHeight: rf(18),
                          textAlign: "center",
                        }}
                      >
                        💡 This match was made before the full data was stored.
                        The compatibility calculation in Tab 1 was correctly
                        computed at matching time. New matches will show all
                        attributes here.
                      </Text>
                    </View>
                  )}
                </>
              )}

              <View style={{ height: rp(40) }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Full screen photo viewer */}
      <PhotoViewer
        visible={showPhoto}
        photoUri={matchInfo?.photo}
        onClose={() => setShowPhoto(false)}
      />
    </>
  );
}

// ── Main Chat Screen ──────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { COLORS, FONTS, RADIUS } = useTheme();

  const currentUser = useSelector(selectUser);
  const messages = useSelector(selectMessages(matchId));
  const chatLoading = useSelector(selectChatLoading(matchId));
  const matches = useSelector((state) => state.matches.matches);

  const [inputText, setInputText] = useState("");
  const [theirTyping, setTheirTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    const match = matches.find(
      (m) => m.matchId?.toString() === matchId?.toString()
    );
    if (match) {
      // Pass the full cosmicCard — populated from fetchMatches backend response
      // OR from addMatch with full cosmicCard (fixed in matchesSlice + discover)
      setMatchInfo({
        name: match.user?.name,
        age: match.user?.age,
        photo: match.user?.photo || match.user?.photos?.[0] || null,
        nakshatra: match.user?.cosmicCard?.nakshatra,
        cosmicCard: match.user?.cosmicCard || {},
        gunaScore: match.compatibility?.gunaScore,
        verdict: match.compatibility?.verdict,
        userId: match.user?.id,
      });
    }
    dispatch(clearUnread(matchId));
    dispatch(fetchMessages(matchId));
    setupSocket();
    return () => {
      clearTimeout(typingTimeout.current);
      if (socketRef.current) {
        socketRef.current.off("message:new");
        socketRef.current.off("typing:start");
        socketRef.current.off("typing:stop");
      }
    };
  }, [matchId]);

  const setupSocket = async () => {
    try {
      const socket = await connectSocket();
      socketRef.current = socket;
      if (!socket) return;
      socket.emit("join:matches", [matchId]);
      socket.on("message:new", (msg) => {
        if (msg.matchId?.toString() === matchId?.toString()) {
          dispatch(addMessage({ matchId, message: msg }));
          scrollToBottom();
        }
      });
      socket.on("typing:start", ({ matchId: mid }) => {
        if (mid?.toString() === matchId?.toString()) setTheirTyping(true);
      });
      socket.on("typing:stop", ({ matchId: mid }) => {
        if (mid?.toString() === matchId?.toString()) setTheirTyping(false);
      });
    } catch {}
  };

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  const handleTyping = (text) => {
    setInputText(text);
    if (text.length > 0) {
      emitTypingStart(matchId);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => emitTypingStop(matchId), 2000);
    } else {
      emitTypingStop(matchId);
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    const tempId = `temp_${matchId}_${++tempIdCounter.current}`;
    dispatch(
      addMessage({
        matchId,
        message: {
          _id: tempId,
          text,
          sender: { _id: currentUser?.id },
          createdAt: new Date().toISOString(),
          pending: true,
        },
      })
    );
    setInputText("");
    emitTypingStop(matchId);
    scrollToBottom();
    sendSocketMessage(matchId, text, tempId, () => {});
  };

  const isMyMessage = (msg) => {
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    return senderId === currentUser?.id?.toString();
  };

  const renderMessage = ({ item }) => {
    const mine = isMyMessage(item);
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: rs(8),
          marginVertical: rp(2),
          justifyContent: mine ? "flex-end" : "flex-start",
        }}
      >
        {!mine && (
          <View
            style={{
              width: rs(28),
              height: rs(28),
              borderRadius: rs(14),
              backgroundColor: COLORS.bgElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: rf(14) }}>
              {matchInfo?.cosmicCard?.nakshatra?.split(" ")[0] ||
                matchInfo?.nakshatra?.split(" ")[0] ||
                "🌟"}
            </Text>
          </View>
        )}
        <View
          style={{
            maxWidth: "75%",
            borderRadius: RADIUS.lg,
            padding: rp(10),
            paddingHorizontal: rp(14),
            backgroundColor: mine ? COLORS.gold : COLORS.bgElevated,
            borderBottomRightRadius: mine ? 4 : RADIUS.lg,
            borderBottomLeftRadius: mine ? RADIUS.lg : 4,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(15),
              color: mine ? "#fff" : COLORS.textPrimary,
              lineHeight: rf(21),
            }}
          >
            {item.text}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: rf(10),
              color: mine ? "rgba(255,255,255,0.6)" : COLORS.textSecondary,
              textAlign: "right",
              marginTop: rp(2),
            }}
          >
            {new Date(item.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
            {item.pending ? " ⏳" : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: rs(56),
          paddingBottom: rp(12),
          paddingHorizontal: rp(12),
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: rs(8),
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: rp(8) }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: rf(22),
              color: COLORS.textPrimary,
            }}
          >
            ←
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: rf(17),
              color: COLORS.textPrimary,
            }}
          >
            {matchInfo?.name || "Match"}
          </Text>
          {matchInfo && (
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: rf(12),
                color: COLORS.textSecondary,
              }}
            >
              ✨ {matchInfo.gunaScore}/36 · {matchInfo.verdict}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={{ padding: rp(8) }}
          onPress={() => setShowProfile(true)}
        >
          <Text style={{ fontSize: rf(22) }}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: rp(8) }}
          onPress={() => setShowBlockReport(true)}
        >
          <Text style={{ fontSize: rf(22), color: COLORS.textSecondary }}>
            ⋯
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {chatLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m._id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: rp(14), gap: rp(4), flexGrow: 1 }}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            matchInfo && (
              <View
                style={{
                  alignItems: "center",
                  marginBottom: rp(20),
                  padding: rp(14),
                  backgroundColor: COLORS.gold + "15",
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: COLORS.gold + "40",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: rf(15),
                    color: COLORS.gold,
                    marginBottom: rp(2),
                  }}
                >
                  🎊 You matched with {matchInfo.name}!
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: rf(12),
                    color: COLORS.textSecondary,
                  }}
                >
                  {matchInfo.nakshatra} · {matchInfo.gunaScore}/36 Gunas
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingTop: rp(80),
              }}
            >
              <Text style={{ fontSize: rf(48), marginBottom: rs(16) }}>💬</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: rf(18),
                  color: COLORS.textPrimary,
                  marginBottom: rp(6),
                }}
              >
                Say hello to {matchInfo?.name || "your match"}!
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: rf(13),
                  color: COLORS.textSecondary,
                }}
              >
                You're cosmically connected ✨
              </Text>
            </View>
          }
          ListFooterComponent={
            theirTyping ? (
              <View style={{ paddingLeft: rs(44), marginTop: rp(6) }}>
                <View
                  style={{
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.lg,
                    paddingVertical: rp(8),
                    paddingHorizontal: rp(14),
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: rf(18),
                      color: COLORS.textSecondary,
                      letterSpacing: 3,
                    }}
                  >
                    • • •
                  </Text>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          padding: rp(12),
          paddingBottom: rs(28),
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.bg,
          gap: rs(8),
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: COLORS.border,
            paddingHorizontal: rp(14),
            paddingVertical: rp(10),
            fontFamily: FONTS.body,
            fontSize: rf(15),
            color: COLORS.textPrimary,
            maxHeight: rs(100),
          }}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textDim}
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={{
            width: rs(44),
            height: rs(44),
            borderRadius: rs(22),
            backgroundColor: inputText.trim() ? COLORS.gold : COLORS.bgElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: rf(18),
              color: inputText.trim() ? "#fff" : COLORS.textDim,
            }}
          >
            ✦
          </Text>
        </TouchableOpacity>
      </View>

      <ProfileModal
        visible={showProfile}
        matchInfo={matchInfo}
        onClose={() => setShowProfile(false)}
      />
      {matchInfo && (
        <BlockReportModal
          visible={showBlockReport}
          matchId={matchId}
          userId={matchInfo.userId}
          userName={matchInfo.name}
          onClose={() => setShowBlockReport(false)}
          onBlocked={() => {
            setShowBlockReport(false);
            router.back();
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
