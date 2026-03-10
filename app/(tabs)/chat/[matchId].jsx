// app/(tabs)/chat/[matchId].jsx
import { useEffect, useRef, useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TextInput,
   TouchableOpacity,
   KeyboardAvoidingView,
   Platform,
   ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS } from "../../../constants/theme";

// Per-match mock message store (lives in module scope for this session)
const MOCK_MSG_STORE = {};

const MOCK_MATCHES = {
   m1: {
      name: "Priya",
      nakshatra: "🌸 Rohini",
      gunaScore: 28,
      verdict: "Great Match",
   },
   m2: {
      name: "Kavitha",
      nakshatra: "⭐ Pushya",
      gunaScore: 32,
      verdict: "Excellent Match",
   },
   m3: {
      name: "Ananya",
      nakshatra: "🌙 Hasta",
      gunaScore: 22,
      verdict: "Good Match",
   },
   m4: {
      name: "Meera",
      nakshatra: "🔥 Magha",
      gunaScore: 18,
      verdict: "Average Match",
   },
   m5: {
      name: "Divya",
      nakshatra: "💫 Chitra",
      gunaScore: 30,
      verdict: "Great Match",
   },
};

const AUTO_REPLIES = [
   "Namaste! 🙏 I'm so glad the stars brought us together.",
   "Your Nakshatra energy is so compatible with mine! ✨",
   "I was hoping someone with this Guna score would find me 😊",
   "Tell me more about yourself! What do you do?",
   "The cosmic alignment feels right 🔮",
];

