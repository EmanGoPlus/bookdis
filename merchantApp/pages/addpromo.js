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
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    promoType: "b1s1",
    imageUrl: "",
    startDate: "",
    endDate: "",
    maxClaims: "",
    maxClaimsPerUser: "",
    eligibleMemberships: [],
  });

  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });

  const promoTypes = [
    {
      label: "Buy 1 Share 1",
      value: "b1s1",
      description:
        "Customer buys 1 item and can share 1 free item with a friend",
    },
    {
      label: "Share Only",
      value: "share",
      description:
        "Customer can share this promo with friends (no purchase required)",
    },
  ];

  const membershipLevels = [
    { label: "Regular", value: "regular" },
    { label: "Gold", value: "gold" },
    { label: "Premium", value: "premium" },
    { label: "VIP", value: "vip" },
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
      setShowPromoForm(true);

      console.log(
        "🏢 Business selected for promo creation:",
        businessDetails.businessName
      );
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMembershipLevel = (level) => {
    const currentLevels = formData.eligibleMemberships || [];
    const exists = currentLevels.includes(level);

    updateFormData(
      "eligibleMemberships",
      exists
        ? currentLevels.filter((l) => l !== level)
        : [...currentLevels, level]
    );
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

    if (!formData.startDate) {
      Alert.alert("Error", "Start date is required");
      return false;
    }

    if (!formData.endDate) {
      Alert.alert("Error", "End date is required");
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      Alert.alert("Error", "Please enter valid dates in YYYY-MM-DD format");
      return false;
    }

    if (startDate < today) {
      Alert.alert("Error", "Start date cannot be in the past");
      return false;
    }

    if (endDate <= startDate) {
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

      const formDataObj = new FormData();
      formDataObj.append("businessId", selectedBusiness.id.toString());
      formDataObj.append("title", formData.title.trim());
      formDataObj.append("description", formData.description.trim());
      formDataObj.append("promoType", formData.promoType);
      formDataObj.append(
        "startDate",
        new Date(formData.startDate).toISOString()
      );
      formDataObj.append("endDate", new Date(formData.endDate).toISOString());

      if (formData.maxClaims) {
        formDataObj.append("maxClaims", formData.maxClaims.toString());
      }
      if (formData.maxClaimsPerUser) {
        formDataObj.append(
          "maxClaimsPerUser",
          formData.maxClaimsPerUser.toString()
        );
      }
      if (formData.eligibleMemberships.length > 0) {
        formDataObj.append(
          "eligibleMemberships",
          formData.eligibleMemberships.join(",")
        );
      }

      // Add the image file if selected
      if (formData.imageUrl) {
        const uriParts = formData.imageUrl.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formDataObj.append("image", {
          uri: formData.imageUrl,
          name: `promo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/user/business/create-promo`,
        formDataObj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Promo created:", response.data);

      Alert.alert("Success!", "Promo has been created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("❌ Error creating promo:", error);
      let errorMessage = "Failed to create promo";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      updateFormData("imageUrl", result.assets[0].uri);
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
  setShowStartPicker(false);
  if (selectedDate) {
    setStartDateObj(selectedDate);
    updateFormData("startDate", selectedDate.toISOString().split("T")[0]); // store YYYY-MM-DD
  }
};

const handleEndDateChange = (event, selectedDate) => {
  setShowEndPicker(false);
  if (selectedDate) {
    setEndDateObj(selectedDate);
    updateFormData("endDate", selectedDate.toISOString().split("T")[0]);
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
            <Text style={styles.selectionSubtitle}>
              Select a business to create promo for
            </Text>
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
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={styles.label}>Promo Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => updateFormData("title", value)}
                placeholder="e.g., Buy 1 Coffee, Share 1 Free!"
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
                onChangeText={(value) => updateFormData("description", value)}
                placeholder="Describe your promo offer..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={255}
              />
            </View>

            {/* Promo Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Promo Type *</Text>
              <View style={styles.promoTypeContainer}>
                {promoTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.promoTypeItem,
                      formData.promoType === type.value &&
                        styles.promoTypeItemSelected,
                    ]}
                    onPress={() => updateFormData("promoType", type.value)}
                  >
                    <Text
                      style={[
                        styles.promoTypeTitle,
                        formData.promoType === type.value &&
                          styles.promoTypeTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.promoTypeDesc,
                        formData.promoType === type.value &&
                          styles.promoTypeDescSelected,
                      ]}
                    >
                      {type.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Image URL */}
            <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
              <Text style={styles.selectButtonText}>
                {formData.imageUrl ? "Change Promo Image" : "Pick Promo Image"}
              </Text>
            </TouchableOpacity>

            {formData.imageUrl ? (
              <Text style={styles.helperText}>
                Selected: {formData.imageUrl.split("/").pop()}
              </Text>
            ) : null}

            {/* Date Range */}
           <View style={styles.row}>
  <View style={[styles.inputGroup, styles.halfWidth]}>
    <Text style={styles.label}>Start Date *</Text>
    <TouchableOpacity
      style={styles.input}
      onPress={() => setShowStartPicker(true)}
    >
      <Text>
        {formData.startDate
          ? formData.startDate
          : "Select start date"}
      </Text>
    </TouchableOpacity>
    {showStartPicker && (
      <DateTimePicker
        value={startDateObj}
        mode="date"
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={handleStartDateChange}
      />
    )}
  </View>

  <View style={[styles.inputGroup, styles.halfWidth]}>
    <Text style={styles.label}>End Date *</Text>
    <TouchableOpacity
      style={styles.input}
      onPress={() => setShowEndPicker(true)}
    >
      <Text>
        {formData.endDate
          ? formData.endDate
          : "Select end date"}
      </Text>
    </TouchableOpacity>
    {showEndPicker && (
      <DateTimePicker
        value={endDateObj}
        mode="date"
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={handleEndDateChange}
      />
    )}
  </View>
</View>


            {/* Optional Settings */}
            <Text style={styles.sectionTitle}>Optional Settings</Text>

            {/* Claim Limits */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Max Claims Total</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxClaims}
                  onChangeText={(value) => updateFormData("maxClaims", value)}
                  placeholder="e.g., 100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>Total claims allowed</Text>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Max Claims Per User</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxClaimsPerUser}
                  onChangeText={(value) =>
                    updateFormData("maxClaimsPerUser", value)
                  }
                  placeholder="e.g., 1"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>Per customer limit</Text>
              </View>
            </View>

            {/* Eligible Membership Levels */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Eligible Membership Levels (optional)
              </Text>
              <Text style={styles.helperText}>
                Leave empty to allow all membership levels
              </Text>
              <View style={styles.checkboxGroup}>
                {membershipLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.checkboxItem,
                      formData.eligibleMemberships.includes(level.value) &&
                        styles.checkboxItemSelected,
                    ]}
                    onPress={() => toggleMembershipLevel(level.value)}
                  >
                    <Text
                      style={[
                        styles.checkboxText,
                        formData.eligibleMemberships.includes(level.value) &&
                          styles.checkboxTextSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading ? ["#9CA3AF", "#6B7280"] : ["#FFFFFF", "#F3F4F6"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Create{" "}
                    {formData.promoType === "b1s1" ? "Buy 1 Share 1" : "Share"}{" "}
                    Promo
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowPromoForm(false)}
            >
              <Text style={styles.backButtonText}>
                Back to Business Selection
              </Text>
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
  helperText: {
    fontSize: 12,
    fontFamily: "Roboto_400Regular",
    color: "#6B7280",
    marginTop: 4,
  },
  promoTypeContainer: {
    gap: 12,
  },
  promoTypeItem: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  promoTypeItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  promoTypeTitle: {
    fontSize: 16,
    fontFamily: "Roboto_600SemiBold",
    color: "#374151",
    marginBottom: 4,
  },
  promoTypeDesc: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#6B7280",
    lineHeight: 20,
  },
  promoTypeTextSelected: {
    color: "#4F46E5",
  },
  promoTypeDescSelected: {
    color: "#6366F1",
  },
  checkboxGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  checkboxItem: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
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
    borderColor: "#8D4BFF",
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
    fontSize: 16,
    fontFamily: "Roboto_600SemiBold",
    color: "#4F46E5",
    textAlign: "center",
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
