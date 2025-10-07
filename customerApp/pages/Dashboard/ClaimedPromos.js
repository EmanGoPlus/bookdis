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

const ClaimedPromos = () => {
  const { customer } = useContext(CustomerContext);
  const token = customer?.token || "";
  const navigation = useNavigation();

  const [claimedPromos, setClaimedPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch claimed promos from API
  const fetchClaimedPromos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/user/customer/claimed-promos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClaimedPromos(res.data.data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch claimed promos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimedPromos();
  }, []);

  // Navigate to share screen
  const handleShare = (promo) => {
    navigation.navigate("SharePromo", {
      promoId: promo.promoId,
      promoTitle: promo.promoTitle,
      promoImage: promo.businessLogo,
    });
  };

  // Render single promo card
  const renderPromo = ({ item }) => {
    const logoUri = item.businessLogo
      ? `${API_BASE_URL.replace(/\/$/, "")}/${item.businessLogo.replace(
          /^\//,
          ""
        )}`
      : null;

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
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShare(item)}
        >
          <Svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 -960 960 960"
            fill="#fff"
            style={{ marginRight: 6 }}
          >
            <Path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
          </Svg>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F0CBD" />
      </View>
    );
  }

  // Empty state
  if (!claimedPromos.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No claimed promos yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Optional Back Button */}
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

      {/* Claimed promos list */}
      <FlatList
        data={claimedPromos}
        keyExtractor={(item) => item.claimId.toString()}
        renderItem={renderPromo}
        contentContainerStyle={styles.listContainer}
      />
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
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  listContainer: {
    paddingVertical: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
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
    backgroundColor: "#d0d0d0",
  },
  logoPlaceholderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
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
    fontSize: 14,
  },
  backContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
});
