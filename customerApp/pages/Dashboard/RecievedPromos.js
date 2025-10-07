import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { CustomerContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";

const RecievedPromos = () => {
  const { customer } = useContext(CustomerContext);
  const token = customer?.token || "";
  const navigation = useNavigation();

  const [receivedPromos, setReceivedPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch received promos
  const fetchReceivedPromos = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching received promos for customer:", customer?.id);

      const res = await axios.get(
        `${API_BASE_URL}/api/user/customer/recieved-promos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Received promos response:", res.data);
      console.log("📦 Data count:", res.data.data?.length || 0);

      setReceivedPromos(res.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching received promos:", err);
      console.error("Error response:", err.response?.data);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to fetch received promos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.id && token) {
      fetchReceivedPromos();
    }
  }, [customer?.id, token]);

  const handleShowQR = (promo) => {
    console.log("📱 Showing QR for promo:", promo);
    navigation.navigate("ShowQRScreen", { promo });
  };

  const handleShare = (promo) => {
    console.log("📤 Sharing promo:", promo);
    Alert.alert("Shared!", `Promo "${promo.promoTitle}" shared successfully!`);
  };

  const renderPromo = ({ item }) => {
    console.log("🎨 Rendering promo item:", item);

    const profileUri = item.senderProfile
      ? `${API_BASE_URL.replace(/\/$/, "")}/${item.senderProfile.replace(/^\//, "")}`
      : null;

    return (
      <View style={styles.card}>
        {profileUri ? (
          <Image
            source={{ uri: profileUri }}
            style={styles.profile}
            onError={(e) =>
              console.log("Image load error:", e.nativeEvent.error)
            }
          />
        ) : (
          <View style={[styles.profile, styles.profilePlaceholder]}>
            <Text style={styles.profilePlaceholderText}>
              {item.senderName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.title}>
            {item.promoTitle || "Untitled Promo"}
          </Text>
          <Text style={styles.business}>
            {item.businessName || "Unknown Business"}
          </Text>
          <Text style={styles.sender}>
            From: {item.senderName || "Unknown"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => handleShowQR(item)}
          >
            <Text style={styles.qrText}>Show QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F0CBD" />
        <Text style={styles.loadingText}>Loading received promos...</Text>
      </View>
    );
  }

  if (!receivedPromos.length) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.backContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 -960 960 960"
              fill="#333"
            >
              <Path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No received promos yet</Text>
          <Text style={styles.emptySubtext}>
            Promos shared by your friends will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Back Button */}
      <View style={styles.backContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 -960 960 960"
            fill="#333"
          >
            <Path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Received Promos</Text>
        <Text style={styles.headerSubtitle}>
          {receivedPromos.length}{" "}
          {receivedPromos.length === 1 ? "promo" : "promos"} shared with you
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={receivedPromos}
        keyExtractor={(item, index) =>
          item.sharedId?.toString() || index.toString()
        }
        renderItem={renderPromo}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default RecievedPromos;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    paddingVertical: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  profilePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4F0CBD",
  },
  profilePlaceholderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  business: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  sender: {
    fontSize: 12,
    color: "#4F0CBD",
    marginTop: 2,
    fontWeight: "500",
  },
  actions: {
    alignItems: "center",
  },
  qrButton: {
    backgroundColor: "#4F0CBD",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  qrText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  shareText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  backContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
});
