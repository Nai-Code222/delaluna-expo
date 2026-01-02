
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

type StatusState = "pending" | "processing" | "complete" | "error" | string;

interface ConnectionStatus {
  state: StatusState;
  type?: string;
  message?: string;
}

interface PersonInfo {
  firstName?: string;
  lastName?: string;
  sun?: string;
  moon?: string;
  rising?: string;
  pronouns?: string;
}

interface CompatibilityScores {
  interest: number;
  communication: number;
  resonation: number;
  trust?: number;
  longevity?: number;
  sexAndChemistry?: number;
  [key: string]: number | undefined;
}

interface CompatibilityReport {
  title: string;
  summary: string;
  closing: string;
  overallCompatibility: number | null;
  userPronouns?: string | null;
  partnerPronouns?: string | null;
  scores: CompatibilityScores;
  createdAt?: string;
}

interface ConnectionDoc {
  connectionId: string;
  relationshipType?: string;
  status?: ConnectionStatus;
  firstPerson?: PersonInfo;
  secondPerson?: PersonInfo;
  compatibility?: CompatibilityReport;
}


// export default function ConnectionViewScreen() {
//   const router = useRouter();
//   const { connectionId } = useLocalSearchParams<{ connectionId?: string }>();
//   const [connection, setConnection] = useState<ConnectionDoc | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const id =
//       typeof connectionId === "string" ? connectionId : connectionId?.[0];

//     const user = auth.currentUser;

//     if (!id || !user) {
//       setError("Missing connection or user. Please go back and try again.");
//       setLoading(false);
//       return;
//     }

//     const ref = doc(db, "users", user.uid, "connections", id);

//     const unsub = onSnapshot(
//       ref,
//       (snap) => {
//         if (!snap.exists()) {
//           setError("Connection not found.");
//           setLoading(false);
//           return;
//         }
//         const data = snap.data() as any;
//         setConnection({
//           connectionId: data.connectionId ?? id,
//           relationshipType: data.relationshipType,
//           status: data.status,
//           firstPerson: data.firstPerson,
//           secondPerson: data.secondPerson,
//           compatibility: data.compatibility,
//         });
//         setLoading(false);
//       },
//       (err) => {
//         console.error("Failed to subscribe to connection:", err);
//         setError("Something went wrong loading this connection.");
//         setLoading(false);
//       }
//     );

//     return () => unsub();
//   }, [connectionId]);

//   const statusLabel = (() => {
//     const state = connection?.status?.state;
//     switch (state) {
//       case "pending":
//         return "Preparing your compatibility reading…";
//       case "processing":
//         return "Channeling the stars… almost there ✨";
//       case "complete":
//         return "Your compatibility reading is ready";
//       case "error":
//         return "We ran into an issue generating this reading.";
//       default:
//         return state ? String(state) : "Getting things set up…";
//     }
//   })();

//   const report = connection?.compatibility;

//   return (
//     <View style={styles.container}>
//       {loading ? (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" />
//           <Text style={styles.statusText}>Loading connection…</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.centered}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       ) : !connection ? (
//         <View style={styles.centered}>
//           <Text style={styles.errorText}>No connection data.</Text>
//         </View>
//       ) : (
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header / Names */}
//           <View style={styles.card}>
//             <Text style={styles.label}>Connection</Text>
//             <Text style={styles.names}>
//               {connection.firstPerson?.firstName}{" "}
//               {connection.firstPerson?.lastName}{" "}
//               <Text style={styles.pronouns}>
//                 {connection.firstPerson?.pronouns
//                   ? `(${connection.firstPerson.pronouns})`
//                   : ""}
//               </Text>
//             </Text>
//             <Text style={styles.andLabel}>×</Text>
//             <Text style={styles.names}>
//               {connection.secondPerson?.firstName}{" "}
//               {connection.secondPerson?.lastName}{" "}
//               <Text style={styles.pronouns}>
//                 {connection.secondPerson?.pronouns
//                   ? `(${connection.secondPerson.pronouns})`
//                   : ""}
//               </Text>
//             </Text>

//             {connection.relationshipType ? (
//               <Text style={styles.relationship}>
//                 {connection.relationshipType.toUpperCase()}
//               </Text>
//             ) : null}
//           </View>

