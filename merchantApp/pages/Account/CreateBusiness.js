import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import axios from "axios";

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

  useEffect(() => {
    axios.get("https://psgc.cloud/api/regions").then((res) => {
      setRegions(res.data.map((r) => ({ label: r.name, value: r.code })));
    });
  }, []);

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

  useEffect(() => {
    if (selectedProvince) {
      axios
        .get(`https://psgc.cloud/api/provinces/${selectedProvince}/cities-municipalities`)
        .then((res) => {
          setCities(res.data.map((c) => ({ label: c.name, value: c.code })));
          setBarangays([]);
          setSelectedCity(null);
          setSelectedBarangay(null);
        });
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      axios
        .get(`https://psgc.cloud/api/cities-municipalities/${selectedCity}/barangays`)
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

      const res = await axios.post("http://localhost:3000/customer/register", payload);

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

  return (
    <ScrollView>
      <Text>Register</Text>

      <TextInput placeholder="First Name" value={formData.firstName} onChangeText={(val) => handleChange("firstName", val)} />
      <TextInput placeholder="Last Name" value={formData.lastName} onChangeText={(val) => handleChange("lastName", val)} />
      <TextInput placeholder="Email" keyboardType="email-address" value={formData.email} onChangeText={(val) => handleChange("email", val)} />
      <TextInput placeholder="Phone" keyboardType="phone-pad" value={formData.phone} onChangeText={(val) => handleChange("phone", val)} />

      <RNPickerSelect placeholder={{ label: "Select Region", value: null }} items={regions} value={selectedRegion} onValueChange={(val) => setSelectedRegion(val)} />
      <RNPickerSelect placeholder={{ label: "Select Province", value: null }} items={provinces} value={selectedProvince} onValueChange={(val) => setSelectedProvince(val)} />
      <RNPickerSelect placeholder={{ label: "Select City/Municipality", value: null }} items={cities} value={selectedCity} onValueChange={(val) => setSelectedCity(val)} />
      <RNPickerSelect placeholder={{ label: "Select Barangay", value: null }} items={barangays} value={selectedBarangay} onValueChange={(val) => setSelectedBarangay(val)} />

      <TextInput placeholder="Postal Code" value={formData.postalCode} onChangeText={(val) => handleChange("postalCode", val)} />
      <TextInput placeholder="Address Details" value={formData.addressDetails} onChangeText={(val) => handleChange("addressDetails", val)} />

      <TextInput placeholder="Password" secureTextEntry value={formData.password} onChangeText={(val) => handleChange("password", val)} />
      <TextInput placeholder="Confirm Password" secureTextEntry value={formData.confirmPassword} onChangeText={(val) => handleChange("confirmPassword", val)} />

      <TouchableOpacity onPress={handleRegister}>
        <Text>Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

});