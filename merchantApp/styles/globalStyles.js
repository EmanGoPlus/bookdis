import React, { useState, useEffect, useContext } from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../apiConfig";
import { UserContext } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlobalStyles, Colors, Fonts } from "../styles/globalStyles";

export default function Home({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
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
          `${API_BASE_URL}/api/user/business/${itemValue}`,
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
      colors={["#C0CAFE", "#fff"]}
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
          source={require("../assets/bookdis-final-logo.png")}
        />
        {user && (
          <Text style={styles.userGreeting}>
            Hello, {user.firstName || user.phone}!
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={GlobalStyles.button}
            onPress={() => navigation.navigate("CreateBusiness")}
          >
            <Text style={GlobalStyles.buttonText}>Add Business</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Your Business</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBusinessId}
                onValueChange={handleBusinessSelection}
                style={styles.picker}
                dropdownIconColor={Colors.textGrey}
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
            style={GlobalStyles.button}
            onPress={() => navigation.navigate("AddEmployee")}
          >
            <Text style={GlobalStyles.buttonText}>Add Employee</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, styles.logout]}
            onPress={handleLogout}
          >
            <Text style={[GlobalStyles.buttonText, styles.logoutText]}>Logout</Text>
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
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: -40,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 120,
    gap: 20,
  },
  userGreeting: {
    fontSize: 16,
    color: Colors.white,
    marginTop: 10,
    opacity: 0.9,
  },
  logout: {
    backgroundColor: Colors.secondary,
    borderWidth: 0,
  },
  logoutText: {
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: Colors.black,
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
    backgroundColor: Colors.pickerBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.pickerBorder,
    overflow: "hidden",
  },
  picker: {
    height: 52,
    color: "#495057",
  },
  noBusiness: {
    textAlign: "center",
    color: Colors.textGrey,
    fontStyle: "italic",
    marginTop: 10,
  },
});