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
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
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
      setRegions(response.data.map((r) => ({ label: r.name, value: r.name })));
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
      // Find the region code from the region name
      const response = await axios.get("https://psgc.cloud/api/regions");
      const region = response.data.find(r => r.name === regionName);
      if (!region) return;

      const provincesResponse = await axios.get(
        `https://psgc.cloud/api/regions/${region.code}/provinces`
      );
      setProvinces(provincesResponse.data.map((p) => ({ label: p.name, value: p.name })));
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
      // Find province code
      const regionsResponse = await axios.get("https://psgc.cloud/api/regions");
      const region = regionsResponse.data.find(r => r.name === selectedRegion);
      if (!region) return;

      const provincesResponse = await axios.get(
        `https://psgc.cloud/api/regions/${region.code}/provinces`
      );
      const province = provincesResponse.data.find(p => p.name === provinceName);
      if (!province) return;

      const citiesResponse = await axios.get(
        `https://psgc.cloud/api/provinces/${province.code}/cities-municipalities`
      );
      setCities(citiesResponse.data.map((c) => ({ label: c.name, value: c.name })));
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
      // Find city code
      const regionsResponse = await axios.get("https://psgc.cloud/api/regions");
      const region = regionsResponse.data.find(r => r.name === selectedRegion);
      if (!region) return;

      const provincesResponse = await axios.get(
        `https://psgc.cloud/api/regions/${region.code}/provinces`
      );
      const province = provincesResponse.data.find(p => p.name === selectedProvince);
      if (!province) return;

      const citiesResponse = await axios.get(
        `https://psgc.cloud/api/provinces/${province.code}/cities-municipalities`
      );
      const city = citiesResponse.data.find(c => c.name === cityName);
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
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setProfileImage(asset.uri);
        
        // Convert to base64 for upload
        if (asset.base64) {
          setProfileImageBase64(asset.base64);
        } else {
          // Fallback: read file and convert to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setProfileImageBase64(base64);
        }
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
      !profileImageBase64 ||
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

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    // Validate password strength (minimum 8 characters to match backend)
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

      const payload = {
        profile: `data:image/jpeg;base64,${profileImageBase64}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ""),
        birthday: formData.birthday,
        password: formData.password,
        region: selectedRegion,
        province: selectedProvince,
        city: selectedCity,
        barangay: selectedBarangay,
        postalCode: formData.postalCode.trim(),
        addressDetails: formData.addressDetails.trim(),
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/user/customer-register`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success", 
          "Customer registered successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                resetForm();
                navigation.navigate('Login'); // Navigate to login screen
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
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
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
            
            <RNPickerSelect
              placeholder={{ label: "Select Region *", value: null }}
              items={regions}
              value={selectedRegion}
              onValueChange={(val) => setSelectedRegion(val)}
              style={pickerStyles}
            />
            
            <RNPickerSelect
              placeholder={{ label: "Select Province *", value: null }}
              items={provinces}
              value={selectedProvince}
              onValueChange={(val) => setSelectedProvince(val)}
              style={pickerStyles}
              disabled={!selectedRegion}
            />
            
            <RNPickerSelect
              placeholder={{ label: "Select City/Municipality *", value: null }}
              items={cities}
              value={selectedCity}
              onValueChange={(val) => setSelectedCity(val)}
              style={pickerStyles}
              disabled={!selectedProvince}
            />
            
            <RNPickerSelect
              placeholder={{ label: "Select Barangay *", value: null }}
              items={barangays}
              value={selectedBarangay}
              onValueChange={(val) => setSelectedBarangay(val)}
              style={pickerStyles}
              disabled={!selectedCity}
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
              placeholder="Complete Address Details *"
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

const pickerStyles = {
  inputIOS: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  inputAndroid: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  placeholder: {
    color: "#666",
    fontSize: 16,
  },
};