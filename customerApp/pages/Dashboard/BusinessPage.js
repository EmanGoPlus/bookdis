import React, { useEffect, useState, useContext } from "react";
import { CustomerContext } from "../../context/AuthContext";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from "../../apiConfig";
import { useRoute, useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function BusinessProfile() {
  const route = useRoute();
  const navigation = useNavigation();
  const { businessId } = route.params; // passed from navigation
  
  const { customer } = useContext(CustomerContext);
  
  const [business, setBusiness] = useState(null);
  const [promos, setPromos] = useState([]);
  const [membership, setMembership] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (customer?.token && businessId) {
      fetchBusinessProfile();
    }
  }, [customer, businessId]);

  const fetchBusinessProfile = async () => {
    if (!customer?.token) return;

    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/user/business/profile/${businessId}?customerId=${customer.id}`,
        {
          headers: { Authorization: `Bearer ${customer.token}` },
        }
      );

      if (response.data.success) {
        const { business: businessData, promos: promosData, membership: membershipData, isMember: memberStatus } = response.data.data;
        
        setBusiness(businessData);
        setPromos(promosData);
        setMembership(membershipData);
        setIsMember(memberStatus);
      } else {
        Alert.alert("Error", "Failed to load business profile");
      }
    } catch (error) {
      console.error("Error fetching business profile:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Could not load business profile"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBusinessProfile();
  };

  const handleClaimPromo = (promoId) => {
    // Navigate to promo details or handle claim
    navigation.navigate("PromoDetails", { promoId, businessId });
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

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F0CBD" />
        <Text style={styles.loadingText}>Loading Business Profile...</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Business not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4F0CBD"]}
          tintColor="#4F0CBD"
        />
      }
    >
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Business Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: `${API_BASE_URL}/${business.logo}` }}
          style={styles.businessLogo}
          resizeMode="cover"
        />
        
        <View style={styles.businessInfoContainer}>
          <Text style={styles.businessName}>{business.businessName}</Text>
          
          {business.businessCode && (
            <Text style={styles.businessCode}>Code: {business.businessCode}</Text>
          )}

          {isMember && membership && (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>
                ✓ {membership.membershipLevel || 'Member'}
              </Text>
            </View>
          )}

          <View style={styles.categoryContainer}>
            <Text style={styles.category}>{business.mainCategory}</Text>
            {business.subCategory && (
              <Text style={styles.subCategory}> • {business.subCategory}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Business Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        
        {/* Address */}
        {business.addressDetails && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Address:</Text>
            <Text style={styles.detailValue}>
              {business.addressDetails}
              {business.barangay && `, ${business.barangay}`}
              {business.city && `, ${business.city}`}
              {business.province && `, ${business.province}`}
            </Text>
          </View>
        )}

        {/* Operating Hours */}
        {business.openTime && business.closeTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕐 Hours:</Text>
            <Text style={styles.detailValue}>
              {business.openTime} - {business.closeTime}
            </Text>
          </View>
        )}

        {/* Verification Status */}
        {business.verificationStatus && (
          <View style={styles.detailRow}>
            <Text style={styles.verifiedBadge}>✓ Verified Business</Text>
          </View>
        )}
      </View>

      {/* Available Promos Section */}
      <View style={styles.promosSection}>
        <Text style={styles.sectionTitle}>
          Available Promos ({promos.length})
        </Text>

        {promos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active promos at the moment</Text>
          </View>
        ) : (
          promos.map((promo) => (
            <View key={promo.promoId} style={styles.promoCard}>
              {promo.imageUrl && (
                <Image
                  source={{ uri: `${API_BASE_URL}/${promo.imageUrl}` }}
                  style={styles.promoImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.promoContent}>
                <View style={styles.promoHeader}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <View style={styles.promoTypeBadge}>
                    <Text style={styles.promoTypeText}>
                      {promo.promoType === 'b1s1' ? 'B1S1' : 'SHARE'}
                    </Text>
                  </View>
                </View>

                {promo.description && (
                  <Text style={styles.promoDescription}>{promo.description}</Text>
                )}

                <View style={styles.promoMeta}>
                  {promo.startDate && promo.endDate && (
                    <Text style={styles.promoDate}>
                      Valid: {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                    </Text>
                  )}
                  
                  {promo.remainingClaims !== null && (
                    <Text style={styles.promoClaims}>
                      {promo.remainingClaims} claims left
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleClaimPromo(promo.promoId)}
                >
                  <Text style={styles.claimButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    marginBottom: 20,
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: "#4F0CBD",
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#4F0CBD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  profileSection: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  businessLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#4F0CBD",
  },
  businessInfoContainer: {
    alignItems: "center",
  },
  businessName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  businessCode: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  memberBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  memberBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    fontSize: 14,
    color: "#4F0CBD",
    fontWeight: "600",
  },
  subCategory: {
    fontSize: 14,
    color: "#666",
  },
  detailsSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  verifiedBadge: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "600",
  },
  promosSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
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
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  promoImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#f0f0f0",
  },
  promoContent: {
    padding: 16,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  promoTypeBadge: {
    backgroundColor: "#4F0CBD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promoTypeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  promoDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  promoMeta: {
    marginBottom: 12,
  },
  promoDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  promoClaims: {
    fontSize: 12,
    color: "#4F0CBD",
    fontWeight: "600",
  },
  claimButton: {
    backgroundColor: "#4F0CBD",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  claimButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});