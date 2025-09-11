import React, { useContext, useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { UserContext } from "../../context/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../apiConfig";

export default function Dashboard({ route, navigation }) {
  const { user, business, userRole, logout } = useContext(UserContext);
  const routeParams = route.params || {};

  const [businessData, setBusinessData] = useState(() => {
    if (business && business.id) {
      return {
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
      };
    }
    return {
      businessId: routeParams.businessId,
      businessName: routeParams.businessName,
      logo: routeParams.logo,
      mainCategory: routeParams.mainCategory,
      subCategory: routeParams.subCategory,
      region: routeParams.region,
      province: routeParams.province,
      city: routeParams.city,
      barangay: routeParams.barangay,
      postalCode: routeParams.postalCode,
      addressDetails: routeParams.addressDetails,
      openTime: routeParams.openTime,
      closeTime: routeParams.closeTime,
      verificationStatus: routeParams.verificationStatus,
      creditsBalance: routeParams.creditsBalance,
    };
  });

  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  useEffect(() => {
    // Update businessData when context business changes
    if (business && business.id) {
      console.log("✅ Dashboard - Using business data from context:", business);
      setBusinessData({
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
    } else if (!businessData.businessName && user?.businessId) {
      // Fallback: fetch if no business data in context
      fetchBusinessData();
    }
  }, [business, user?.businessId]);

  const fetchBusinessData = async () => {
    if (!user?.businessId) return;

    setLoading(true);
    try {
      console.log("🏪 Fetching business data for dashboard...");
      const token = await AsyncStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/api/merchant/business/${user.businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // Handle both nested and direct business data
      const fetchedBusiness =
        response.data.business || response.data.data || response.data;
      console.log("✅ Business data fetched for dashboard:", fetchedBusiness);

      setBusinessData({
        businessId: fetchedBusiness.id,
        businessName: fetchedBusiness.businessName,
        logo: fetchedBusiness.logo,
        mainCategory: fetchedBusiness.mainCategory,
        subCategory: fetchedBusiness.subCategory,
        region: fetchedBusiness.region,
        province: fetchedBusiness.province,
        city: fetchedBusiness.city,
        barangay: fetchedBusiness.barangay,
        postalCode: fetchedBusiness.postalCode,
        addressDetails: fetchedBusiness.addressDetails,
        openTime: fetchedBusiness.openTime,
        closeTime: fetchedBusiness.closeTime,
        verificationStatus: fetchedBusiness.verificationStatus,
        creditsBalance: fetchedBusiness.creditsBalance,
      });
    } catch (error) {
      console.error("❌ Failed to fetch business data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const handleGoToCredits = () => {
    console.log("🔍 Navigating to Credits with:", {
      businessId: businessData.businessId || user?.businessId,
      businessName: businessData.businessName,
    });

    navigation.navigate("Credits", {
      businessId: businessData.businessId || user?.businessId,
      businessName: businessData.businessName,
    });
  };

  const handleGoToProfile = () => {
    console.log("🔍 Navigating to Profile with:", businessData);

    navigation.navigate("Profile", {
      ...businessData,
      businessId: businessData.businessId || user?.businessId,
      id: businessData.businessId || user?.businessId,
    });
  };

  const handleBackToHome = () => {
    navigation.navigate("Home");
  };

  const handleLogout = async () => {
    await logout();
    // Don't navigate manually - let AppNavigator handle it
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#ffce54", "#fda610", "#f75c3c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading business data...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
        {/* Back button at top-left */}
        <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Centered content */}
        <View style={styles.centerContent}>
          <Text style={styles.headerText}>Dashboard</Text>
          {businessData.businessName && (
            <Text style={styles.businessText}>{businessData.businessName}</Text>
          )}
          {user && (
            <Text style={styles.userGreeting}>
              Welcome, {user.firstName || user.phone}!
            </Text>
          )}
          {user?.role && <Text style={styles.roleText}>Role: {user.role}</Text>}

          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.button} onPress={handleGoToCredits}>
              <Text style={styles.buttonText}>💳 Credits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleGoToProfile}>
              <Text style={styles.buttonText}>👤 Business Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Members")}
            >
              <Text style={styles.buttonText}>👥 Members</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Sales")}
            >
              <Text style={styles.buttonText}>📊 Sales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("QRScanner")}
            >
              <Text style={styles.buttonText}>📱 QR Scanner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logout]}
              onPress={handleLogout}
            >
              <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
  },

  // Back button at top-left
  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },

  // Centered content
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },

  headerText: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  businessText: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    marginTop: 5,
    textAlign: "center",
    opacity: 0.85,
  },
  userGreeting: {
    fontSize: 18,
    color: "#fff",
    marginTop: 5,
    textAlign: "center",
    opacity: 0.8,
  },
  roleText: {
    fontSize: 14,
    color: "#fff",
    marginTop: 2,
    textAlign: "center",
    opacity: 0.7,
    textTransform: "capitalize",
  },

  // Buttons
  buttonWrapper: {
    width: "100%",
    marginTop: 30,
    gap: 15,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontFamily: "HessGothic-Bold",
    fontSize: 18,
    color: "#f75c3c",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  logout: {
    backgroundColor: "#f75c3c",
  },
  logoutText: {
    color: "#fff",
  },
});
