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
  Modal,
  Dimensions,
} from "react-native";
import axios from "axios";
import { CustomerContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";

const { width } = Dimensions.get("window");

const RecievedPromos = () => {
  const { customer } = useContext(CustomerContext);
  const token = customer?.token || "";
  const navigation = useNavigation();

  const [receivedPromos, setReceivedPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);

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
    setSelectedPromo(promo);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setSelectedPromo(null);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

const renderPromo = ({ item }) => {
  console.log("🎨 Rendering promo item:", item);

  const profileUri = item.senderProfile
    ? `${API_BASE_URL.replace(/\/$/, "")}/${item.senderProfile.replace(/^\//, "")}`
    : null;

  // Theme-based colors
  const getThemeColor = (theme) => {
    switch (theme?.toLowerCase()) {
      case 'love':
        return '#FF1744'; // Red/Pink
      case 'sorry':
        return '#FFC107'; // Amber/Yellow
      case 'congratulations':
        return '#4CAF50'; // Green
      case 'friendship':
        return '#2196F3'; // Blue
      case 'neutral':
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const themeColor = getThemeColor(item.theme);

  // Theme emoji
  const getThemeEmoji = (theme) => {
    switch (theme?.toLowerCase()) {
      case 'love':
        return '❤️';
      case 'sorry':
        return '😔';
      case 'congratulations':
        return '🎉';
      case 'friendship':
        return '🤝';
      case 'neutral':
      default:
        return '🎁';
    }
  };

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: themeColor }]}>
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
        {item.theme && (
          <View style={styles.themeContainer}>
            <Text style={styles.themeEmoji}>{getThemeEmoji(item.theme)}</Text>
            <Text style={[styles.themeText, { color: themeColor }]}>
              {item.theme.charAt(0).toUpperCase() + item.theme.slice(1)}
            </Text>
          </View>
        )}
        {item.message && (
          <Text style={styles.messageText} numberOfLines={2}>
            "{item.message}"
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.qrButton, { backgroundColor: themeColor }]}
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

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeQrModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shared Promo QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeQrModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

{selectedPromo && (
  <View style={styles.modalContent}>
    <Text style={styles.promoTitleModal}>
      {selectedPromo.promoTitle || "Untitled Promo"}
    </Text>
    <Text style={styles.businessNameModal}>
      {selectedPromo.businessName || "Unknown Business"}
    </Text>

    {selectedPromo.qrCode ? (
      <View style={styles.qrContainer}>
        <Text style={styles.qrLabel}>
          Show this QR code to redeem:
        </Text>
        <QRCode value={selectedPromo.qrCode} size={200} />
      </View>
    ) : (
      <View style={styles.noQrContainer}>
        <Text style={styles.noQrText}>
          No QR code available for this promo
        </Text>
      </View>
    )}

    <View style={styles.promoDetails}>
      <Text style={styles.detailLabel}>Shared by:</Text>
      <Text style={styles.detailValue}>
        {selectedPromo.senderName || "Unknown"}
      </Text>
      
      {selectedPromo.theme && (
        <>
          <Text style={styles.detailLabel}>Theme:</Text>
          <Text style={styles.detailValue}>
            {selectedPromo.theme}
          </Text>
        </>
      )}

      {selectedPromo.message && (
        <>
          <Text style={styles.detailLabel}>Message:</Text>
          <Text style={styles.detailValue}>
            {selectedPromo.message}
          </Text>
        </>
      )}
      
      {selectedPromo.sharedAt && (
        <>
          <Text style={styles.detailLabel}>Shared on:</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(selectedPromo.sharedAt)}
          </Text>
        </>
      )}
    </View>

    {selectedPromo.qrCode && (
      <Text style={styles.instructionText}>
        Present this QR code at the business to redeem your promo!
      </Text>
    )}
  </View>
)}
          </View>
        </View>
      </Modal>
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  qrText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  backContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
   themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  themeEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "bold",
  },
  modalContent: {
    padding: 20,
    alignItems: "center",
  },
  promoTitleModal: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  businessNameModal: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  qrLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  noQrContainer: {
    alignItems: "center",
    padding: 40,
    marginBottom: 20,
  },
  noQrText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  promoDetails: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: "#4F0CBD",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 20,
  },
});