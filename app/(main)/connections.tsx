import React, { useContext, useEffect, useRef, useState, memo } from "react";
import { router } from "expo-router";
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { httpsCallable } from "firebase/functions";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import useRenderBackground from "@/hooks/useRenderBackground";
import HeaderNav from "@/components/component-utils/header-nav";
import AddConnectionButton from "@/components/buttons/add-connection-button.component";
import ConnectionListItem from "@/components/connection/connection-list-item.component";

// utilities
import { HEADER_HEIGHT } from "@/utils/responsive-header";
import splitConnectionId from "@/utils/splitConnectionId.util";

// backend
import AuthContext from "@/backend/auth-context";

// RN libs
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// responsive utils
import { scale, verticalScale, moderateScale } from "@/utils/responsive";
import { ThemeContext } from "../theme-context";
import { db, functions } from "../../firebaseConfig";

/** 🌀 Animated wrapper for each connection card */
const AnimatedConnectionItem = memo(
  ({ index, connection, onOpen, onDelete }: any) => {
    const itemFade = useRef(new Animated.Value(0)).current;
    const itemSlide = useRef(new Animated.Value(10)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemFade, {
          toValue: 1,
          duration: 300,
          delay: index * 70,
          useNativeDriver: true,
        }),
        Animated.timing(itemSlide, {
          toValue: 0,
          duration: 300,
          delay: index * 70,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const renderRightActions = () => (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(connection.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={moderateScale(22)} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
          <ConnectionListItem
            connection={connection}
            onPress={() => onOpen(connection.id)}
          />
        </Swipeable>
      </Animated.View>
    );
  }
);

export default function ConnectionsScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const renderBackground = useRenderBackground();

  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;

  const goToNewConnectionScreen = () =>
    router.replace("/(supporting)/single-connection-create.screen");

  // Fade animation
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // 🔥 Firestore listener
  useEffect(() => {
    if (!user?.uid) return;
    const ref = collection(db, "users", user.uid, "connections");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setConnections(data);
        setLoading(false);
      },
      (err) => {
        console.error("❌ Firestore listener error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleDeleteConnection = async (connectionId: string) => {
    Alert.alert(
      "Remove Connection",
      "Are you sure you want to remove this connection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const deleteFn = httpsCallable(functions, "deleteConnection");
              await deleteFn({ userId: user?.uid, connectionId });
              setConnections((prev) =>
                prev.filter((c) => c.id !== connectionId)
              );
            } catch (err) {
              console.error("❌ Error deleting connection:", err);
              Alert.alert("Error", "Failed to delete connection.");
            }
          },
        },
      ]
    );
  };

  const handleOpenConnection = () => {
    router.push("/(supporting)/single-connection-view.screen");
  };

  if (loading) {
    return renderBackground(
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const hasConnections = connections.length > 0;

  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav
        title="Connections"
        rightIconName={hasConnections ? "add" : undefined}
        onRightPress={hasConnections ? goToNewConnectionScreen : undefined}
      />

      {hasConnections ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.listContainer,
            {
              marginTop: HEADER_HEIGHT,
              paddingBottom: insets.bottom + verticalScale(60),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {connections.map((c, index) => (
            <AnimatedConnectionItem
              key={c.id}
              index={index}
              connection={c}
              onOpen={handleOpenConnection}
              onDelete={handleDeleteConnection}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.centered, { marginTop: HEADER_HEIGHT }]}>
          <AddConnectionButton onPress={goToNewConnectionScreen} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: scale(15),
    paddingTop: verticalScale(20),
  },
  deleteActionContainer: { justifyContent: "center" },
  deleteButton: {
    backgroundColor: "rgba(255,0,60,0.85)",
    justifyContent: "center",
    alignItems: "center",
    width: scale(90),
    height: "100%",
    borderTopRightRadius: moderateScale(10),
    borderBottomRightRadius: moderateScale(10),
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(15),
    marginTop: verticalScale(5),
  },
});
