import React, { useState, useEffect, useContext } from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
  Image,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";
import { API_BASE_URL } from "../../apiConfig";
import { UserContext } from "../../context/AuthContext";

export default function Home({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { user, selectBusiness, isMerchant, logout } = useContext(UserContext);

  useEffect(() => {
    if (!isMerchant()) {
      console.log("⚠️ Non-merchant user redirected from Home");
      navigation.navigate("Default");
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("⚠️ No token found in AsyncStorage");
          navigation.navigate("Login");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/user/merchant/my-businesses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Businesses response:", response.data);
        setBusinesses(response.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching businesses:", err.message);
        if (err.response?.status === 401) {
          await logout();
          navigation.navigate("Login");
        }
      }
    };

    fetchBusinesses();
  }, []);

  const handleBusinessSelection = async (business) => {
    setSelectedBusiness(business);
    setModalVisible(false);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/user/business/${business.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🏢 Full API Response:", response.data);
      const businessDetails = response.data.data;

      await selectBusiness(businessDetails);
      console.log("🏢 Business selected:", businessDetails.businessName);

      navigation.navigate("Dashboard", {
        businessId: businessDetails.id,
        businessName: businessDetails.businessName,
        logo: businessDetails.logo,
        mainCategory: businessDetails.mainCategory,
        subCategory: businessDetails.subCategory,
        region: businessDetails.region,
        province: businessDetails.province,
        city: businessDetails.city,
        barangay: businessDetails.barangay,
        postalCode: businessDetails.postalCode,
        addressDetails: businessDetails.addressDetails,
        openTime: businessDetails.openTime,
        closeTime: businessDetails.closeTime,
        verificationStatus: businessDetails.verificationStatus,
        creditsBalance: businessDetails.creditsBalance,
      });
    } catch (err) {
      console.error("❌ Error fetching business details:", err.message);
      if (err.response) {
        console.error("❌ Error response:", err.response.data);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Login");
  };

  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleBusinessSelection(item)}
    >
      <Text style={styles.modalItemText}>{item.businessName}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#C0CAFE", "#fff"]}
      locations={[0, 0.7]} // 70% transition, last 30% is solid white
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.container}>
        <Image
          style={styles.image}
          source={require("../../assets/bookdis-final-logo.png")}
        />

        {/* {user && (
          <Text style={styles.userGreeting}>
            Hello, {user.firstName || user.phone}!
          </Text>
        )} */}

        <View style={styles.form}>
          <TouchableOpacity
            style={{ width: "100%" }}
            onPress={() => navigation.navigate("CreateBusiness")}
          >
            <LinearGradient
              colors={["#5C0AE4", "#6A13D8"]}
                  start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Add Business</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectButton]}
            onPress={() => setModalVisible(true)}
            disabled={businesses.length === 0}
          >
            <Text style={styles.selectButtonText}>
              {selectedBusiness
                ? `Selected: ${selectedBusiness.businessName}`
                : businesses.length > 0
                  ? "Select Business"
                  : "No Businesses Available"}
            </Text>
          </TouchableOpacity>

          {businesses.length === 0 && (
            <Text style={styles.noBusiness}>
              No businesses found. Add your first business!
            </Text>
          )}

          <TouchableOpacity>
            <Text style={styles.link}>Skip</Text>
          </TouchableOpacity>

          {/* Modal for business selection */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Business</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={businesses}
                  renderItem={renderBusinessItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.modalList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </Modal>

          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("AddEmployee")}
          >
            <Text style={styles.buttonText}>Add Employee</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 40,
  },
  userGreeting: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    opacity: 0.9,
  },
  form: {
    marginTop: 50,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
button: {
  paddingVertical: 18,
  borderRadius: 15,
  width: "100%",   // ✅ stays here for the gradient
  alignItems: "center",
},

  selectButton: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: "#4B1AA9",
    paddingVertical: 18,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    
  },
  logoutButton: {
    backgroundColor: "#f75c3c",
  },
  buttonText: {
    fontFamily: "Roboto_800ExtraBold",
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  selectButtonText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 16,
    color: "#4B1AA9",
  },
  noBusiness: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "70%",
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
    fontFamily: "Roboto_400Regular",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "bold",
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  link: {
    color: "#007AFF",
    marginTop: 7,
    fontSize: 15,
    fontWeight: "500",
    color: "#B00AFD",
    textDecorationLine: "underline",
  },
});
