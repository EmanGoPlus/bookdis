import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { API_BASE_URL } from "../../apiConfig";
import Footer from "../../components/footer";
import { UserContext } from "../../context/AuthContext"; // Add this import

const { width } = Dimensions.get("window");

export default function Profile({ navigation }) {
  // Get data from Context instead of route params
  const { business, user, userRole, hasSelectedBusiness } = useContext(UserContext);
  
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  if (!hasSelectedBusiness()) {
    return (
      <LinearGradient
        colors={["#ffce54", "#fda610", "#f75c3c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={[styles.container, { paddingBottom: 0 }]}>
          <View style={styles.noBusiness}>
            <Text style={styles.noBusinessText}>No business selected</Text>
            <TouchableOpacity 
              style={styles.selectBusinessButton}
              onPress={() => navigation.navigate("BusinessSelection")}
            >
              <Text style={styles.selectBusinessButtonText}>Select Business</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const {
    businessName,
    logo,
    mainCategory,
    subCategory,
    region,
    province,
    city,
    barangay,
    postalCode,
    addressDetails,
    openTime,
    closeTime,
    verificationStatus,
    id: businessId
  } = business;

  const logoUrl = logo ? `${API_BASE_URL}/${logo}` : null;
  console.log("🖼️ Logo URL:", logoUrl);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const ProfileCard = ({ title, value, icon }) => (
    <View style={styles.profileCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  const handleGoToCredits = () => {
    navigation.navigate("Credits", {
      businessId: businessId,
      businessName: businessName,
    });
  };

  const ActionButton = ({
    title,
    onPress,
    color = "#fff",
    backgroundColor = "rgba(255,255,255,0.2)",
  }) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionButtonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Profile</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={
                    logo
                      ? { uri: logoUrl }
                      : require("../../assets/default-image.png")
                  }
                  style={styles.logoImage}
                  onError={(error) => {
                    console.log(
                      "❌ Image load error:",
                      error.nativeEvent.error
                    );
                  }}
                  onLoad={() => {
                    console.log("✅ Image loaded successfully");
                  }}
                />
                <View style={styles.logoOverlay}>
                  <Text style={styles.logoEditText}>📷</Text>
                </View>
              </View>
            </View>

            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>
                {businessName || "Business Name"}
              </Text>
              <Text style={styles.businessSubtitle}>
                {verificationStatus ? "Verified ✅" : "Not Verified"}
              </Text>
              <Text style={styles.userRoleText}>
                Logged in as: {userRole === "merchant" ? "Owner" : "Employee"}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <ProfileCard
              title="Business Type"
              value={`${mainCategory || ""}${subCategory ? " - " + subCategory : ""}`}
              icon="🏪"
            />
            <ProfileCard
              title="Location"
              value={
                `${addressDetails ? addressDetails + ", " : ""}` +
                `${barangay ? barangay + ", " : ""}` +
                `${city ? city + ", " : ""}` +
                `${province || ""}` +
                `${region ? " (" + region + ")" : ""}` +
                `${postalCode ? " - " + postalCode : ""}`
              }
              icon="📍"
            />

            <ProfileCard
              title="Operating Hours"
              value={`${openTime || ""} - ${closeTime || ""}`}
              icon="⏰"
            />
            <ProfileCard
              title="Verification Status"
              value={verificationStatus ? "Verified ✅" : "Not Verified ❌"}
              icon="✔️"
            />
          </View>
          <View style={styles.actionContainer}>
            <ActionButton
              title="💳 View Credits & History"
              onPress={handleGoToCredits}
              backgroundColor="rgba(255,255,255,0.9)"
              color="#f75c3c"
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
        <Footer />
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
  },

  noBusiness: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
  },
  noBusinessText: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  selectBusinessButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  selectBusinessButtonText: {
    color: "#f75c3c",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    fontWeight: "600",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoWrapper: {
    position: "relative",
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  logoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f75c3c",
  },
  logoEditText: {
    fontSize: 14,
  },
  businessInfo: {
    alignItems: "center",
  },
  businessName: {
    fontSize: 26,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  businessSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
  },
  userRoleText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 10,
  },

  // Details Container
  detailsContainer: {
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },

  actionContainer: {
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  bottomPadding: {
    height: 16,
  },
});