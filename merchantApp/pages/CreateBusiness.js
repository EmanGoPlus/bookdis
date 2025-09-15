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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { API_BASE_URL } from "../apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorModal from "../components/errorModal";
import SuccessModal from "../components/successModal";
import { BUSINESS_CATEGORIES } from "../datas/business-category-datas";

export default function CreateBusiness({ navigation }) {
  const [image, setImage] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  const handleCreateBusiness = async () => {
    // ==== VALIDATION ====

    if (!image) {
      setError("Please upload a business logo.");
      setShowErrorModal(true);
      return;
    }

    if (!businessName.trim()) {
      setError("Business name is required.");
      setShowErrorModal(true);
      return;
    }

    if (!selectedMainCategory && !customMainCategory) {
      setError("Please select a main category.");
      setShowErrorModal(true);
      return;
    }

    if (selectedMainCategory && selectedMainCategory !== "other" && !selectedSubCategory && !customSubCategory) {
      setError("Please select a sub-category.");
      setShowErrorModal(true);
      return;
    }

    if (selectedMainCategory === "other" && !customMainCategory.trim()) {
      setError("Please enter your custom main category.");
      setShowErrorModal(true);
      return;
    }

    if (selectedSubCategory === "other" && !customSubCategory.trim()) {
      setError("Please enter your custom sub-category.");
      setShowErrorModal(true);
      return;
    }

    if (!selectedRegion) {
      setError("Please select a region.");
      setShowErrorModal(true);
      return;
    }

    if (!selectedProvince) {
      setError("Please select a province.");
      setShowErrorModal(true);
      return;
    }

    if (!selectedCity) {
      setError("Please select a city/municipality.");
      setShowErrorModal(true);
      return;
    }

    if (!selectedBarangay) {
      setError("Please select a barangay.");
      setShowErrorModal(true);
      return;
    }

    if (!postalCode.trim() || postalCode.length !== 4 || isNaN(postalCode)) {
      setError("Please enter a valid 4-digit postal code.");
      setShowErrorModal(true);
      return;
    }

    if (!addressDetails.trim()) {
      setError("Please enter address details.");
      setShowErrorModal(true);
      return;
    }

    if (openTime >= closeTime) {
      setError("Open time must be earlier than close time.");
      setShowErrorModal(true);
      return;
    }

    try {
      const formData = new FormData();

      if (image) {
        const filename = image.split("/").pop();
        const fileType = filename.split(".").pop();
        formData.append("logo", {
          uri: image,
          name: filename,
          type: `image/${fileType}`,
        });
      }

      formData.append("businessName", businessName);
      
      // Handle main category
      const finalMainCategory = selectedMainCategory === "other" ? customMainCategory : selectedMainCategory;
      formData.append("mainCategory", finalMainCategory || "");
      
      // Handle sub category
      const finalSubCategory = selectedSubCategory === "other" ? customSubCategory : selectedSubCategory;
      formData.append("subCategory", finalSubCategory || "");
      
      formData.append(
        "region",
        regions.find((r) => r.value === selectedRegion)?.label || ""
      );
      formData.append(
        "province",
        provinces.find((p) => p.value === selectedProvince)?.label || ""
      );
      formData.append(
        "city",
        cities.find((c) => c.value === selectedCity)?.label || ""
      );
      formData.append(
        "barangay",
        barangays.find((b) => b.value === selectedBarangay)?.label || ""
      );
      formData.append("postalCode", postalCode || "");
      formData.append("addressDetails", addressDetails || "");
      formData.append("openTime", formatTime(openTime));
      formData.append("closeTime", formatTime(closeTime));

      const token = await AsyncStorage.getItem("token");

      const res = await axios.post(
        `${API_BASE_URL}/api/user/create-business`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Success modal
      setSuccessMessage("Business created successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);

      // ✅ Error modal
      setError(err.response?.data?.message || "Failed to create business.");
      setShowErrorModal(true);
    }
  };

  const closeErrorModal = () => setShowErrorModal(false);
  const closeSuccessModal = () => setShowSuccessModal(false);

  const resetForm = () => {
    setImage(null);
    setBusinessName("");
    setPostalCode("");
    setAddressDetails("");
    setSelectedRegion(null);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedBarangay(null);
    setSelectedMainCategory(null);
    setSelectedSubCategory(null);
    setCustomMainCategory("");
    setCustomSubCategory("");
    setOpenTime(new Date(2024, 0, 1, 9, 0));
    setCloseTime(new Date(2024, 0, 1, 18, 0));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ==== SEPARATED Category states ====
  // Main Category
  const [openMainCategory, setOpenMainCategory] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [mainCategoryItems, setMainCategoryItems] = useState([]);
  const [customMainCategory, setCustomMainCategory] = useState("");

  // Sub Category  
  const [openSubCategory, setOpenSubCategory] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [subCategoryItems, setSubCategoryItems] = useState([]);
  const [customSubCategory, setCustomSubCategory] = useState("");

  // Time states
  const [openTime, setOpenTime] = useState(new Date(2024, 0, 1, 9, 0)); // 9:00 AM
  const [closeTime, setCloseTime] = useState(new Date(2024, 0, 1, 18, 0)); // 6:00 PM
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);

  // Initialize main categories
  useEffect(() => {
    setMainCategoryItems(BUSINESS_CATEGORIES.main);
  }, []);

  // Handle main category selection and load sub categories
  const handleMainCategoryChange = (value) => {
    setSelectedMainCategory(value);
    setSelectedSubCategory(null); // Reset sub category
    setCustomSubCategory(""); // Reset custom sub category
    
    if (value && value !== "other" && BUSINESS_CATEGORIES.sub[value]) {
      setSubCategoryItems(BUSINESS_CATEGORIES.sub[value]);
    } else {
      setSubCategoryItems([]);
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

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

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
            <TouchableOpacity onPress={pickImage} style={styles.button}>
              <Text style={styles.buttonText}>Upload a Logo</Text>
            </TouchableOpacity>
          </View>

          {/* Business Name */}
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter business name"
            value={businessName}
            onChangeText={setBusinessName}
          />

          {/* SEPARATED Main Category */}
          <Text style={styles.label}>Main Category</Text>
          <DropDownPicker
            open={openMainCategory}
            value={selectedMainCategory}
            items={mainCategoryItems}
            setOpen={setOpenMainCategory}
            setValue={setSelectedMainCategory}
            setItems={setMainCategoryItems}
            onSelectItem={(item) => handleMainCategoryChange(item.value)}
            placeholder="Select main category"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            zIndex={6000}
            zIndexInverse={1000}
          />

          {/* Custom Main Category Input */}
          {selectedMainCategory === "other" && (
            <View style={styles.otherInputContainer}>
              <Text style={styles.label}>Please specify your main category:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your main category"
                placeholderTextColor="#999"
                value={customMainCategory}
                onChangeText={setCustomMainCategory}
              />
            </View>
          )}

          {/* SEPARATED Sub Category - Only show if main category is selected and not "other" */}
          {selectedMainCategory && selectedMainCategory !== "other" && subCategoryItems.length > 0 && (
            <>
              <Text style={styles.label}>Sub-Category</Text>
              <DropDownPicker
                open={openSubCategory}
                value={selectedSubCategory}
                items={subCategoryItems}
                setOpen={setOpenSubCategory}
                setValue={setSelectedSubCategory}
                setItems={setSubCategoryItems}
                placeholder="Select sub-category"
                listMode="SCROLLVIEW"
                style={styles.dropdown}
                zIndex={5500}
                zIndexInverse={1000}
              />

              {/* Custom Sub Category Input */}
              {selectedSubCategory === "other" && (
                <View style={styles.otherInputContainer}>
                  <Text style={styles.label}>Please specify your sub-category:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your sub-category"
                    placeholderTextColor="#999"
                    value={customSubCategory}
                    onChangeText={setCustomSubCategory}
                    zIndex={5000}
                  />
                </View>
              )}
            </>
          )}

          {/* Display selected values for debugging */}
          {(selectedMainCategory || customMainCategory) && (
            <Text style={styles.debugText}>
              Main Category: {selectedMainCategory === "other" ? customMainCategory : 
                mainCategoryItems.find((item) => item.value === selectedMainCategory)?.label || selectedMainCategory}
            </Text>
          )}

          {(selectedSubCategory || customSubCategory) && (
            <Text style={styles.debugText}>
              Sub Category: {selectedSubCategory === "other" ? customSubCategory : 
                subCategoryItems.find((item) => item.value === selectedSubCategory)?.label || selectedSubCategory}
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
            keyboardType="numeric"
            maxLength={4}
            placeholder="Enter postal code"
            value={postalCode}
            onChangeText={setPostalCode}
          />

          <Text style={styles.label}>Address Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter exact address"
            value={addressDetails}
            onChangeText={setAddressDetails}
          />

          {/* Operating Hours */}
          <View>
            <Text style={styles.label}>Open Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowOpenPicker(true)}
            >
              <Text>{formatTime(openTime)}</Text>
            </TouchableOpacity>
            {showOpenPicker && (
              <DateTimePicker
                value={openTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedDate) => {
                  setShowOpenPicker(false);
                  if (selectedDate) setOpenTime(selectedDate);
                }}
              />
            )}
          </View>

          <View>
            <Text style={styles.label}>Close Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowClosePicker(true)}
            >
              <Text>{formatTime(closeTime)}</Text>
            </TouchableOpacity>
            {showClosePicker && (
              <DateTimePicker
                value={closeTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedDate) => {
                  setShowClosePicker(false);
                  if (selectedDate) setCloseTime(selectedDate);
                }}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateBusiness}
          >
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      <ErrorModal
        visible={showErrorModal}
        title="Login Failed"
        message={error}
        buttonText="Try Again"
        onClose={closeErrorModal}
        iconColor="#ff4757"
        buttonColor="#ff4757"
      />

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => {
          setShowSuccessModal(false);
          resetForm();
          navigation.navigate("Verification");
        }}
      />
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

  text: {
    marginTop: 45,
    fontSize: 35,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
  },

  imageContainer: {
    alignItems: "center",
    marginTop: 20,
  },

  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#fff",
  },

  button: {
    marginTop: 15,
    backgroundColor: "#FFD882",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "HessGothic-Bold",
  },

  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
  },

  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    fontSize: 16,
    justifyContent: "center",
  },

  dropdown: {
    marginBottom: 10,
  },

  otherInputContainer: {
    marginTop: 10,
  },

  debugText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
    fontStyle: "italic",
  },
});