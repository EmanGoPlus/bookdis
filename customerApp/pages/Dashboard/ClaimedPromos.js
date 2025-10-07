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
  TextInput,
  Dimensions,
} from "react-native";
import axios from "axios";
import { CustomerContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

const ClaimedPromos = () => {
  const { customer } = useContext(CustomerContext);
  const token = customer?.token || "";
  const navigation = useNavigation();

  const [claimedPromos, setClaimedPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Share modal states
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Fetch claimed promos from API
  const fetchClaimedPromos = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching claimed promos...");

      const res = await axios.get(
        `${API_BASE_URL}/api/user/customer/my-promos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Claimed promos:", res.data.data?.length || 0);
      
      // ✅ Filter out shared promos
      const unsharedPromos = (res.data.data || []).filter(
        (promo) => !promo.isShared
      );
      
      setClaimedPromos(unsharedPromos);
    } catch (err) {
      console.error("❌ Error fetching claimed promos:", err);
      Alert.alert("Error", "Failed to fetch claimed promos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.id && token) {
      fetchClaimedPromos();
    }
  }, [customer?.id, token]);

  // Open share modal
  const handleSharePress = (promo) => {
    console.log("📤 Opening share modal for:", promo.promoTitle);

    if (!promo.isRedeemed) {
      Alert.alert(
        "Cannot Share",
        "You must redeem this promo first before sharing"
      );
      return;
    }

    setSelectedPromo(promo);
    setPhoneNumber("");
    setRecipientInfo(null);
    setShareModalVisible(true);
  };

  // Close share modal
  const closeShareModal = () => {
    setShareModalVisible(false);
    setSelectedPromo(null);
    setPhoneNumber("");
    setRecipientInfo(null);
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModalVisible(false);
    setRecipientInfo(null);
  };

  // Verify recipient before sharing
  const handleVerifyRecipient = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid phone number (11 digits starting with 09)"
      );
      return;
    }

    setVerifying(true);

    try {
      console.log("🔍 Verifying recipient:", phoneNumber);

      const res = await axios.post(
        `${API_BASE_URL}/api/user/customer/verify-recipient`,
        { phone: phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recipient found:", res.data.data);

      setRecipientInfo(res.data.data);
      setShareModalVisible(false);
      setConfirmModalVisible(true);
    } catch (err) {
      console.error("❌ Verification error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Recipient not found"
      );
    } finally {
      setVerifying(false);
    }
  };

  // Confirm and share promo
  const handleConfirmShare = async () => {
    setSharing(true);

    try {
      console.log("📤 Sharing promo:", {
        claimId: selectedPromo.claimId,
        phone: phoneNumber,
      });

      const res = await axios.post(
        `${API_BASE_URL}/api/user/customer/share-promo`,
        {
          claimId: selectedPromo.claimId,
          toCustomerPhone: phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Share response:", res.data);

      closeConfirmModal();
      closeShareModal();
      
      Alert.alert(
        "Success!",
        `Promo "${selectedPromo.promoTitle}" has been shared with ${recipientInfo.firstName}!`
      );

      // Refresh the list
      fetchClaimedPromos();
    } catch (err) {
      console.error("❌ Share error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to share promo"
      );
    } finally {
      setSharing(false);
    }
  };

  // Render single promo card
  const renderPromo = ({ item }) => {
    const logoUri = item.businessLogo
      ? `${API_BASE_URL.replace(/\/$/, "")}/${item.businessLogo.replace(/^\//, "")}`
      : null;

    const getBadge = () => {
      if (item.isRedeemed) {
        return (
          <View style={[styles.badge, { backgroundColor: "#28a745" }]}>
            <Text style={styles.badgeText}>✓ Ready to Share</Text>
          </View>
        );
      }
      return (
        <View style={[styles.badge, { backgroundColor: "#6c757d" }]}>
          <Text style={styles.badgeText}>🎫 Not Redeemed</Text>
        </View>
      );
    };

    const canShare = item.isRedeemed;

    return (
      <View style={styles.card}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Text style={styles.logoPlaceholderText}>
              {item.businessName?.charAt(0) || "?"}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.title}>{item.promoTitle}</Text>
          <Text style={styles.business}>{item.businessName}</Text>
          {getBadge()}
        </View>

        <TouchableOpacity
          style={[
            styles.shareButton,
            !canShare && styles.shareButtonDisabled,
          ]}
          onPress={() => handleSharePress(item)}
          disabled={!canShare}
        >
          <Svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 -960 960 960"
            fill="#fff"
            style={{ marginRight: 6 }}
          >
            <Path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Z" />
          </Svg>
          <Text style={styles.shareText}>
            {canShare ? "Share" : "Redeem First"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F0CBD" />
        <Text style={styles.loadingText}>Loading your promos...</Text>
      </View>
    );
  }

  // Empty state
  if (!claimedPromos.length) {
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
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyText}>No promos available to share</Text>
          <Text style={styles.emptySubtext}>
            Redeem a promo first to share it with friends
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
        <Text style={styles.headerTitle}>My Promos</Text>
        <Text style={styles.headerSubtitle}>
          {claimedPromos.length}{" "}
          {claimedPromos.length === 1 ? "promo" : "promos"} available
        </Text>
      </View>

      {/* Claimed promos list */}
      <FlatList
        data={claimedPromos}
        keyExtractor={(item) =>
          item.claimId?.toString() || Math.random().toString()
        }
        renderItem={renderPromo}
        contentContainerStyle={styles.listContainer}
      />

      {/* Share Modal - Enter Phone Number */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeShareModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Promo</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeShareModal}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={48}
                  height={48}
                  viewBox="0 -960 960 960"
                  fill="#4F0CBD"
                >
                  <Path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Z" />
                </Svg>
              </View>

              <Text style={styles.modalSubtitle}>
                Share "{selectedPromo?.promoTitle}" with a friend
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Recipient's Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09XXXXXXXXX"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                  editable={!verifying}
                />
                <Text style={styles.inputHint}>
                  Must be 11 digits starting with 09
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeShareModal}
                  disabled={verifying}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    verifying && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleVerifyRecipient}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal - Verify Recipient */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Sharing</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeConfirmModal}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.confirmIconContainer}>
                <Svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={64}
                  height={64}
                  viewBox="0 -960 960 960"
                  fill="#4F0CBD"
                >
                  <Path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
                </Svg>
              </View>

              <Text style={styles.confirmTitle}>Share promo with:</Text>

              <View style={styles.recipientCard}>
                <Text style={styles.recipientName}>
                  {recipientInfo?.firstName} {recipientInfo?.lastName}
                </Text>
                <Text style={styles.recipientPhone}>{phoneNumber}</Text>
              </View>

              <Text style={styles.confirmWarning}>
                Once shared, this promo will be removed from your list and sent to the recipient.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeConfirmModal}
                  disabled={sharing}
                >
                  <Text style={styles.cancelButtonText}>Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    sharing && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmShare}
                  disabled={sharing}
                >
                  {sharing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ClaimedPromos;

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
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  logoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4F0CBD",
  },
  logoPlaceholderText: {
    fontSize: 20,
    fontWeight: "600",
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
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    backgroundColor: "#999",
  },
  shareText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  backContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: "#666",
    fontWeight: "bold",
  },
  modalContent: {
    padding: 24,
  },
  modalIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#28a745",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#999",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmIconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  recipientCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#4F0CBD",
  },
  recipientName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  recipientPhone: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  confirmWarning: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
    fontStyle: "italic",
  },
});