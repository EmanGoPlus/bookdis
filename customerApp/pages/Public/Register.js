import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_600SemiBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";
import { API_BASE_URL } from "../../apiConfig";

export default function Register({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    password: "",
    confirmPassword: "",
    postalCode: "",
    addressDetails: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageBase64, setProfileImageBase64] = useState(null);

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Modal states for custom dropdowns
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });

  // Request permissions
  useEffect(() => {
    requestPermissions();
    loadRegions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select profile pictures!'
        );
      }
    }
  };

  const loadRegions = async () => {
    try {
      setLoadingRegions(true);
      const response = await axios.get("https://psgc.cloud/api/regions");
      setRegions(response.data.map((r) => ({ label: r.name, value: r.name, code: r.code })));
    } catch (error) {
      console.error("Failed to load regions:", error);
      Alert.alert("Error", "Failed to load regions. Please check your internet connection.");
    } finally {
      setLoadingRegions(false);
    }
  };

  // Load provinces when region changes
  useEffect(() => {
    if (selectedRegion) {
      loadProvinces(selectedRegion);
    } else {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedBarangay(null);
    }
  }, [selectedRegion]);

  const loadProvinces = async (regionName) => {
    try {
      const region = regions.find(r => r.value === regionName);
      if (!region) return;

      const provincesResponse = await axios.get(
        `https://psgc.cloud/api/regions/${region.code}/provinces`
      );
      setProvinces(provincesResponse.data.map((p) => ({ label: p.name, value: p.name, code: p.code })));
      setCities([]);
      setBarangays([]);
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedBarangay(null);
    } catch (error) {
      console.error("Failed to load provinces:", error);
      Alert.alert("Error", "Failed to load provinces.");
    }
  };

  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      loadCities(selectedProvince);
    } else {
      setCities([]);
      setBarangays([]);
      setSelectedCity(null);
      setSelectedBarangay(null);
    }
  }, [selectedProvince]);

  const loadCities = async (provinceName) => {
    try {
      const province = provinces.find(p => p.value === provinceName);
      if (!province) return;

      const citiesResponse = await axios.get(
        `https://psgc.cloud/api/provinces/${province.code}/cities-municipalities`
      );
      setCities(citiesResponse.data.map((c) => ({ label: c.name, value: c.name, code: c.code })));
      setBarangays([]);
      setSelectedCity(null);
      setSelectedBarangay(null);
    } catch (error) {
      console.error("Failed to load cities:", error);
      Alert.alert("Error", "Failed to load cities/municipalities.");
    }
  };

  // Load barangays when city changes
  useEffect(() => {
    if (selectedCity) {
      loadBarangays(selectedCity);
    } else {
      setBarangays([]);
      setSelectedBarangay(null);
    }
  }, [selectedCity]);

  const loadBarangays = async (cityName) => {
    try {
      const city = cities.find(c => c.value === cityName);
      if (!city) return;

      const barangaysResponse = await axios.get(
        `https://psgc.cloud/api/cities-municipalities/${city.code}/barangays`
      );
      setBarangays(barangaysResponse.data.map((b) => ({ label: b.name, value: b.name })));
      setSelectedBarangay(null);
    } catch (error) {
      console.error("Failed to load barangays:", error);
      Alert.alert("Error", "Failed to load barangays.");
    }
  };

const selectProfileImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);
    }
  } catch (error) {
    console.error('Error selecting image:', error);
    Alert.alert('Error', 'Failed to select image. Please try again.');
  }
};

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const validateForm = () => {
    // Check if all required fields are filled
    if (
      !profileImage ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.birthday.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      !selectedRegion ||
      !selectedProvince ||
      !selectedCity ||
      !selectedBarangay ||
      !formData.postalCode.trim() ||
      !formData.addressDetails.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields including profile picture");
      return false;
    }

    

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    // Validate phone number (11 digits)
    const normalizedPhone = formData.phone.replace(/\D/g, "");
    if (normalizedPhone.length !== 11) {
      Alert.alert("Error", "Phone number must be exactly 11 digits");
      return false;
    }

    // Validate postal code (4-6 digits)
    if (!/^\d{4,6}$/.test(formData.postalCode)) {
      Alert.alert("Error", "Postal code must be 4-6 digits");
      return false;
    }

    // Validate birthday format (YYYY-MM-DD)
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(formData.birthday)) {
      Alert.alert("Error", "Please enter birthday in YYYY-MM-DD format");
      return false;
    }

    // Validate age (must be at least 13 years old)
    const birthDate = new Date(formData.birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      Alert.alert("Error", "You must be at least 13 years old to register");
      return false;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }

    return true;
  };