export default function ChatScreen() {
   const { matchId } = useLocalSearchParams();
   const router = useRouter();
   const { user, token } = useAuthStore();

   const isDev = !token || token.startsWith("dev_token");

   // Per-match message state — keyed by matchId
   const [messages, setMessages] = useState([]);
   const [inputText, setInputText] = useState("");
   const [loading, setLoading] = useState(true);
   const [theirTyping, setTheirTyping] = useState(false);
   const [matchInfo, setMatchInfo] = useState(null);

   const flatListRef = useRef(null);
   const tempIdCounter = useRef(0);
   const replyTimer = useRef(null);

   useEffect(() => {
      // Reset state when matchId changes — fixes shared-messages bug
      setMessages([]);
      setInputText("");
      setLoading(true);
      setTheirTyping(false);

      if (isDev) {
         loadDevChat();
      } else {
         loadRealChat();
      }

      return () => {
         if (replyTimer.current) clearTimeout(replyTimer.current);
      };
   }, [matchId]); // Re-runs when matchId changes

   const loadDevChat = () => {
      const info = MOCK_MATCHES[matchId] || {
         name: "Match",
         nakshatra: "🌟",
         gunaScore: 0,
         verdict: "",
      };
      setMatchInfo(info);
      // Load persisted mock messages for this specific matchId
      const stored = MOCK_MSG_STORE[matchId] || [];
      setMessages(stored);
      setLoading(false);
   };

   const loadRealChat = async () => {
      try {
         const { chatAPI, matchingAPI } = await import("../../../services/api");
         const [msgRes, matchRes] = await Promise.all([
            chatAPI.getMessages(matchId, { limit: 40 }),
            matchingAPI.getMatches(),
         ]);
         setMessages(msgRes.data.messages);
         const match = matchRes.data.matches.find(
            (m) => m.matchId.toString() === matchId,
         );
         if (match)
            setMatchInfo({
               name: match.user.name,
               nakshatra: match.user.cosmicCard?.nakshatra,
               gunaScore: match.compatibility.gunaScore,
               verdict: match.compatibility.verdict,
            });
      } catch (err) {
         console.error("Chat load error:", err.message);
         // Fall back to dev mode
         loadDevChat();
      } finally {
         setLoading(false);
      }
   };

   const scrollToBottom = () => {
      setTimeout(
         () => flatListRef.current?.scrollToEnd({ animated: true }),
         100,
      );
   };

   const handleSend = () => {
      const text = inputText.trim();
      if (!text) return;

      const newMsg = {
         _id: `temp_${matchId}_${++tempIdCounter.current}`,
         text,
         sender: { _id: user?.id || "dev_user_001" },
         createdAt: new Date().toISOString(),
         pending: false,
      };

      const updated = [...(MOCK_MSG_STORE[matchId] || []), newMsg];
      MOCK_MSG_STORE[matchId] = updated;
      setMessages(updated);
      setInputText("");
      scrollToBottom();

      if (isDev) {
         // Simulate reply after delay
         setTheirTyping(true);
         replyTimer.current = setTimeout(
            () => {
               const reply = {
                  _id: `reply_${matchId}_${Date.now()}`,
                  text: AUTO_REPLIES[
                     Math.floor(Math.random() * AUTO_REPLIES.length)
                  ],
                  sender: { _id: `other_${matchId}` },
                  createdAt: new Date().toISOString(),
               };
               const withReply = [...(MOCK_MSG_STORE[matchId] || []), reply];
               MOCK_MSG_STORE[matchId] = withReply;
               setMessages(withReply);
               setTheirTyping(false);
               scrollToBottom();
            },
            1500 + Math.random() * 1000,
         );
      } else {
         // Real socket send
         import("../../../services/socket").then(({ sendSocketMessage }) => {
            sendSocketMessage(matchId, text, newMsg._id, () => {});
         });
      }
   };

   const isMe = (msg) =>
      (msg.sender?._id || msg.sender)?.toString() ===
      (user?.id || "dev_user_001").toString();

   const renderMessage = ({ item, index }) => {
      const mine = isMe(item);
      return (
         <View
            style={[
               styles.msgRow,
               mine ? styles.msgRowMine : styles.msgRowTheirs,
            ]}
         >
            {!mine && (
               <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>
                     {matchInfo?.nakshatra?.split(" ")[0] || "🌟"}
                  </Text>
               </View>
            )}
            <View
               style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
               ]}
            >
               <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                  {item.text}
               </Text>
               <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                     hour: "2-digit",
                     minute: "2-digit",
                     hour12: true,
                  })}
               </Text>
            </View>
         </View>
      );
   };

   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         keyboardVerticalOffset={0}
      >
         <View style={styles.header}>
            <TouchableOpacity
               onPress={() => router.back()}
               style={styles.backBtn}
            >
               <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
               <Text style={styles.headerName}>
                  {matchInfo?.name || "Match"}
               </Text>
               {matchInfo && (
                  <Text style={styles.headerScore}>
                     ✨ {matchInfo.gunaScore}/36 · {matchInfo.verdict}
                  </Text>
               )}
            </View>
            <View style={styles.kundliBtn}>
               <Text style={styles.kundliBtnText}>🔮</Text>
            </View>
         </View>

         {loading ? (
            <View style={styles.loading}>
               <ActivityIndicator color={COLORS.gold} />
            </View>
         ) : (
            <FlatList
               ref={flatListRef}
               data={messages}
               keyExtractor={(m) => m._id.toString()}
               renderItem={renderMessage}
               contentContainerStyle={styles.messageList}
               onContentSizeChange={scrollToBottom}
               ListHeaderComponent={
                  matchInfo && (
                     <View style={styles.matchBanner}>
                        <Text style={styles.matchBannerText}>
                           🎊 You matched with {matchInfo.name}!
                        </Text>
                        <Text style={styles.matchBannerSub}>
                           {matchInfo.nakshatra} · {matchInfo.gunaScore}/36
                           Gunas
                        </Text>
                     </View>
                  )
               }
               ListEmptyComponent={
                  <View style={styles.emptyChat}>
                     <Text style={styles.emptyChatEmoji}>💬</Text>
                     <Text style={styles.emptyChatText}>
                        Say hello to {matchInfo?.name}!
                     </Text>
                  </View>
               }
               ListFooterComponent={
                  theirTyping ? (
                     <View style={styles.typingRow}>
                        <View style={styles.typingBubble}>
                           <Text style={styles.typingDots}>• • •</Text>
                        </View>
                     </View>
                  ) : null
               }
            />
         )}

         <View style={styles.inputBar}>
            <TextInput
               style={styles.input}
               placeholder="Type a message..."
               placeholderTextColor={COLORS.textDim}
               value={inputText}
               onChangeText={setInputText}
               multiline
               maxLength={1000}
            />
            <TouchableOpacity
               style={[
                  styles.sendBtn,
                  !inputText.trim() && styles.sendBtnDisabled,
               ]}
               onPress={handleSend}
               disabled={!inputText.trim()}
            >
               <Text style={styles.sendBtnText}>✦</Text>
            </TouchableOpacity>
         </View>
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: COLORS.bg },
   header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 56,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      gap: SPACING.sm,
   },
   backBtn: { padding: SPACING.sm },
   backBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 22,
      color: COLORS.textPrimary,
   },
   headerInfo: { flex: 1 },
   headerName: {
      fontFamily: FONTS.bodyBold,
      fontSize: 17,
      color: COLORS.textPrimary,
   },
   headerScore: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
   },
   kundliBtn: { padding: SPACING.sm },
   kundliBtnText: { fontSize: 22 },
   loading: { flex: 1, alignItems: "center", justifyContent: "center" },
   messageList: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
   matchBanner: {
      alignItems: "center",
      marginBottom: SPACING.xl,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.gold,
   },
   matchBannerText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 15,
      color: COLORS.gold,
      marginBottom: 2,
   },
   matchBannerSub: {
      fontFamily: FONTS.body,
      fontSize: 12,
      color: COLORS.textSecondary,
   },
   emptyChat: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
   },
   emptyChatEmoji: { fontSize: 48, marginBottom: SPACING.md },
   emptyChatText: {
      fontFamily: FONTS.body,
      fontSize: 16,
      color: COLORS.textSecondary,
   },
   msgRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: SPACING.sm,
      marginVertical: 2,
   },
   msgRowMine: { justifyContent: "flex-end" },
   msgRowTheirs: { justifyContent: "flex-start" },
   msgAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: COLORS.bgElevated,
      alignItems: "center",
      justifyContent: "center",
   },
   msgAvatarText: { fontSize: 14 },
   bubble: {
      maxWidth: "75%",
      borderRadius: RADIUS.lg,
      padding: SPACING.sm + 2,
      paddingHorizontal: SPACING.md,
   },
   bubbleMine: { backgroundColor: COLORS.gold, borderBottomRightRadius: 4 },
   bubbleTheirs: {
      backgroundColor: COLORS.bgElevated,
      borderBottomLeftRadius: 4,
   },
   bubbleText: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: COLORS.textPrimary,
      lineHeight: 21,
   },
   bubbleTextMine: { color: COLORS.bg },
   bubbleTime: {
      fontFamily: FONTS.body,
      fontSize: 10,
      color: COLORS.textSecondary,
      textAlign: "right",
      marginTop: 2,
   },
   bubbleTimeMine: { color: "rgba(0,0,0,0.4)" },
   typingRow: { paddingLeft: 44, marginTop: SPACING.xs },
   typingBubble: {
      backgroundColor: COLORS.bgElevated,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      alignSelf: "flex-start",
   },
   typingDots: {
      fontFamily: FONTS.body,
      fontSize: 16,
      color: COLORS.textSecondary,
      letterSpacing: 3,
   },
   inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      padding: SPACING.md,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      backgroundColor: COLORS.bg,
      gap: SPACING.sm,
   },
   input: {
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
   },
   sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.gold,
      alignItems: "center",
      justifyContent: "center",
   },
   sendBtnDisabled: { backgroundColor: COLORS.bgElevated },
   sendBtnText: { fontFamily: FONTS.bodyBold, fontSize: 18, color: COLORS.bg },
});
