import React, { useEffect, useState, useContext, useRef } from "react";
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
  Animated,
} from "react-native";
import axios from "axios";
import io from "socket.io-client";
import { API_BASE_URL } from "../../apiConfig";
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [claimedPromoData, setClaimedPromoData] = useState(null);
  const [claimedPromos, setClaimedPromos] = useState({});
  
  // New state for success modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [redeemedPromoTitle, setRedeemedPromoTitle] = useState("");
  const [checkmarkScale] = useState(new Animated.Value(0));
  
  // ✅ Add refs to track current state for socket handlers
  const qrModalVisibleRef = useRef(false);
  const claimedPromoDataRef = useRef(null);
  
  const {
    customer,
    logout,
    loading: contextLoading,
  } = useContext(CustomerContext);
  const [socket, setSocket] = useState(null);

  // ✅ Update refs whenever state changes
  useEffect(() => {
    qrModalVisibleRef.current = qrModalVisible;
  }, [qrModalVisible]);

  useEffect(() => {
    claimedPromoDataRef.current = claimedPromoData;
  }, [claimedPromoData]);

  useEffect(() => {
    if (customer?.token) {
      fetchPromos();
      fetchClaimedPromos();
      setupSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [customer]);

  useEffect(() => {
    console.log("📊 claimedPromos updated:", Object.keys(claimedPromos).length, "claims");
    Object.entries(claimedPromos).forEach(([promoId, claim]) => {
      console.log(`  Promo ${promoId}:`, {
        isRedeemed: claim.isRedeemed,
        claimId: claim.claimId
      });
    });
  }, [claimedPromos]);

  const setupSocket = () => {
    if (!customer?.token || !customer?.id) {
      console.warn("Cannot setup socket: missing customer token or id");
      return;
    }

    const newSocket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: { token: customer.token },
    });

    newSocket.on("connect", () => {
      const roomName = `customer-${customer.id}`;
      console.log("✅ Socket connected:", newSocket.id);
      console.log("👤 Customer ID:", customer.id);
      console.log("🚪 Joining room:", roomName);
      
      // Join the customer-specific room
      newSocket.emit("join-room", roomName);
      
      // Confirm room join (if your backend sends confirmation)
      newSocket.on("room-joined", (data) => {
        console.log("✅ Successfully joined room:", data);
      });
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    newSocket.on("promoUpdate", (data) => {
      console.log("🔄 Promo update received:", data);
      fetchPromos();
    });

    newSocket.on("promoClaimed", (data) => {
      console.log("✨ You claimed promo:", data);
      
      setClaimedPromos(prev => ({
        ...prev,
        [data.promoId]: data.claim
      }));
      
      fetchPromos();
    });

    // Enhanced promoRedeemed handler with auto-close QR and success modal
    newSocket.on("promoRedeemed", (data) => {
      console.log("🎉 === PROMO REDEEMED EVENT RECEIVED ===");
      console.log("Event data:", JSON.stringify(data, null, 2));
      
      // ✅ Use refs to get current state values
      const isModalOpen = qrModalVisibleRef.current;
      const currentClaimData = claimedPromoDataRef.current;
      
      console.log("📍 Ref values at event time:");
      console.log("  - qrModalVisibleRef.current:", isModalOpen);
      console.log("  - claimedPromoDataRef.current:", currentClaimData);
      console.log("  - Has claim data:", !!currentClaimData);
      console.log("  - Event promoId:", data.promoId);
      console.log("  - Event claimId:", data.claimId);

      // Get promo title
      const promoTitle = currentClaimData?.promoTitle || 'Promo';

      // Update the claimed promos state
      setClaimedPromos(prev => {
        const updated = {
          ...prev,
          [data.promoId]: {
            ...prev[data.promoId],
            isRedeemed: true,
            redeemedAt: data.redeemedAt,
          }
        };
        return updated;
      });

      // IMMEDIATELY check and close if modal is open
      console.log("🔒 Checking if we should close modal...");
      console.log("   isModalOpen:", isModalOpen);
      console.log("   currentClaimData exists:", !!currentClaimData);
      
      // Simplified check - if ANY modal is open, close it
      if (isModalOpen) {
        console.log("✅ CLOSING QR MODAL NOW!");
        
        // Close QR modal immediately
        setQrModalVisible(false);
        setClaimedPromoData(null);
        
        // Set the redeemed promo title for success modal
        setRedeemedPromoTitle(promoTitle);
        
        // Show success modal after a brief delay
        setTimeout(() => {
          console.log("✅ SHOWING SUCCESS MODAL");
          setSuccessModalVisible(true);
          animateCheckmark();
        }, 400);
      } else {
        console.log("❌ QR modal NOT open - isModalOpen is false");
        console.log("   This means the ref wasn't updated or modal wasn't actually open");
      }

      // Always refresh the promo list
      fetchPromos();
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    setSocket(newSocket);
  };

  // Animate checkmark
  const animateCheckmark = () => {
    checkmarkScale.setValue(0);
    Animated.spring(checkmarkScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
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

  const fetchClaimedPromos = async () => {
    if (!customer?.token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/customer/claimed-promos`,
        {
          headers: { Authorization: `Bearer ${customer.token}` },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        const claimedMap = {};
        response.data.data.forEach((claim) => {
          claimedMap[claim.promoId] = claim;
        });
        setClaimedPromos(claimedMap);
      }
    } catch (error) {
      console.error("Error fetching claimed promos:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPromos();
    fetchClaimedPromos();
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

    const claimData = claimedPromos[promoId];
    if (claimData) {
      if (claimData.isRedeemed) {
        Alert.alert("Already Claimed", "This promo has already been redeemed!");
        return;
      }
      handleViewQR(promoId);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/customer/claim-promo/${promoId}`,
        {},
        { headers: { Authorization: `Bearer ${customer.token}` } }
      );

      if (response.data.success) {
        const claimData = {
          ...response.data.data,
          promoId: promoId,
          promoTitle: promos.find(p => p.promoId === promoId)?.title || 'Promo'
        };
        
        setClaimedPromos(prev => ({
          ...prev,
          [promoId]: claimData
        }));
        
        setClaimedPromoData(claimData);
        setQrModalVisible(true);
        
        // ✅ Manually update refs immediately
        qrModalVisibleRef.current = true;
        claimedPromoDataRef.current = claimData;
        
        fetchPromos();
      } else {
        Alert.alert("Failed", response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes("claim limit")) {
        await fetchClaimedPromos();
        setTimeout(() => {
          if (claimedPromos[promoId]) {
            handleViewQR(promoId);
          } else {
            Alert.alert("Info", "You have already claimed this promo");
          }
        }, 500);
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Could not claim promo"
        );
      }
    }
  };

  const handleViewQR = (promoId) => {
    const claimData = claimedPromos[promoId];
    console.log("🔍 handleViewQR called for promoId:", promoId);
    console.log("🔍 claimData:", claimData);
    
    if (claimData) {
      if (claimData.isRedeemed) {
        Alert.alert("Already Claimed", "This promo has already been redeemed!");
        return;
      }
      
      const dataToSet = {
        ...claimData,
        promoId: promoId,
        promoTitle: promos.find(p => p.promoId === promoId)?.title || 'Promo'
      };
      
      console.log("🔍 Setting claimedPromoData:", dataToSet);
      setClaimedPromoData(dataToSet);
      setQrModalVisible(true);
      
      // ✅ Manually update refs immediately (don't wait for useEffect)
      qrModalVisibleRef.current = true;
      claimedPromoDataRef.current = dataToSet;
      
      console.log("🔍 QR Modal should now be visible");
      console.log("🔍 qrModalVisibleRef.current:", qrModalVisibleRef.current);
      console.log("🔍 claimedPromoDataRef.current:", claimedPromoDataRef.current);
    }
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setClaimedPromoData(null);
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    setRedeemedPromoTitle("");
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

  const renderPromo = ({ item }) => {
    const claimData = claimedPromos[item.promoId];
    const isClaimed = !!claimData;
    const isRedeemed = claimData?.isRedeemed || false;
    
    return (
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
          {isClaimed && (
            <View style={isRedeemed ? styles.redeemedBadge : styles.claimedBadge}>
              <Text style={styles.claimedBadgeText}>
                {isRedeemed ? "claimed" : "qr generated"}
              </Text>
            </View>
          )}
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
            style={
              isRedeemed 
                ? styles.redeemedButton 
                : isClaimed 
                  ? styles.viewQrButton 
                  : styles.claimButton
            }
            onPress={() => handleClaimPromo(item.promoId)}
            disabled={isRedeemed}
          >
            <Text style={
              isRedeemed 
                ? styles.redeemedButtonText 
                : isClaimed 
                  ? styles.viewQrButtonText 
                  : styles.claimButtonText
            }>
              {isRedeemed ? "Claimed" : isClaimed ? "View QR Code" : "Generate QR Code"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
                extraData={claimedPromos} 
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
              <Text style={styles.modalTitle}>Your Promo QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeQrModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {claimedPromoData && (
              <View style={styles.modalContent}>
                <Text style={styles.claimedPromoTitle}>
                  {claimedPromoData.promoTitle}
                </Text>

                {claimedPromoData.qrCode && !claimedPromoData.isRedeemed && (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrLabel}>
                      Show this QR code to redeem:
                    </Text>
                    <QRCode
                      value={claimedPromoData.qrCode}
                      size={200}
                    />
                  </View>
                )}

                {claimedPromoData.isRedeemed && (
                  <View style={styles.redeemedContainer}>
                    <Text style={styles.redeemedText}>✓ Redeemed</Text>
                    <Text style={styles.redeemedSubtext}>
                      This promo has been successfully claimed
                    </Text>
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
                  {claimedPromoData.redeemedAt && (
                    <Text style={styles.claimDetailText}>
                      Redeemed: {formatDateTime(claimedPromoData.redeemedAt)}
                    </Text>
                  )}
                  {claimedPromoData.expiresAt && !claimedPromoData.isRedeemed && (
                    <Text style={styles.claimDetailText}>
                      Expires: {formatDateTime(claimedPromoData.expiresAt)}
                    </Text>
                  )}
                </View>

                {!claimedPromoData.isRedeemed && (
                  <Text style={styles.instructionText}>
                    Present this QR code at the business to redeem your promo!
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Modal - Shows after QR is scanned */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <Animated.View 
              style={[
                styles.checkmarkContainer,
                { transform: [{ scale: checkmarkScale }] }
              ]}
            >
              <Text style={styles.checkmark}>✓</Text>
            </Animated.View>
            
            <Text style={styles.successTitle}>Promo Claimed!</Text>
            <Text style={styles.successMessage}>
              Your promo "{redeemedPromoTitle}" has been successfully redeemed.
            </Text>
            
            <TouchableOpacity
              style={styles.successButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.successButtonText}>Great!</Text>
            </TouchableOpacity>
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
  claimedBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  redeemedBadge: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
  viewQrButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  viewQrButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  redeemedButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  redeemedButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // QR Modal Styles
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
  redeemedContainer: {
    alignItems: "center",
    padding: 30,
    marginBottom: 20,
  },
  redeemedText: {
    fontSize: 48,
    color: "#28a745",
    fontWeight: "bold",
    marginBottom: 10,
  },
  redeemedSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
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
  // Success Modal Styles
  successModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    width: width * 0.85,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 50,
    color: "#fff",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: "#4F0CBD",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});