//           {/* Signs summary */}
//           <View style={styles.card}>
//             <Text style={styles.label}>Big Three</Text>
//             <View style={styles.signRow}>
//               <View style={styles.signCol}>
//                 <Text style={styles.signName}>You</Text>
//                 <Text style={styles.signLine}>
//                   ☀️ {connection.firstPerson?.sun || "—"}
//                 </Text>
//                 <Text style={styles.signLine}>
//                   🌙 {connection.firstPerson?.moon || "—"}
//                 </Text>
//                 <Text style={styles.signLine}>
//                   ⬆️ {connection.firstPerson?.rising || "—"}
//                 </Text>
//               </View>
//               <View style={styles.signCol}>
//                 <Text style={styles.signName}>Them</Text>
//                 <Text style={styles.signLine}>
//                   ☀️ {connection.secondPerson?.sun || "—"}
//                 </Text>
//                 <Text style={styles.signLine}>
//                   🌙 {connection.secondPerson?.moon || "—"}
//                 </Text>
//                 <Text style={styles.signLine}>
//                   ⬆️ {connection.secondPerson?.rising || "—"}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Status + Report */}
//           {!report ? (
//             <View style={styles.card}>
//               <Text style={styles.label}>Compatibility</Text>
//               <Text style={styles.statusText}>{statusLabel}</Text>
//               <View style={styles.inlineRow}>
//                 <ActivityIndicator size="small" />
//                 <Text style={styles.subtle}>
//                   You can close this screen — the reading will be saved here
//                   once it’s ready.
//                 </Text>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.card}>
//               <Text style={styles.label}>Compatibility</Text>
//               <Text style={styles.title}>{report.title}</Text>
//               <Text style={styles.summary}>{report.summary}</Text>

//               {report.overallCompatibility != null && (
//                 <View style={styles.scoreBubble}>
//                   <Text style={styles.scoreLabel}>Overall Vibe</Text>
//                   <Text style={styles.scoreValue}>
//                     {report.overallCompatibility} / 100
//                   </Text>
//                 </View>
//               )}

//               {/* Scores grid */}
//               <View style={styles.scoresGrid}>
//                 {Object.entries(report.scores || {}).map(([key, value]) => {
//                   if (typeof value !== "number") return null;
//                   return (
//                     <View key={key} style={styles.scoreItem}>
//                       <Text style={styles.scoreKey}>{key}</Text>
//                       <Text style={styles.scoreNum}>{value}</Text>
//                     </View>
//                   );
//                 })}
//               </View>

//               {report.closing ? (
//                 <Text style={styles.closing}>{report.closing}</Text>
//               ) : null}
//             </View>
//           )}
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#050816" },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//   },
//   centered: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 32,
//   },
//   card: {
//     backgroundColor: "rgba(15, 23, 42, 0.96)",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 12,
//     color: "#9CA3AF",
//     textTransform: "uppercase",
//     letterSpacing: 1,
//     marginBottom: 4,
//   },
//   names: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#F9FAFB",
//   },
//   andLabel: {
//     fontSize: 16,
//     color: "#9CA3AF",
//     marginVertical: 4,
//   },
//   pronouns: {
//     fontSize: 14,
//     color: "#E5E7EB",
//   },
//   relationship: {
//     marginTop: 8,
//     fontSize: 12,
//     color: "#F97316",
//     fontWeight: "600",
//     letterSpacing: 1,
//   },
//   signRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 8,
//   },
//   signCol: {
//     flex: 1,
//   },
//   signName: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#E5E7EB",
//     marginBottom: 4,
//   },
//   signLine: {
//     fontSize: 14,
//     color: "#D1D5DB",
//   },
//   statusText: {
//     marginTop: 8,
//     fontSize: 14,
//     color: "#E5E7EB",
//   },
//   subtle: {
//     marginTop: 8,
//     fontSize: 12,
//     color: "#9CA3AF",
//     flex: 1,
//   },
//   inlineRow: {
//     marginTop: 8,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#F9FAFB",
//     marginBottom: 8,
//   },
//   summary: {
//     fontSize: 14,
//     color: "#E5E7EB",
//     marginBottom: 12,
//   },
//   scoreBubble: {
//     alignSelf: "flex-start",
//     backgroundColor: "#111827",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 999,
//     marginBottom: 12,
//   },
//   scoreLabel: {
//     fontSize: 10,
//     color: "#9CA3AF",
//     textTransform: "uppercase",
//   },
//   scoreValue: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#FBBF24",
//   },
//   scoresGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     marginBottom: 12,
//   },
//   scoreItem: {
//     minWidth: 100,
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: "#020617",
//   },
//   scoreKey: {
//     fontSize: 11,
//     color: "#9CA3AF",
//     textTransform: "capitalize",
//   },
//   scoreNum: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#F9FAFB",
//   },
//   closing: {
//     fontSize: 14,
//     color: "#E5E7EB",
//     marginTop: 8,
//   },
//   errorText: {
//     fontSize: 14,
//     color: "#FCA5A5",
//     textAlign: "center",
//   },
// });