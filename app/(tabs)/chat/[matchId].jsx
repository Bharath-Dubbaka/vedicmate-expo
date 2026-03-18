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
   StyleSheet,
   FlatList,
   TextInput,
   TouchableOpacity,
   KeyboardAvoidingView,
   Platform,
   ActivityIndicator,
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
import { COLORS, FONTS, SPACING, RADIUS } from "../../../constants/theme";

export default function ChatScreen() {
   // useLocalSearchParams = access URL params
   // In Expo Router: file name [matchId].jsx → param name is "matchId"
   // React.js (React Router): useParams()
   const { matchId } = useLocalSearchParams();
   const router = useRouter();
   const dispatch = useDispatch();

   const currentUser = useSelector(selectUser);
   const messages = useSelector(selectMessages(matchId));
   const chatLoading = useSelector(selectChatLoading(matchId));

   const [inputText, setInputText] = useState("");
   const [theirTyping, setTheirTyping] = useState(false);
   const [matchInfo, setMatchInfo] = useState(null);

   // Use the matches from Redux to get match info
   const matches = useSelector((state) => state.matches.matches);

   const flatListRef = useRef(null);
   const typingTimeout = useRef(null);
   const socketRef = useRef(null);
   const tempIdCounter = useRef(0);

   useEffect(() => {
      console.log(`[CHAT] Mounted for matchId: ${matchId}`);

      // Get match info from matches slice
      const match = matches.find(
         (m) => m.matchId.toString() === matchId.toString(),
      );
      if (match) {
         setMatchInfo({
            name: match.user?.name,
            nakshatra: match.user?.cosmicCard?.nakshatra,
            gunaScore: match.compatibility?.gunaScore,
            verdict: match.compatibility?.verdict,
         });
      }

      // Clear unread count for this match
      dispatch(clearUnread(matchId));

      // Fetch message history from API
      dispatch(fetchMessages(matchId));

      // Connect Socket.io for real-time messaging
      setupSocket();

      return () => {
         console.log(`[CHAT] Cleanup for matchId: ${matchId}`);
         clearTimeout(typingTimeout.current);
         // Remove socket listeners on unmount
         if (socketRef.current) {
            socketRef.current.off("message:new");
            socketRef.current.off("typing:start");
            socketRef.current.off("typing:stop");
         }
      };
   }, [matchId]);

   const setupSocket = async () => {
      try {
         console.log("[CHAT] Connecting Socket.io...");
         const socket = await connectSocket();
         socketRef.current = socket;

         if (!socket) {
            console.log(
               "[CHAT] Socket connection failed — using REST API only",
            );
            return;
         }

         // Join this match's room to receive messages
         socket.emit("join:matches", [matchId]);
         console.log(`[CHAT] Joined socket room: match:${matchId}`);

         // Listen for incoming messages
         socket.on("message:new", (msg) => {
            console.log(
               `[CHAT] Socket received message:new for matchId: ${msg.matchId}`,
            );
            if (msg.matchId.toString() === matchId.toString()) {
               dispatch(addMessage({ matchId, message: msg }));
               scrollToBottom();
            }
         });

         // Listen for typing indicators
         socket.on("typing:start", ({ matchId: mid }) => {
            if (mid.toString() === matchId.toString()) {
               setTheirTyping(true);
            }
         });
         socket.on("typing:stop", ({ matchId: mid }) => {
            if (mid.toString() === matchId.toString()) {
               setTheirTyping(false);
            }
         });
      } catch (err) {
         console.error("[CHAT] Socket setup error:", err.message);
      }
   };

   const scrollToBottom = () => {
      setTimeout(() => {
         flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
   };

   const handleTyping = (text) => {
      setInputText(text);

      // Emit typing:start
      if (text.length > 0) {
         emitTypingStart(matchId);
         // Clear previous timeout and set new one to stop typing
         clearTimeout(typingTimeout.current);
         typingTimeout.current = setTimeout(() => {
            emitTypingStop(matchId);
         }, 2000);
      } else {
         emitTypingStop(matchId);
      }
   };

   const handleSend = () => {
      const text = inputText.trim();
      if (!text) return;

      // Create optimistic message (show immediately before server confirms)
      const tempId = `temp_${matchId}_${++tempIdCounter.current}`;
      const optimisticMsg = {
         _id: tempId,
         text,
         sender: { _id: currentUser?.id },
         createdAt: new Date().toISOString(),
         pending: true, // we can show a sending indicator with this flag
      };

      // Add to Redux immediately
      dispatch(addMessage({ matchId, message: optimisticMsg }));
      setInputText("");
      emitTypingStop(matchId);
      scrollToBottom();

      // Send via Socket.io
      console.log(`[CHAT] Sending message: "${text.substring(0, 30)}..."`);
      sendSocketMessage(matchId, text, tempId, (ack) => {
         if (ack?.error) {
            console.error("[CHAT] Message send error:", ack.error);
         } else {
            console.log(
               `[CHAT] Message delivered, messageId: ${ack?.messageId}`,
            );
         }
      });
   };

   const isMyMessage = (msg) => {
      const senderId = (msg.sender?._id || msg.sender)?.toString();
      const myId = currentUser?.id?.toString();
      return senderId === myId;
   };

   const renderMessage = ({ item }) => {
      const mine = isMyMessage(item);
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
                  {item.pending ? " ⏳" : ""}
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
         {/* Header */}
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
            <TouchableOpacity style={styles.kundliBtn}>
               <Text style={styles.kundliBtnText}>🔮</Text>
            </TouchableOpacity>
         </View>

         {/* Messages */}
         {chatLoading ? (
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
               showsVerticalScrollIndicator={false}
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
                        Say hello to {matchInfo?.name || "your match"}!
                     </Text>
                     <Text style={styles.emptyChatSub}>
                        You're cosmically connected. Break the ice ✨
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

         {/* Input bar */}
         <View style={styles.inputBar}>
            <TextInput
               style={styles.input}
               placeholder="Type a message..."
               placeholderTextColor={COLORS.textDim}
               value={inputText}
               onChangeText={handleTyping}
               multiline
               maxLength={1000}
               returnKeyType="default"
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
      padding: SPACING.md,
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
      fontFamily: FONTS.bodyBold,
      fontSize: 18,
      color: COLORS.textPrimary,
      marginBottom: SPACING.xs,
   },
   emptyChatSub: {
      fontFamily: FONTS.body,
      fontSize: 13,
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
