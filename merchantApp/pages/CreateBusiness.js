import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView, // ✅ add ScrollView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";

import { BUSINESS_CATEGORIES } from "../datas/business-category-datas";

export default function CreateBusiness() {
  const [image, setImage] = useState(null);
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ==== Category states (unchanged) ====
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [currentLevel, setCurrentLevel] = useState("main");
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    setItems(BUSINESS_CATEGORIES.main);
  }, []);

  const handleSelection = (selectedValue) => {
    if (selectedValue === "back") {
      setCurrentLevel("main");
      setItems(BUSINESS_CATEGORIES.main);
      setValue(null);
      setSelectedMainCategory(null);
      setCustomCategory("");
    } else if (selectedValue === "other") {
      setValue(selectedValue);
      setCustomCategory("");
    } else if (
      currentLevel === "main" &&
      BUSINESS_CATEGORIES.sub[selectedValue]
    ) {
      setCurrentLevel("sub");
      setSelectedMainCategory(selectedValue);
      setItems(BUSINESS_CATEGORIES.sub[selectedValue]);
      setValue(null);
      setCustomCategory("");
    } else {
      setValue(selectedValue);
      setCustomCategory("");
    }
  };

  // ==== Address states ====
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  const [openRegion, setOpenRegion] = useState(false);
  const [openProvince, setOpenProvince] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openBarangay, setOpenBarangay] = useState(false);

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

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={["#ffce54", "#fda610", "#f75c3c"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          <Text style={styles.text}>Business Information</Text>

          {/* Logo */}
          <View style={styles.imageContainer}>
            <Image
              source={
                image ? { uri: image } : require("../assets/default-image.png")
              }
              style={styles.logoImage}
            />
            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload a Logo</Text>
            </TouchableOpacity>
          </View>

          {/* Business Name */}
          <Text style={styles.label}>Business Name</Text>
          <TextInput style={styles.input} autoCapitalize="words"
          placeholder="Enter business name" />

          {/* Category */}
          <Text style={styles.label}>
            {currentLevel === "main" ? "Category" : "Sub-Category"}
          </Text>

          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            setItems={setItems} // 👈 make sure to add this back
            onSelectItem={(item) => handleSelection(item.value)}
            placeholder={
              currentLevel === "main"
                ? "Select main category"
                : "Select sub-category"
            }
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            zIndex={5000}
            zIndexInverse={1000}
          />

          {/* Show text input when "Other" is selected */}
          {value === "other" && (
            <View style={styles.otherInputContainer}>
              <Text style={styles.label}>
                Please specify your{" "}
                {currentLevel === "main" ? "category" : "sub-category"}:
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={`Enter your ${
                  currentLevel === "main" ? "category" : "sub-category"
                }`}
                placeholderTextColor="#999"
                value={customCategory}
                onChangeText={setCustomCategory}
              />
            </View>
          )}

          {/* Display selected values for debugging */}
          {selectedMainCategory && (
            <Text style={styles.debugText}>
              Main Category:{" "}
              {
                BUSINESS_CATEGORIES.main.find(
                  (item) => item.value === selectedMainCategory
                )?.label
              }
            </Text>
          )}

          {value &&
            value !== "back" &&
            currentLevel === "sub" &&
            value !== "other" && (
              <Text style={styles.debugText}>
                Sub Category:{" "}
                {items.find((item) => item.value === value)?.label}
              </Text>
            )}

          {value === "other" && customCategory && (
            <Text style={styles.debugText}>
              Custom {currentLevel === "main" ? "Category" : "Sub-Category"}:{" "}
              {customCategory}
            </Text>
          )}

          {/* Address dropdowns */}
          <Text style={styles.label}>Region</Text>
          <DropDownPicker
            open={openRegion}
            value={selectedRegion}
            items={regions}
            setOpen={setOpenRegion}
            setValue={setSelectedRegion}
            placeholder="Select Region"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            zIndex={4000}
          />

          <Text style={styles.label}>Province</Text>
          <DropDownPicker
            open={openProvince}
            value={selectedProvince}
            items={provinces}
            setOpen={setOpenProvince}
            setValue={setSelectedProvince}
            placeholder="Select Province"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            zIndex={3000}
          />

          <Text style={styles.label}>City / Municipality</Text>
          <DropDownPicker
            open={openCity}
            value={selectedCity}
            items={cities}
            setOpen={setOpenCity}
            setValue={setSelectedCity}
            placeholder="Select City"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            zIndex={2000}
          />

          <Text style={styles.label}>Barangay</Text>
          <DropDownPicker
            open={openBarangay}
            value={selectedBarangay}
            items={barangays}
            setOpen={setOpenBarangay}
            setValue={setSelectedBarangay}
            placeholder="Select Barangay"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            zIndex={1000}
          />

          <Text style={styles.label}>Postal Code</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric" // 👈 makes keyboard show numbers only
            maxLength={4} // 👈 optional, limit postal code length (PH is 4 digits)
            placeholder="Enter postal code"
          />

          <Text style={styles.label}>Address Details</Text>
          <TextInput style={styles.input} autoCapitalize="words"
          placeholder="Enter exact address" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  text: {
    marginTop: 45,
    fontSize: 35,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
  },
  imageContainer: { alignItems: "center", marginTop: 20 },
  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadButton: {
    marginTop: 15,
    backgroundColor: "#FFD882",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "HessGothic-Bold",
  },
  label: { color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 15 },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    fontSize: 16,
  },
  dropdown: { marginBottom: 10 },
});
