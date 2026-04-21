  // components/BlockReportModal.jsx
  // ─────────────────────────────────────────────────────────────────────────────
  // Block/Report modal — renders a bottom sheet with options.
  //
  // Props:
  //   visible: bool
  //   matchId: string  — the Match document _id
  //   userName: string — their display name
  //   onClose: fn
  //   onBlocked: fn   — called after successful block (so parent can navigate away)
  //
  // API calls:
  //   DELETE /api/matching/unmatch/:matchId  — block (already exists)
  //   POST   /api/matching/report/:userId    — report (new backend route needed)
  // ─────────────────────────────────────────────────────────────────────────────

  import { useState } from "react";
  import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
  } from "react-native";
  import { useTheme } from "../context/ThemeContext";
  import { matchingAPI } from "../services/api";

  const REPORT_REASONS = [
    { key: "fake", label: "Fake profile or impersonation" },
    { key: "spam", label: "Spam or solicitation" },
    { key: "offensive", label: "Offensive or abusive behavior" },
    { key: "underage", label: "Underage user" },
    { key: "other", label: "Other" },
  ];

  export default function BlockReportModal({
    visible,
    matchId,
    userId,
    userName,
    onClose,
    onBlocked,
  }) {
    const { COLORS, FONTS, SPACING, RADIUS } = useTheme();
    const [screen, setScreen] = useState("main"); // 'main' | 'report'
    const [loading, setLoading] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);

    const reset = () => {
      setScreen("main");
      setSelectedReason(null);
      setLoading(false);
      onClose?.();
    };

    const handleBlock = async () => {
      Alert.alert(
        `Block ${userName}?`,
        "They won't be able to contact you and you won't see them in Discover.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                // block first (adds to blocked list + unmatches)
                if (userId) await matchingAPI.block(userId);
                // also call unmatch for backwards compat if matchId exists
                else await matchingAPI.unmatch(matchId);
                reset();
                onBlocked?.();
              } catch (err) {
                Alert.alert("Error", err.response?.data?.message || err.message);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    };

    const handleReport = async () => {
      if (!selectedReason) {
        Alert.alert(
          "Select a reason",
          "Please choose why you're reporting this profile."
        );
        return;
      }
      setLoading(true);
      try {
        await matchingAPI.report(userId, selectedReason);
        reset();
        Alert.alert(
          "Report submitted",
          "Thank you. Our team will review this report within 24 hours."
        );
      } catch (err) {
        Alert.alert("Error", err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={reset}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: COLORS.modalBg,
          }}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={reset} />

          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
              padding: SPACING.xl,
              paddingBottom: 40,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: COLORS.border,
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: SPACING.lg,
              }}
            />

            {screen === "main" ? (
              <>
                <Text
                  style={{
                    fontFamily: FONTS.headingBold,
                    fontSize: 16,
                    color: COLORS.textPrimary,
                    letterSpacing: 2,
                    marginBottom: SPACING.lg,
                    textAlign: "center",
                  }}
                >
                  {userName}
                </Text>

                {/* Block */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: SPACING.md,
                    paddingVertical: SPACING.md,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}
                  onPress={handleBlock}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 22 }}>🚫</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: 15,
                        color: COLORS.rose,
                        marginBottom: 2,
                      }}
                    >
                      Block {userName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 12,
                        color: COLORS.textSecondary,
                      }}
                    >
                      They won't be able to contact you
                    </Text>
                  </View>
                  {loading && (
                    <ActivityIndicator size="small" color={COLORS.rose} />
                  )}
                </TouchableOpacity>

                {/* Report */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: SPACING.md,
                    paddingVertical: SPACING.md,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}
                  onPress={() => setScreen("report")}
                >
                  <Text style={{ fontSize: 22 }}>⚑</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: 15,
                        color: COLORS.textPrimary,
                        marginBottom: 2,
                      }}
                    >
                      Report {userName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 12,
                        color: COLORS.textSecondary,
                      }}
                    >
                      Flag inappropriate behaviour for review
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  style={{
                    paddingVertical: SPACING.md,
                    alignItems: "center",
                    marginTop: SPACING.sm,
                  }}
                  onPress={reset}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 15,
                      color: COLORS.textSecondary,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setScreen("main")}
                  style={{ marginBottom: SPACING.md }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 14,
                      color: COLORS.gold,
                    }}
                  >
                    ← Back
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{
                    fontFamily: FONTS.headingBold,
                    fontSize: 16,
                    color: COLORS.textPrimary,
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  REPORT {userName.toUpperCase()}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.textSecondary,
                    marginBottom: SPACING.lg,
                  }}
                >
                  Why are you reporting this profile?
                </Text>

                {REPORT_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: SPACING.md,
                      paddingVertical: SPACING.md,
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.border,
                    }}
                    onPress={() => setSelectedReason(r.key)}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor:
                          selectedReason === r.key ? COLORS.gold : COLORS.border,
                        backgroundColor:
                          selectedReason === r.key ? COLORS.gold : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedReason === r.key && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: COLORS.bg,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 14,
                        color: COLORS.textPrimary,
                        flex: 1,
                      }}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.rose,
                    borderRadius: RADIUS.lg,
                    paddingVertical: SPACING.md,
                    alignItems: "center",
                    marginTop: SPACING.xl,
                    opacity: loading || !selectedReason ? 0.6 : 1,
                  }}
                  onPress={handleReport}
                  disabled={loading || !selectedReason}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        fontSize: 15,
                        color: "#fff",
                      }}
                    >
                      Submit Report
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  }
