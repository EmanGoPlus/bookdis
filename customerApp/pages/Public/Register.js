import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_600SemiBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";
import { API_BASE_URL } from "../../apiConfig";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    postalCode: "",
    addressDetails: "",
  });

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });

  // Load regions
  useEffect(() => {
    axios.get("https://psgc.cloud/api/regions").then((res) => {
      setRegions(res.data.map((r) => ({ label: r.name, value: r.code })));
    });
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    if (selectedRegion) {
      axios
        .get(`https://psgc.cloud/api/regions/${selectedRegion}/provinces`)
        .then((res) => {
          setProvinces(res.data.map((p) => ({ label: p.name, value: p.code })));
          setCities([]);
          setBarangays([]);
          setSelectedProvince(null);
          setSelectedCity(null);
          setSelectedBarangay(null);
        });
    }
  }, [selectedRegion]);

  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      axios
        .get(
          `https://psgc.cloud/api/provinces/${selectedProvince}/cities-municipalities`
        )
        .then((res) => {
          setCities(res.data.map((c) => ({ label: c.name, value: c.code })));
          setBarangays([]);
          setSelectedCity(null);
          setSelectedBarangay(null);
        });
    }
  }, [selectedProvince]);

  // Load barangays when city changes
  useEffect(() => {
    if (selectedCity) {
      axios
        .get(
          `https://psgc.cloud/api/cities-municipalities/${selectedCity}/barangays`
        )
        .then((res) => {
          setBarangays(res.data.map((b) => ({ label: b.name, value: b.code })));
          setSelectedBarangay(null);
        });
    }
  }, [selectedCity]);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleRegister = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        return Alert.alert("Error", "Passwords do not match");
      }

      const payload = {
        ...formData,
        region: selectedRegion,
        province: selectedProvince,
        city: selectedCity,
        barangay: selectedBarangay,
      };

      const res = await axios.post(
        `${ API_BASE_URL }/api/user/customer-register`,
        payload
      );

      if (res.data.success) {
        Alert.alert("Success", "Customer registered successfully!");
      } else {
        Alert.alert("Error", res.data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      Alert.alert("Error", "Something went wrong while registering");
    }
  };

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Register</Text>
          </View>

          <View style={styles.basicInfoContainer}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#000"
              value={formData.firstName}
              onChangeText={(val) => handleChange("firstName", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#000"
              value={formData.lastName}
              onChangeText={(val) => handleChange("lastName", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#000"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(val) => handleChange("email", val)}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#000"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => handleChange("phone", val)}
            />
          </View>

          <RNPickerSelect
            placeholder={{ label: "Select Region", value: null }}
            items={regions}
            value={selectedRegion}
            onValueChange={(val) => setSelectedRegion(val)}
            style={pickerStyles}
          />
          <RNPickerSelect
            placeholder={{ label: "Select Province", value: null }}
            items={provinces}
            value={selectedProvince}
            onValueChange={(val) => setSelectedProvince(val)}
            style={pickerStyles}
          />
          <RNPickerSelect
            placeholder={{ label: "Select City/Municipality", value: null }}
            items={cities}
            value={selectedCity}
            onValueChange={(val) => setSelectedCity(val)}
            style={pickerStyles}
          />
          <RNPickerSelect
            placeholder={{ label: "Select Barangay", value: null }}
            items={barangays}
            value={selectedBarangay}
            onValueChange={(val) => setSelectedBarangay(val)}
            style={pickerStyles}
          />

          <TextInput
            style={styles.input}
            placeholder="Postal Code"
            placeholderTextColor="#000"
            value={formData.postalCode}
            onChangeText={(val) => handleChange("postalCode", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Address Details"
            placeholderTextColor="#000"
            value={formData.addressDetails}
            onChangeText={(val) => handleChange("addressDetails", val)}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#000"
            secureTextEntry
            value={formData.password}
            onChangeText={(val) => handleChange("password", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#000"
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={(val) => handleChange("confirmPassword", val)}
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  headerText: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "Roboto_800ExtraBold",
  },

  basicInfoContainer: {
    marginBottom: 20,
  },

  input: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
  },

  registerButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  registerButtonText: {
    color: "#4F0CBD",
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
  },
});

const pickerStyles = {
  inputIOS: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  inputAndroid: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  placeholder: {
    color: "#000",
    fontSize: 16,
  },
};