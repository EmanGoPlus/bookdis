import React, { useContext, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { UserContext } from "../../context/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../apiConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Path, G, Defs, ClipPath } from "react-native-svg";
import Footer from "../../components/footer";
import Header from "../../components/header";
import { Shadow } from "react-native-shadow-2";
import InfiniteMembersSwipe from '../../components/swipeAnimation';
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_600SemiBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";

export default function Dashboard({ route, navigation }) {

//   const DUMMY_MEMBERS = [
//   { id: 1, name: "Maria Santos", memberSince: "Jan 2024", visits: 25, tier: "Platinum" },
//   { id: 2, name: "Juan Dela Cruz", memberSince: "Feb 2024", visits: 18, tier: "Gold" },
//   { id: 3, name: "Ana Reyes", memberSince: "Mar 2024", visits: 12, tier: "Silver" },
//   { id: 4, name: "Carlos Mendoza", memberSince: "Apr 2024", visits: 8, tier: "Bronze" },
//   { id: 5, name: "Lucia Rodriguez", memberSince: "May 2024", visits: 30, tier: "Platinum" },
// ];

  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });
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
        `${API_BASE_URL}/api/user/business/${user.businessId}`,
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
        colors={["#1D143C", "#40089D", "##760EBC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.7 }}
        style={styles.background}
      >
        <SafeAreaView style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading business data...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={["#1D143C", "#40089D", "#760EBC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Header />
      <SafeAreaView style={styles.container}>
        {/* Invite Section */}
        {/* <Shadow
          distance={14} // blur radius (matches 14px)
          offset={[0, 6]} // shadow offset (x=0, y=6)
          startColor={"#8800FF52"} // shadow color (rgba)
          finalColor="transparent" // fade out
          paintInside={false}
        > */}
        <View style={styles.invite}>
          {/* Left SVG - User Add Icon */}
          <Svg width="21" height="23" viewBox="0 0 21 23" fill="none">
            <Path
              d="M11.1667 14.4397V16.7039C10.1862 16.3572 9.13684 16.2509 8.10673 16.3938C7.07662 16.5367 6.09584 16.9248 5.24676 17.5253C4.39768 18.1258 3.70508 18.9213 3.22713 19.8449C2.74919 20.7686 2.49984 21.7934 2.50004 22.8334L0.333374 22.8323C0.333038 21.5094 0.635539 20.204 1.2177 19.0161C1.79986 17.8282 2.64622 16.7894 3.69194 15.9792C4.73766 15.1689 5.95498 14.6089 7.25062 14.3418C8.54626 14.0748 9.88584 14.109 11.1667 14.4397ZM9.00004 13.0834C5.40879 13.0834 2.50004 10.1746 2.50004 6.58337C2.50004 2.99212 5.40879 0.083374 9.00004 0.083374C12.5913 0.083374 15.5 2.99212 15.5 6.58337C15.5 10.1746 12.5913 13.0834 9.00004 13.0834ZM9.00004 10.9167C11.3942 10.9167 13.3334 8.97754 13.3334 6.58337C13.3334 4.18921 11.3942 2.25004 9.00004 2.25004C6.60587 2.25004 4.66671 4.18921 4.66671 6.58337C4.66671 8.97754 6.60587 10.9167 9.00004 10.9167ZM15.5 17.4167V14.1667H17.6667V17.4167H20.9167V19.5834H17.6667V22.8334H15.5V19.5834H12.25V17.4167H15.5Z"
              fill="#EF47F8"
            />
          </Svg>

          {/* Middle Text */}
          <Text style={styles.inviteText}>Invite to become a member</Text>

          {/* Right SVG - Arrow Right */}
          <Svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <Path
              d="M8.02729 8.71412C7.77729 8.95221 7.76763 9.34779 8.00571 9.59771C8.24379 9.84771 8.63938 9.85738 8.88929 9.61929L8.02729 8.71412ZM13.2643 5.45263C13.5143 5.21454 13.524 4.81896 13.2859 4.56904C13.0478 4.31904 12.6522 4.30937 12.4023 4.54746L13.2643 5.45263ZM12.4023 5.45263C12.6522 5.69071 13.0478 5.68104 13.2859 5.43104C13.524 5.18113 13.5143 4.78554 13.2643 4.54746L12.4023 5.45263ZM8.88929 0.380792C8.63938 0.142734 8.24379 0.152384 8.00571 0.402342C7.76763 0.6523 7.77729 1.04791 8.02729 1.28596L8.88929 0.380792ZM12.8333 5.62504C13.1785 5.62504 13.4583 5.34521 13.4583 5.00004C13.4583 4.65488 13.1785 4.37504 12.8333 4.37504V5.62504ZM1.16663 4.37504C0.821451 4.37504 0.541626 4.65488 0.541626 5.00004C0.541626 5.34521 0.821451 5.62504 1.16663 5.62504V4.37504ZM8.88929 9.61929L13.2643 5.45263L12.4023 4.54746L8.02729 8.71412L8.88929 9.61929ZM13.2643 4.54746L8.88929 0.380792L8.02729 1.28596L12.4023 5.45263L13.2643 4.54746ZM12.8333 4.37504H1.16663V5.62504H12.8333V4.37504Z"
              fill="white"
            />
          </Svg>
        </View>
    
        {/* Cards Row */}
        <View style={styles.inviteRow}>
          <View style={styles.leftCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#5B0FF4" }]}>
                <Svg width={16} height={14} viewBox="0 0 16 14" fill="none">
                  <Path
                    d="M0 5.05556V0.777778C0 0.571498 0.0842854 0.373667 0.234315 0.227806C0.384344 0.0819442 0.587827 0 0.8 0H15.2C15.4122 0 15.6157 0.0819442 15.7657 0.227806C15.9157 0.373667 16 0.571498 16 0.777778V5.05556C15.4696 5.05556 14.9609 5.26042 14.5858 5.62507C14.2107 5.98972 14 6.4843 14 7C14 7.5157 14.2107 8.01028 14.5858 8.37493C14.9609 8.73958 15.4696 8.94444 16 8.94444V13.2222C16 13.4285 15.9157 13.6263 15.7657 13.7722C15.6157 13.9181 15.4122 14 15.2 14H0.8C0.587827 14 0.384344 13.9181 0.234315 13.7722C0.0842854 13.6263 0 13.4285 0 13.2222V8.94444C0.530433 8.94444 1.03914 8.73958 1.41421 8.37493C1.78929 8.01028 2 7.5157 2 7C2 6.4843 1.78929 5.98972 1.41421 5.62507C1.03914 5.26042 0.530433 5.05556 0 5.05556ZM9.6 1.55556H1.6V3.864C2.20097 4.15356 2.70678 4.60059 3.0604 5.15469C3.41403 5.70879 3.60141 6.34791 3.60141 7C3.60141 7.65209 3.41403 8.29121 3.0604 8.84531C2.70678 9.39941 2.20097 9.84644 1.6 10.136V12.4444H9.6V1.55556ZM11.2 1.55556V12.4444H14.4V10.136C13.799 9.84644 13.2932 9.39941 12.9396 8.84531C12.586 8.29121 12.3986 7.65209 12.3986 7C12.3986 6.34791 12.586 5.70879 12.9396 5.15469C13.2932 4.60059 13.799 4.15356 14.4 3.864V1.55556H11.2Z"
                    fill="white"
                  />
                </Svg>
              </View>
              <Text style={styles.leftCardLabel}>Promo</Text>
            </View>
            <Text style={styles.leftCardText}>15</Text>
          </View>

          {/* Right Card - Members */}

          <Shadow
            distance={9}
            offset={[-1, 0]} // X = -6 (left), Y = 0
            startColor={"#814AF01A"}
            paintInside={false} // keep the bg from the inner View
          >
            <View style={styles.rightCard}>
              <View style={styles.cardRow}>
                <View
                  style={[styles.iconCircle, { backgroundColor: "#EF47F8" }]}
                >
                  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <Path
                      d="M0 16C0 14.3834 0.642175 12.8331 1.78525 11.69C2.92833 10.5469 4.47868 9.90476 6.09524 9.90476C7.7118 9.90476 9.26214 10.5469 10.4052 11.69C11.5483 12.8331 12.1905 14.3834 12.1905 16H10.6667C10.6667 14.7876 10.185 13.6248 9.32773 12.7675C8.47042 11.9102 7.30766 11.4286 6.09524 11.4286C4.88282 11.4286 3.72006 11.9102 2.86275 12.7675C2.00544 13.6248 1.52381 14.7876 1.52381 16H0ZM6.09524 9.14286C3.56952 9.14286 1.52381 7.09714 1.52381 4.57143C1.52381 2.04571 3.56952 0 6.09524 0C8.62095 0 10.6667 2.04571 10.6667 4.57143C10.6667 7.09714 8.62095 9.14286 6.09524 9.14286ZM6.09524 7.61905C7.77905 7.61905 9.14286 6.25524 9.14286 4.57143C9.14286 2.88762 7.77905 1.52381 6.09524 1.52381C4.41143 1.52381 3.04762 2.88762 3.04762 4.57143C3.04762 6.25524 4.41143 7.61905 6.09524 7.61905ZM12.4069 10.4404C13.4776 10.9226 14.3863 11.7038 15.0237 12.6901C15.6611 13.6763 16.0001 14.8257 16 16H14.4762C14.4764 15.1192 14.2221 14.2571 13.7441 13.5174C13.266 12.7777 12.5844 12.1917 11.7813 11.8301L12.4069 10.4404ZM11.8827 1.83848C12.6503 2.15489 13.3066 2.69222 13.7684 3.38227C14.2301 4.07232 14.4765 4.88399 14.4762 5.71429C14.4765 6.75987 14.0859 7.76779 13.381 8.54006C12.6761 9.31232 11.7079 9.79312 10.6667 9.888V8.35429C11.2312 8.27343 11.7549 8.01373 12.161 7.6133C12.5671 7.21287 12.8341 6.69282 12.9228 6.12947C13.0115 5.56613 12.9173 4.98918 12.654 4.48332C12.3907 3.97746 11.9721 3.56933 11.4598 3.31886L11.8827 1.83848Z"
                      fill="white"
                    />
                  </Svg>
                </View>
                <Text style={styles.rightCardLabel}>Members</Text>
              </View>
              <Text style={styles.rightCardText}>951</Text>
            </View>
          </Shadow>
        </View>

        <View style={styles.promoRow}>
          <Shadow
            distance={4} // small blur so it actually shows
            offset={[0, 11]} // 11px downward shift
            startColor={"#2112534D"} // same Figma RGBA
            paintInside={false}
          >
            <View style={styles.promoCard1}>
              <Text style={styles.promoCard1Title}>Unclaimed Promos</Text>
              <View style={styles.promoCard1Contents}>
                <Text style={styles.promoCard1Unclaimed}>98</Text>
                <Text style={styles.promoCard1Total}>/857</Text>
              </View>
            </View>
          </Shadow>
          <Shadow
            distance={4} // small blur so it actually shows
            offset={[0, 11]} // 11px downward shift
            startColor={"#2112534D"} // same Figma RGBA
          >
            <View style={styles.promoCard2}>
              <Text style={styles.promoCard2Text}>Welcome</Text>
            </View>
          </Shadow>
        </View>

<InfiniteMembersSwipe />
{/* <InfiniteMembersSwipe members={DUMMY_MEMBERS} /> */}
      </SafeAreaView>
      <Footer />
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
  invite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#5B0FF4",
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 100,
    marginTop: -40,
    zIndex: 5,
  },

  inviteText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    textAlign: "center",
    flex: 1, // take up remaining space and center text
  },

  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    justifyContent: "center", // so both cards sit properly
    gap: 0,
  },

  leftCard: {
    width: 156,
    height: 114,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    padding: 20,
  },

  rightCard: {
    width: 156,
    height: 114,
    backgroundColor: "#fff",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  iconCircle: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0, // prevent shrinking
  },

  leftCardText: {
    color: "#321268",
    fontSize: 40,
    fontFamily: "Roboto_800ExtraBold",
    alignSelf: "center",
    marginTop: "auto",
  },
  leftCardLabel: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Roboto_600SemiBold",
    color: "#259DFF",
    flex: 1,
  },
  rightCardText: {
    color: "#321268",
    fontSize: 40,
    fontFamily: "Roboto_800ExtraBold",
    alignSelf: "center",
    marginTop: "auto", // push to bottom
  },
  rightCardLabel: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Roboto_600SemiBold",
    color: "#D43DD7",
    flex: 1,
  },

  promoRow: {
    flexDirection: "row",
    justifyContent: "space-between",

    gap: 5, // works only if using React Native 0.71+ or with some libraries
  },

  promoCard1: {
    width: 156,
    height: 148,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A826FF",
    backgroundColor: "transparent",
    paddingTop: 30, // space at top
    justifyContent: "flex-start", // align items from top
    alignItems: "center",
  },

  promoCard1Title: {
    color: "#9926E6",
    fontFamily: "Roboto_600SemiBold",
    fontSize: 14,
  },

  promoCard1Contents: {
    flexDirection: "row", // row layout
    justifyContent: "center", // center horizontally
    alignItems: "center", // center vertically
    width: "100%", // take full width of card
    marginTop: 10,
    gap: 10, // optional: space between items
  },

  promoCard1Unclaimed: {
    fontSize: 51,
    color: "#fff",
    fontFamily: "Roboto_600SemiBold",
  },

  promoCard1Total: {
    fontSize: 26,
    color: "#6A63C3",
    fontFamily: "Roboto_600SemiBold",
  },

  promoCard2: {
    width: 156,
    height: 148,
    borderRadius: 20,
    backgroundColor: "#2B1064",
    paddingTop: 15,
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  promoCard2Text: {
    color: "#2CBCFA",
    fontSize: 14,
    fontFamily: "Roboto_600SemiBold",
  },

  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 30,
  },

  memberCard: {
    marginTop: 20,
    width: 275,
    height: 148,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    paddingTop: 15,
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    opacity: 1,
  },

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
