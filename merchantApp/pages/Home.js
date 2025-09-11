import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../apiConfig";
import { UserContext } from "../context/AuthContext";

export default function Home({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const { user, selectBusiness, isMerchant, logout } = useContext(UserContext);

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  // if (!fontsLoaded) return null;

  useEffect(() => {
    // Only merchants should be on this page
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
          `${API_BASE_URL}/api/merchant/my-businesses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Businesses response:", response.data);
        setBusinesses(response.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching businesses:", err.message);
        if (err.response?.status === 401) {
          // Token expired or invalid
          await logout();
          navigation.navigate("Login");
        }
      }
    };

    fetchBusinesses();
  }, []);

  const handleBusinessSelection = async (itemValue) => {
    setSelectedBusinessId(itemValue);

    if (itemValue) {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/api/merchant/business/${itemValue}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("🏢 Full API Response:", response.data);
        const business = response.data.data;

        // Store selected business in context
        await selectBusiness(business);

        console.log("🏢 Business selected:", business.businessName);

        // Navigate to Dashboard with business data as parameters
        navigation.navigate("Dashboard", {
          businessId: business.id,
          businessName: business.businessName,
          logo: business.logo,
          mainCategory: business.mainCategory,
          subCategory: business.subCategory,
          region: business.region,
          province: business.province,
          city: business.city,
          barangay: business.barangay,
          postalCode: business.postalCode,
          addressDetails: business.addressDetails,
          openTime: business.openTime,
          closeTime: business.closeTime,
          verificationStatus: business.verificationStatus,
          creditsBalance: business.creditsBalance,
        });
      } catch (err) {
        console.error("❌ Error fetching business details:", err.message);
        if (err.response) {
          console.error("❌ Error response:", err.response.data);
        }
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Login");
  };

  return (
    <LinearGradient
      colors={["#ffce54", "#fda610", "#f75c3c"]}
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
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Welcome to</Text>
          <Text style={styles.headerText}>Bookdis</Text>
          {user && (
            <Text style={styles.userGreeting}>
              Hello, {user.firstName || user.phone}!
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("CreateBusiness")}
          >
            <Text style={styles.buttonText}>Add Business</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Your Business</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBusinessId}
                onValueChange={handleBusinessSelection}
                style={styles.picker}
                dropdownIconColor="#666"
              >
                <Picker.Item label="-- Choose Business --" value="" />
                {businesses.map((biz) => (
                  <Picker.Item
                    key={biz.id}
                    label={biz.businessName}
                    value={biz.id}
                  />
                ))}
              </Picker>
            </View>
            {businesses.length === 0 && (
              <Text style={styles.noBusiness}>
                No businesses found. Add your first business!
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.logout]}
            onPress={handleLogout}
          >
            <Text style={[styles.text, styles.logoutText]}>Logout</Text>
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
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 120,
    gap: 20,
  },
  headerText: {
    fontSize: 48,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userGreeting: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    opacity: 0.9,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontFamily: "HessGothic-Bold",
    fontSize: 16,
    fontWeight: "600",
    color: "#f75c3c",
  },
  logout: {
    backgroundColor: "#f75c3c",
    borderWidth: 0,
  },
  logoutText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "HessGothic-Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  picker: {
    height: 52,
    color: "#495057",
  },
  noBusiness: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 10,
  },
});
