import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import ConnectionListItem from "./connection-list-item.component";
import { scale, verticalScale } from "@/src/utils/responsive";

interface ConnectionListProps {
  userId: string;
}

export default function ConnectionList({ userId }: ConnectionListProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 Real-time Firestore listener
  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "connections");
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          status: "pending",
          result: {},
          ...doc.data(),
        }));
        setConnections(data);
        setLoading(false);
      },
      (err) => {
        console.error("❌ Firestore listener error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Manual refresh logic (optional fallback)
  const fetchConnections = useCallback(async () => {
    if (!userId) return;
    try {
      const ref = collection(db, "users", userId, "connections");
      const snap = await getDocs(ref);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        status: "pending",
        result: {},
        ...doc.data(),
      }));
      setConnections(data);
    } catch (err) {
      console.error("❌ Error fetching connections:", err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConnections();
  };

  // 🌀 Loading state
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // 🪩 Empty state
  if (connections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No connections yet 🪩</Text>
        <Text style={styles.hint}>Tap “New Connection” to create one.</Text>
      </View>
    );
  }

  // 📜 List view
  return (
    <View style={styles.container}>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        contentContainerStyle={{ paddingBottom: verticalScale(40) }}
        renderItem={({ item }) => <ConnectionListItem connection={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(100),
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  hint: {
    color: "#C5AFFF",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
