import React, { useEffect, useState, useContext } from "react";
import { CustomerContext } from "../../context/AuthContext";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import axios from "axios";
import io from "socket.io-client";
import { API_BASE_URL } from "../../apiConfig";

const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [claimedPromoData, setClaimedPromoData] = useState(null);
  const {
    customer,
    logout,
    loading: contextLoading,
  } = useContext(CustomerContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (customer?.token) {
      fetchPromos();
      setupSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [customer]);

  const setupSocket = () => {
    if (!customer?.token) return;

    const newSocket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: { token: customer.token },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("promoUpdate", (data) => {
      console.log("Received promo update:", data);
      fetchPromos();
    });

    newSocket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
      if (
        error.message.includes("Authentication") ||
        error.message.includes("token")
      ) {
        console.log(
          "Socket auth failed - user will be auto-logged out by axios interceptor"
        );
      }
    });

    setSocket(newSocket);
  };

  const fetchPromos = async () => {
    if (!customer?.token) return;

    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/user/business/available-promos`,
        {
          headers: { Authorization: `Bearer ${customer.token}` },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setPromos(response.data.data);
      } else {
        setPromos([]);
        Alert.alert("Info", "No promos available at this time");
      }
    } catch (error) {
      console.error("Error fetching promos:", error);

      if (error.response?.status !== 401) {
        Alert.alert(
          "Error",
          "Could not fetch promos. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPromos();
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          if (socket) {
            socket.disconnect();
          }
          await logout();

        },
      },
    ]);
  };

  const handleClaimPromo = async (promoId) => {
    if (!customer?.token) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/customer/claim-promo/${promoId}`,
        {},
        { headers: { Authorization: `Bearer ${customer.token}` } }
      );

      if (response.data.success) {
        // Store the claimed promo data (including QR code)
        setClaimedPromoData({
          ...response.data.data,
          promoTitle: promos.find(p => p.promoId === promoId)?.title || 'Promo'
        });
        setQrModalVisible(true);
        fetchPromos(); // refresh list
      } else {
        Alert.alert("Failed", response.data.message);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Could not claim promo"
      );
    }
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setClaimedPromoData(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const renderPromo = ({ item }) => (
    <View style={styles.promoCard}>
      <View style={styles.businessHeader}>
        {item.logo && (
          <Image
            source={{ uri: `${API_BASE_URL}/${item.logo}` }}
            style={styles.businessLogo}
            resizeMode="cover"
          />
        )}
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>
            {item.businessName || "Business"}
          </Text>
          <Text style={styles.promoId}>Promo #{item.promoId}</Text>
        </View>
      </View>

      {item.imageUrl && (
        <Image
          source={{ uri: `${API_BASE_URL}/${item.imageUrl}` }}
          style={styles.promoImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.promoContent}>
        <Text style={styles.promoTitle}>{item.title || "Promo Title"}</Text>
        <Text style={styles.promoDescription}>
          {item.description || "Promo Description"}
        </Text>

        <View style={styles.dateContainer}>
          {item.startDate && (
            <Text style={styles.dateText}>
              From: {formatDate(item.startDate)}
            </Text>
          )}
          {item.endDate && (
            <Text style={styles.dateText}>
              Until: {formatDate(item.endDate)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.claimButton}
          onPress={() => handleClaimPromo(item.promoId)}
        >
          <Text style={styles.claimButtonText}>Claim Promo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (contextLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F0CBD" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Please login to continue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Welcome, {customer.firstName || customer.name}!
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F0CBD" />
            <Text style={styles.loadingText}>Loading Promos...</Text>
          </View>
        ) : (
          <>
            {promos.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No promos available</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchPromos}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={promos}
                keyExtractor={(item, index) =>
                  item.promoId?.toString() || index.toString()
                }
                renderItem={renderPromo}
                contentContainerStyle={styles.promosList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#4F0CBD"]}
                    tintColor="#4F0CBD"
                  />
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeQrModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Promo Claimed Successfully!</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeQrModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {claimedPromoData && (
              <View style={styles.modalContent}>
                <Text style={styles.claimedPromoTitle}>
                  {claimedPromoData.promoTitle}
                </Text>
                
                {/* QR Code */}
                {claimedPromoData.qrCode && (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrLabel}>Show this QR code to redeem:</Text>
                    <Image
                      source={{ uri: claimedPromoData.qrCode }}
                      style={styles.qrCode}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View style={styles.claimDetails}>
                  {claimedPromoData.claimId && (
                    <Text style={styles.claimDetailText}>
                      Claim ID: {claimedPromoData.claimId}
                    </Text>
                  )}
                  {claimedPromoData.claimedAt && (
                    <Text style={styles.claimDetailText}>
                      Claimed: {formatDateTime(claimedPromoData.claimedAt)}
                    </Text>
                  )}
                  {claimedPromoData.expiresAt && (
                    <Text style={styles.claimDetailText}>
                      Expires: {formatDateTime(claimedPromoData.expiresAt)}
                    </Text>
                  )}
                </View>

                <Text style={styles.instructionText}>
                  Present this QR code at the business to redeem your promo!
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  messageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#4F0CBD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  promosList: {
    padding: 16,
  },
  promoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  businessHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  businessLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  promoId: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  promoImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  promoContent: {
    padding: 16,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  claimButton: {
    backgroundColor: "#4F0CBD",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  claimButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
  claimedPromoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
  },
  claimDetails: {
    width: "100%",
    marginBottom: 20,
  },
  claimDetailText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#4F0CBD",
    textAlign: "center",
    fontWeight: "500",
  },
});