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
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import Footer from "../../components/footer";

export default function Credits({ route, navigation }) {
  const { user, business } = useContext(UserContext);
  const routeParams = route.params || {};

  // Determine business info
  const businessId = routeParams.businessId || business?.id || user?.businessId;
  const businessName = routeParams.businessName || business?.businessName || "Business";

  // Fonts
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creditData, setCreditData] = useState({
    balance: 0,
    history: [],
    totalTransactions: 0,
  });
  const [canSeeBuyCredits, setCanSeeBuyCredits] = useState(true); // default visible

  if (!fontsLoaded) return null;

  // ----------------------
  // Fetch Credit Data
  // ----------------------
  const fetchCreditData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      if (!businessId) {
        Alert.alert("Error", "No business selected");
        navigation.goBack();
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const url = `${API_BASE_URL}/api/user/business/${businessId}/credits`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCreditData({
        balance: response.data.balance || 0,
        history: response.data.history || [],
        totalTransactions: response.data.totalTransactions || 0,
        businessName: response.data.businessName || businessName,
      });
    } catch (error) {
      console.error("Credits API Error:", error);
      Alert.alert("Error", error.message || "Failed to load credits");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // ----------------------
  // Fetch Element Visibility
  // ----------------------
  const fetchElementVisibility = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const url = `${API_BASE_URL}/api/user/permissions/check/${user.id}/buyCredits`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCanSeeBuyCredits(response.data.canSee);
    } catch (error) {
      console.error("Element visibility error:", error);
      setCanSeeBuyCredits(true); // fallback visible
    }
  };

  // ----------------------
  // Pull-to-refresh handler
  // ----------------------
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCreditData(false);
    await fetchElementVisibility();
    setRefreshing(false);
  };

  // ----------------------
  // Component Mount
  // ----------------------
  useEffect(() => {
    if (!businessId) {
      Alert.alert("Error", "No business ID found", [
        { text: "Go Back", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    fetchCreditData();
    fetchElementVisibility();
  }, [businessId]);

  // ----------------------
  // Event Handlers
  // ----------------------
  const handleBackPress = () => navigation.goBack();
  const handleBuyCredits = () => Alert.alert("Buy Credits", "Feature coming soon!");

  // ----------------------
  // Helpers
  // ----------------------
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount, type) => {
    const isPositive = type === "credit" || type === "purchase" || amount > 0;
    return {
      text: `${isPositive ? "+" : ""}${amount}`,
      color: isPositive ? "#27ae60" : "#e74c3c",
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
          {item.referenceNo && <Text style={styles.referenceNo}>Ref: {item.referenceNo}</Text>}
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyAmount, { color: amountFormat.color }]}>
            {amountFormat.text}
          </Text>
        </View>
      </View>
    );
  };

  // ----------------------
  // Loading State
  // ----------------------
  if (loading) {
    return (
      <LinearGradient colors={["#ffce54", "#fda610", "#f75c3c"]} style={styles.background}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
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

  // ----------------------
  // Render
  // ----------------------
  return (
    <LinearGradient colors={["#ffce54", "#fda610", "#f75c3c"]} style={styles.background}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
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

          {/* Buy Credits Button */}
          {canSeeBuyCredits && (
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyCredits} activeOpacity={0.8}>
              <Text style={styles.buyButtonText}>💳 Buy Credits</Text>
            </TouchableOpacity>
          )}

          {/* Transaction History */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Transaction History</Text>
              <Text style={styles.historyCount}>{creditData.totalTransactions} transactions</Text>
            </View>
            <View style={styles.historyContainer}>
              {creditData.history.length > 0 ? (
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
        <Footer />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 16, marginTop: 10, fontFamily: "HessGothic-Bold" },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  headerTitle: { fontSize: 20, color: "#fff", fontFamily: "HessGothic-Bold", fontWeight: "600" },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  refreshButtonText: { fontSize: 20, color: "#fff", fontWeight: "bold" },

  // Scroll Content
  scrollContent: { paddingHorizontal: 20 },

  // Business Info
  businessInfo: { alignItems: "center", paddingVertical: 20 },
  businessName: { fontSize: 18, color: "rgba(255,255,255,0.9)", fontFamily: "HessGothic-Bold" },

  // Balance Card
  balanceCard: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 20, padding: 30, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  balanceLabel: { fontSize: 14, color: "#666", marginBottom: 8, textTransform: "uppercase", fontWeight: "600" },
  balanceAmount: { fontSize: 48, color: "#f75c3c", fontFamily: "HessGothic-Bold", fontWeight: "bold" },
  balanceSubtext: { fontSize: 16, color: "#999", marginTop: 4 },

  // Buy Button
  buyButton: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, alignItems: "center", marginBottom: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  buyButtonText: { fontSize: 18, color: "#f75c3c", fontFamily: "HessGothic-Bold", fontWeight: "600" },

  // History Section
  historySection: { marginBottom: 20 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  historyTitle: { fontSize: 18, color: "#fff", fontFamily: "HessGothic-Bold", fontWeight: "600" },
  historyCount: { fontSize: 14, color: "rgba(255,255,255,0.8)" },

  // History Container
  historyContainer: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 16, overflow: "hidden" },

  // History Item
  historyItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20 },
  historyLeft: { flex: 1 },
  historyType: { fontSize: 16, color: "#333", fontWeight: "600", marginBottom: 4 },
  historyDate: { fontSize: 12, color: "#666", marginBottom: 2 },
  referenceNo: { fontSize: 11, color: "#999" },
  historyRight: { alignItems: "flex-end" },
  historyAmount: { fontSize: 18, fontWeight: "bold", fontFamily: "HessGothic-Bold" },

  // Separator
  separator: { height: 1, backgroundColor: "rgba(0,0,0,0.1)", marginLeft: 20 },

  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyStateIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateText: { fontSize: 18, color: "#333", fontFamily: "HessGothic-Bold", marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: "#666", textAlign: "center" },

  bottomPadding: { height: 20 },
});
