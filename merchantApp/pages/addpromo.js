import React, { useState, useContext, useEffect } from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  Roboto_600SemiBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";
import { API_BASE_URL } from "../apiConfig";
import { UserContext } from "../context/AuthContext";

export default function AddPromo({ navigation }) {
  const { user, logout, isMerchant } = useContext(UserContext);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
    maxRedemptions: "",
    maxRedemptionsPerUser: "",
    cooldownHours: "",
    validDays: [],
    eligibleMemberships: [],
    conditions: {
      minPurchase: "",
      applicableCategories: "",
      excludedItems: "",
    }
  });

  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });

  const discountTypes = [
    { label: "Percentage (%)", value: "percentage" },
    { label: "Fixed Amount (₱)", value: "fixed" },
  ];

  const membershipLevels = [
    { label: "Regular", value: "regular" },
    { label: "Gold", value: "gold" },
    { label: "Premium", value: "premium" },
    { label: "VIP", value: "vip" },
  ];

  const dayOptions = [
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
    { label: "Sunday", value: 0 },
  ];

  useEffect(() => {
    if (!isMerchant()) {
      console.log("⚠️ Non-merchant user redirected from AddPromo");
      navigation.navigate("Default");
      return;
    }

    fetchBusinesses();
  }, []);

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

  const handleBusinessSelection = async (business) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/user/business/${business.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🏢 Selected business for promo:", response.data);
      const businessDetails = response.data.data;

      setSelectedBusiness(businessDetails);
      setModalVisible(false);
      setShowPromoForm(true); // Show the promo form
      
      console.log("🏢 Business selected for promo creation:", businessDetails.businessName);

    } catch (err) {
      console.error("❌ Error fetching business details:", err.message);
      Alert.alert("Error", "Failed to load business details");
    }
  };

  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleBusinessSelection(item)}
    >
      <Text style={styles.modalItemText}>{item.businessName}</Text>
    </TouchableOpacity>
  );

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleArrayItem = (array, item) => {
    const currentArray = formData[array] || [];
    const exists = currentArray.includes(item);
    
    updateFormData(array, 
      exists 
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item]
    );
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString + "T00:00:00Z").toISOString();
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Title is required");
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert("Error", "Description is required");
      return false;
    }

    if (!formData.discountValue || isNaN(formData.discountValue)) {
      Alert.alert("Error", "Valid discount value is required");
      return false;
    }

    if (!formData.startDate) {
      Alert.alert("Error", "Start date is required");
      return false;
    }

    if (!formData.endDate) {
      Alert.alert("Error", "End date is required");
      return false;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      Alert.alert("Error", "End date must be after start date");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        navigation.navigate("Login");
        return;
      }

      // Prepare the payload
      const payload = {
        businessId: selectedBusiness.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: parseInt(formData.discountValue),
        startDate: formatDateForAPI(formData.startDate),
        endDate: formatDateForAPI(formData.endDate),
      };

      // Add optional fields only if they have values
      if (formData.maxRedemptions) {
        payload.maxRedemptions = parseInt(formData.maxRedemptions);
      }

      if (formData.maxRedemptionsPerUser) {
        payload.maxRedemptionsPerUser = parseInt(formData.maxRedemptionsPerUser);
      }

      if (formData.cooldownHours) {
        payload.cooldownHours = parseInt(formData.cooldownHours);
      }

      if (formData.validDays && formData.validDays.length > 0) {
        payload.validDays = formData.validDays;
      }

      if (formData.eligibleMemberships && formData.eligibleMemberships.length > 0) {
        payload.eligibleMemberships = formData.eligibleMemberships;
      }

      // Add conditions if any are filled
      const conditions = {};
      if (formData.conditions.minPurchase) {
        conditions.minPurchase = parseInt(formData.conditions.minPurchase);
      }
      if (formData.conditions.applicableCategories) {
        conditions.applicableCategories = formData.conditions.applicableCategories.split(',').map(s => s.trim());
      }
      if (formData.conditions.excludedItems) {
        conditions.excludedItems = formData.conditions.excludedItems.split(',').map(s => s.trim());
      }

      if (Object.keys(conditions).length > 0) {
        payload.conditions = conditions;
      }

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${API_BASE_URL}/api/user/business/create-promo`, 
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Promo created:", response.data);

      Alert.alert(
        "Success!",
        "Promo has been created successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.error("Error creating promo:", error);
      
      let errorMessage = "Failed to create promo";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        console.error("API Error:", error.response.data);
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  // Business Selection Screen
  if (!showPromoForm) {
    return (
      <LinearGradient
        colors={["#23143C", "#4F0CBD", "#6D08B1"]}
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
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Create Promo</Text>
            <Text style={styles.selectionSubtitle}>Select a business to create promo for</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.selectButton}
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

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back</Text>
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
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Promo Creation Form
  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Promo</Text>
            <Text style={styles.businessName}>
              For: {selectedBusiness.businessName}
            </Text>
            <TouchableOpacity
              style={styles.changeBusinessButton}
              onPress={() => setShowPromoForm(false)}
            >
              <Text style={styles.changeBusinessText}>Change Business</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="e.g., Flash Sale - 50% Off"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Describe your promo..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={255}
              />
            </View>

            {/* Discount Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Discount Type *</Text>
              <View style={styles.radioGroup}>
                {discountTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.radioItem,
                      formData.discountType === type.value && styles.radioItemSelected
                    ]}
                    onPress={() => updateFormData('discountType', type.value)}
                  >
                    <Text style={[
                      styles.radioText,
                      formData.discountType === type.value && styles.radioTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Discount Value */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Discount Value * ({formData.discountType === 'percentage' ? '%' : '₱'})
              </Text>
              <TextInput
                style={styles.input}
                value={formData.discountValue}
                onChangeText={(value) => updateFormData('discountValue', value)}
                placeholder={formData.discountType === 'percentage' ? "e.g., 20" : "e.g., 500"}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Date Range */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Start Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.startDate}
                  onChangeText={(value) => updateFormData('startDate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>End Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.endDate}
                  onChangeText={(value) => updateFormData('endDate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Optional Fields */}
            <Text style={styles.sectionTitle}>Optional Settings</Text>

            {/* Usage Limits */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Max Redemptions</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxRedemptions}
                  onChangeText={(value) => updateFormData('maxRedemptions', value)}
                  placeholder="e.g., 100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Max Per User</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxRedemptionsPerUser}
                  onChangeText={(value) => updateFormData('maxRedemptionsPerUser', value)}
                  placeholder="e.g., 1"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Valid Days */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valid Days (optional)</Text>
              <View style={styles.checkboxGroup}>
                {dayOptions.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.checkboxItem,
                      formData.validDays.includes(day.value) && styles.checkboxItemSelected
                    ]}
                    onPress={() => toggleArrayItem('validDays', day.value)}
                  >
                    <Text style={[
                      styles.checkboxText,
                      formData.validDays.includes(day.value) && styles.checkboxTextSelected
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ["#9CA3AF", "#6B7280"] : ["#FFFFFF", "#F3F4F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Promo</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowPromoForm(false)}
            >
              <Text style={styles.backButtonText}>Back to Business Selection</Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  selectionHeader: {
    padding: 40,
    alignItems: "center",
  },
  selectionTitle: {
    fontSize: 32,
    fontFamily: "Roboto_800ExtraBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#E5E7EB",
    textAlign: "center",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Roboto_800ExtraBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  businessName: {
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#E5E7EB",
    textAlign: "center",
    marginBottom: 10,
  },
  changeBusinessButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#8D4BFF",
  },
  changeBusinessText: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#FFFFFF",
  },
  form: {
    marginTop: 50,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 15,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  label: {
    fontSize: 16,
    fontFamily: "Roboto_600SemiBold",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#1F2937",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 10,
  },
  radioItem: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: "center",
  },
  radioItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  radioText: {
    fontSize: 14,
    fontFamily: "Roboto_600SemiBold",
    color: "#6B7280",
  },
  radioTextSelected: {
    color: "#4F46E5",
  },
  checkboxGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  checkboxItem: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 8,
    minWidth: 80,
    alignItems: "center",
  },
  checkboxItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  checkboxText: {
    fontSize: 12,
    fontFamily: "Roboto_600SemiBold",
    color: "#6B7280",
  },
  checkboxTextSelected: {
    color: "#4F46E5",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
    color: "#4F46E5",
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5,
  },
  selectButton: {
    width: "100%",
    height: 65,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#8D4BFF',
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  selectButtonText: {
    fontFamily: "Roboto_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  noBusiness: {
    textAlign: "center",
    color: "#E5E7EB",
    fontFamily: "Roboto_400Regular",
    fontStyle: "italic",
    marginTop: 10,
  },
  submitButton: {
    marginTop: 30,
    marginBottom: 15,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
    color: "#4F46E5",
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#8D4BFF",
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
    fontFamily: "Roboto_600SemiBold",
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
    fontFamily: "Roboto_400Regular",
    color: "#333",
    textAlign: "center",
  },
});