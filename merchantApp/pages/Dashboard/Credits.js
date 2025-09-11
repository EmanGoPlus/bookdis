import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";

export default function Credits({ route, navigation }) {
  // Get data from both route params AND context as fallback
  const { user, business } = useContext(UserContext);
  const routeParams = route.params || {};
  
  // Determine businessId and businessName from multiple sources
  const businessId = routeParams.businessId || business?.id || user?.businessId;
  const businessName = routeParams.businessName || business?.businessName || "Business";
  
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creditData, setCreditData] = useState({
    balance: 0,
    history: [],
    totalTransactions: 0
  });

  if (!fontsLoaded) return null;

  const fetchCreditData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      console.log("🔍 Credits - BusinessId:", businessId);
      console.log("🔍 Credits - BusinessName:", businessName);
      console.log("🔍 Credits - API_BASE_URL:", API_BASE_URL);
      
      if (!businessId) {
        console.log("❌ Credits - No businessId found from any source");
        Alert.alert("Error", "No business selected");
        navigation.goBack();
        return;
      }
      
      const token = await AsyncStorage.getItem("token");
      console.log("🔍 Credits - Token exists:", !!token);
      
      if (!token) {
        Alert.alert("Error", "Please login again");
        // Don't navigate manually - let AuthContext handle it
        return;
      }

      // CORRECTED API ENDPOINT - matching your backend routes
      const url = `${API_BASE_URL}/api/merchant/business/${businessId}/credits`;
      console.log("🔍 Credits - Full API URL:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Credits - API response:", response.data);
      
      const responseData = response.data;
      setCreditData({
        balance: responseData.balance || 0,
        history: responseData.history || [],
        totalTransactions: responseData.totalTransactions || 0,
        businessName: responseData.businessName || businessName
      });
      
    } catch (error) {
      console.error("❌ Credits - API Error:", error);
      
      if (error.response?.status === 401) {
        Alert.alert("Error", "Session expired. Please login again");
        // Don't navigate manually - let AuthContext handle it
      } else if (error.response?.status === 404) {
        Alert.alert("Error", "Business not found or access denied");
        navigation.goBack();
      } else {
        Alert.alert("Error", `Failed to load credit information: ${error.message}`);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCreditData(false);
    setRefreshing(false);
  };

  useEffect(() => {
    console.log("🔍 Credits component mounted");
    console.log("🔍 Credits - Route params:", route.params);
    console.log("🔍 Credits - Context business:", business);
    console.log("🔍 Credits - Context user:", user);
    console.log("🔍 Credits - Final businessId:", businessId);
    console.log("🔍 Credits - Final businessName:", businessName);
    
    if (businessId) {
      fetchCreditData();
    } else {
      console.log("❌ Credits - No businessId found from any source");
      Alert.alert("Error", "No business ID found", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack()
        }
      ]);
    }
  }, [businessId]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleBuyCredits = () => {
    Alert.alert("Buy Credits", "Credit purchase feature coming soon!");
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format amount with proper sign and color
  const formatAmount = (amount, type) => {
    const isPositive = type === "credit" || type === "purchase" || amount > 0;
    return {
      text: `${isPositive ? "+" : ""}${amount}`,
      color: isPositive ? "#27ae60" : "#e74c3c"
    };
  };

  const HistoryItem = ({ item }) => {
    const amountFormat = formatAmount(item.amount, item.type);
    
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyType}>
            {item.type === "credit" || item.type === "purchase" ? "💰" : "📤"} {item.description}
          </Text>
          <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
          {item.referenceNo && (
            <Text style={styles.referenceNo}>Ref: {item.referenceNo}</Text>
          )}
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyAmount, { color: amountFormat.color }]}>
            {amountFormat.text}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#ffce54", "#fda610", "#f75c3c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Credits</Text>
            <View style={styles.refreshButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading credits...</Text>
          </View>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credits</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {/* Business Info */}
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessName}</Text>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>{creditData.balance}</Text>
            <Text style={styles.balanceSubtext}>credits</Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.buyButton}
            onPress={handleBuyCredits}
            activeOpacity={0.8}
          >
            <Text style={styles.buyButtonText}>💳 Buy Credits</Text>
          </TouchableOpacity>

          {/* Transaction History */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Transaction History</Text>
              <Text style={styles.historyCount}>
                {creditData.totalTransactions} transactions
              </Text>
            </View>

            <View style={styles.historyContainer}>
              {creditData.history && creditData.history.length > 0 ? (
                <FlatList
                  data={creditData.history}
                  renderItem={({ item }) => <HistoryItem item={item} />}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📝</Text>
                  <Text style={styles.emptyStateText}>No transactions yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your credit history will appear here
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
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

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    fontFamily: "HessGothic-Bold",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    fontWeight: "600",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Business Info
  businessInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  businessName: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "HessGothic-Bold",
  },

  // Balance Card
  balanceCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 48,
    color: "#f75c3c",
    fontFamily: "HessGothic-Bold",
    fontWeight: "bold",
  },
  balanceSubtext: {
    fontSize: 16,
    color: "#999",
    marginTop: 4,
  },

  // Buy Button
  buyButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  buyButtonText: {
    fontSize: 18,
    color: "#f75c3c",
    fontFamily: "HessGothic-Bold",
    fontWeight: "600",
  },

  // History Section
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    fontWeight: "600",
  },
  historyCount: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  // History Container
  historyContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    overflow: "hidden",
  },

  // History Item
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  historyLeft: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  referenceNo: {
    fontSize: 11,
    color: "#999",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "HessGothic-Bold",
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginLeft: 20,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#333",
    fontFamily: "HessGothic-Bold",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  bottomPadding: {
    height: 20,
  },
});