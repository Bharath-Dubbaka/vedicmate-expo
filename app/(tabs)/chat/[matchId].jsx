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

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { COLORS, FONTS, SPACING, RADIUS } = useTheme();

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
      (m) => m.matchId.toString() === matchId.toString()
    );
    if (match) {
      setMatchInfo({
        name: match.user?.name,
        nakshatra: match.user?.cosmicCard?.nakshatra,
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
        if (msg.matchId.toString() === matchId.toString()) {
          dispatch(addMessage({ matchId, message: msg }));
          scrollToBottom();
        }
      });
      socket.on("typing:start", ({ matchId: mid }) => {
        if (mid.toString() === matchId.toString()) setTheirTyping(true);
      });
      socket.on("typing:stop", ({ matchId: mid }) => {
        if (mid.toString() === matchId.toString()) setTheirTyping(false);
      });
    } catch {}
  };

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

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
          gap: SPACING.sm,
          marginVertical: 2,
          justifyContent: mine ? "flex-end" : "flex-start",
        }}
      >
        {!mine && (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: COLORS.bgElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {matchInfo?.nakshatra?.split(" ")[0] || "🌟"}
            </Text>
          </View>
        )}
        <View
          style={{
            maxWidth: "75%",
            borderRadius: RADIUS.lg,
            padding: SPACING.sm + 2,
            paddingHorizontal: SPACING.md,
            backgroundColor: mine ? COLORS.gold : COLORS.bgElevated,
            borderBottomRightRadius: mine ? 4 : RADIUS.lg,
            borderBottomLeftRadius: mine ? RADIUS.lg : 4,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 15,
              color: mine ? COLORS.bg : COLORS.textPrimary,
              lineHeight: 21,
            }}
          >
            {item.text}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: mine ? "rgba(0,0,0,0.4)" : COLORS.textSecondary,
              textAlign: "right",
              marginTop: 2,
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
          paddingTop: 56,
          paddingBottom: SPACING.md,
          paddingHorizontal: SPACING.md,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: SPACING.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: SPACING.sm }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 22,
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
              fontSize: 17,
              color: COLORS.textPrimary,
            }}
          >
            {matchInfo?.name || "Match"}
          </Text>
          {matchInfo && (
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              ✨ {matchInfo.gunaScore}/36 · {matchInfo.verdict}
            </Text>
          )}
        </View>
        {/* Profile view */}
        <TouchableOpacity
          style={{ padding: SPACING.sm }}
          onPress={() => setShowProfile(true)}
        >
          <Text style={{ fontSize: 22 }}>👤</Text>
        </TouchableOpacity>
        {/* Block/report — ⋯ menu */}
        <TouchableOpacity
          style={{ padding: SPACING.sm }}
          onPress={() => setShowBlockReport(true)}
        >
          <Text style={{ fontSize: 22, color: COLORS.textSecondary }}>⋯</Text>
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
          contentContainerStyle={{
            padding: SPACING.md,
            gap: SPACING.sm,
            flexGrow: 1,
          }}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            matchInfo && (
              <View
                style={{
                  alignItems: "center",
                  marginBottom: SPACING.xl,
                  padding: SPACING.md,
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: COLORS.gold,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: 15,
                    color: COLORS.gold,
                    marginBottom: 2,
                  }}
                >
                  🎊 You matched with {matchInfo.name}!
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
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
                paddingTop: 80,
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>💬</Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 18,
                  color: COLORS.textPrimary,
                  marginBottom: SPACING.xs,
                }}
              >
                Say hello to {matchInfo?.name || "your match"}!
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                }}
              >
                You're cosmically connected. Break the ice ✨
              </Text>
            </View>
          }
          ListFooterComponent={
            theirTyping ? (
              <View style={{ paddingLeft: 44, marginTop: SPACING.xs }}>
                <View
                  style={{
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: RADIUS.lg,
                    paddingVertical: SPACING.sm,
                    paddingHorizontal: SPACING.md,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 16,
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

      {/* Input bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          padding: SPACING.md,
          paddingBottom: 28,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.bg,
          gap: SPACING.sm,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: COLORS.border,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm + 2,
            fontFamily: FONTS.body,
            fontSize: 15,
            color: COLORS.textPrimary,
            maxHeight: 100,
          }}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textDim}
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
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
              fontSize: 18,
              color: inputText.trim() ? COLORS.bg : COLORS.textDim,
            }}
          >
            ✦
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 56,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowProfile(false)}
              style={{ padding: 8 }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: 22,
                  color: COLORS.textPrimary,
                }}
              >
                ←
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 17,
                color: COLORS.textPrimary,
                marginLeft: 8,
              }}
            >
              {matchInfo?.name || "Profile"}
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <View
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.gold,
                  letterSpacing: 3,
                  marginBottom: 8,
                }}
              >
                COSMIC IDENTITY
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: 24,
                  color: COLORS.textPrimary,
                  marginBottom: 4,
                }}
              >
                {matchInfo?.nakshatra || "—"}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.textSecondary,
                }}
              >
                {matchInfo?.name}, your cosmic match
              </Text>
            </View>
            <View
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 11,
                  color: COLORS.gold,
                  letterSpacing: 3,
                  marginBottom: 8,
                }}
              >
                COMPATIBILITY
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.headingBold,
                  fontSize: 32,
                  color: COLORS.gold,
                }}
              >
                {matchInfo?.gunaScore}/36
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 15,
                  color: COLORS.textPrimary,
                  marginTop: 4,
                }}
              >
                {matchInfo?.verdict}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Block/Report modal */}
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