const handleRegister = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    setIsLoading(true);

    // Create FormData object (like in AddPromo)
    const formDataObj = new FormData();
    
    // Add the profile image file
    if (profileImage) {
      const uriParts = profileImage.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formDataObj.append("profile", {
        uri: profileImage,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    // Add all other fields
    formDataObj.append("firstName", formData.firstName.trim());
    formDataObj.append("lastName", formData.lastName.trim());
    formDataObj.append("email", formData.email.trim().toLowerCase());
    formDataObj.append("phone", formData.phone.replace(/\D/g, ""));
    formDataObj.append("birthday", formData.birthday);
    formDataObj.append("password", formData.password);
    formDataObj.append("region", selectedRegion);
    formDataObj.append("province", selectedProvince);
    formDataObj.append("city", selectedCity);
    formDataObj.append("barangay", selectedBarangay);
    formDataObj.append("postalCode", formData.postalCode.trim());
    formDataObj.append("addressDetails", formData.addressDetails.trim());

    console.log('Sending registration request...');

    const response = await axios.post(
      `${API_BASE_URL}/api/user/customer-register`,
      formDataObj,
      {
        headers: {
          'Content-Type': 'multipart/form-data', // Changed from application/json
        },
        timeout: 30000,
      }
    );

    console.log('Registration response:', response.data);

    if (response.data.success) {
      Alert.alert(
        "Success", 
        "Registration successful! You can now login with your credentials.",
        [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              navigation.navigate('Login');
            }
          }
        ]
      );
    } else {
      Alert.alert("Error", response.data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
    
    let errorMessage = "Something went wrong while registering";
    
    if (error.response) {
      console.log('Error response:', error.response.data);
      errorMessage = error.response.data?.error || 
                    error.response.data?.message || 
                    `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timeout. Please try again.";
    }
    
    Alert.alert("Registration Failed", errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthday: "",
      password: "",
      confirmPassword: "",
      postalCode: "",
      addressDetails: "",
    });
    setProfileImage(null);
    setProfileImageBase64(null);
    setSelectedRegion(null);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedBarangay(null);
    setProvinces([]);
    setCities([]);
    setBarangays([]);
  };

  // Custom Dropdown Component
  const CustomDropdown = ({ label, value, items, onSelect, disabled, modalVisible, setModalVisible }) => {
    return (
      <>
        <TouchableOpacity
          style={[styles.dropdown, disabled && styles.dropdownDisabled]}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
        >
          <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
            {value || label}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={items}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      onSelect(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  };

  if (!fontsLoaded || loadingRegions) {
    return (
      <LinearGradient
        colors={["#23143C", "#4F0CBD", "#6D08B1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.background, styles.centered]}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Register</Text>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            
            <TouchableOpacity 
              style={styles.imagePickerContainer} 
              onPress={selectProfileImage}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Tap to select profile picture *</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <TextInput
              style={styles.input}
              placeholder="First Name *"
              placeholderTextColor="#666"
              value={formData.firstName}
              onChangeText={(val) => handleChange("firstName", val)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Last Name *"
              placeholderTextColor="#666"
              value={formData.lastName}
              onChangeText={(val) => handleChange("lastName", val)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(val) => handleChange("email", val)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number (11 digits) *"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              maxLength={11}
              value={formData.phone}
              onChangeText={(val) => handleChange("phone", val)}
            />

            <TextInput
              style={styles.input}
              placeholder="Birthday (YYYY-MM-DD) *"
              placeholderTextColor="#666"
              value={formData.birthday}
              onChangeText={(val) => handleChange("birthday", val)}
            />
          </View>

          {/* Address Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <CustomDropdown
              label="Select Region *"
              value={selectedRegion}
              items={regions}
              onSelect={setSelectedRegion}
              disabled={false}
              modalVisible={showRegionModal}
              setModalVisible={setShowRegionModal}
            />
            
            <CustomDropdown
              label="Select Province *"
              value={selectedProvince}
              items={provinces}
              onSelect={setSelectedProvince}
              disabled={!selectedRegion}
              modalVisible={showProvinceModal}
              setModalVisible={setShowProvinceModal}
            />
            
            <CustomDropdown
              label="Select City/Municipality *"
              value={selectedCity}
              items={cities}
              onSelect={setSelectedCity}
              disabled={!selectedProvince}
              modalVisible={showCityModal}
              setModalVisible={setShowCityModal}
            />
            
            <CustomDropdown
              label="Select Barangay *"
              value={selectedBarangay}
              items={barangays}
              onSelect={setSelectedBarangay}
              disabled={!selectedCity}
              modalVisible={showBarangayModal}
              setModalVisible={setShowBarangayModal}
            />

            <TextInput
              style={styles.input}
              placeholder="Postal Code (4-6 digits) *"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              value={formData.postalCode}
              onChangeText={(val) => handleChange("postalCode", val)}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Complete Address Details (House #, Street, etc.) *"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.addressDetails}
              onChangeText={(val) => handleChange("addressDetails", val)}
            />
          </View>

          {/* Password Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account Security</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters) *"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.password}
              onChangeText={(val) => handleChange("password", val)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(val) => handleChange("confirmPassword", val)}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#4F0CBD" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? Login here
            </Text>
          </TouchableOpacity>

          <Text style={styles.requiredText}>* Required fields</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  headerText: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "Roboto_800ExtraBold",
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "Roboto_600SemiBold",
    marginBottom: 15,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  textArea: {
    height: 80,
    paddingTop: 15,
  },
  dropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownDisabled: {
    opacity: 0.6,
    backgroundColor: "rgba(200, 200, 200, 0.95)",
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#000",
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "#666",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
    color: "#4F0CBD",
  },
  modalClose: {
    fontSize: 24,
    color: "#666",
    fontFamily: "Roboto_400Regular",
  },
  modalItem: {
    padding: 16,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#000",
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  registerButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#4F0CBD",
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginLinkText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textDecorationLine: 'underline',
  },
  requiredText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textAlign: "center",
    marginTop: 15,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    marginTop: 10,
  },
});