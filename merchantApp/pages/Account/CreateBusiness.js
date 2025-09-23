import React, { useState, useEffect, useContext } from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { API_BASE_URL } from "../../apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorModal from "../../components/errorModal";
import SuccessModal from "../../components/successModal";
import { BUSINESS_CATEGORIES } from "../../datas/business-category-datas";
import { UserContext } from "../../context/AuthContext";
import Svg, { Path, Circle } from "react-native-svg";
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_600SemiBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";

export default function CreateBusiness({ navigation }) {
  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });

  // Add UserContext
  const { user, login, selectBusiness } = useContext(UserContext);

  // Basic form states
  const [image, setImage] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Category states
  const [openMainCategory, setOpenMainCategory] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [mainCategoryItems, setMainCategoryItems] = useState([]);
  const [customMainCategory, setCustomMainCategory] = useState("");

  const [openSubCategory, setOpenSubCategory] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [subCategoryItems, setSubCategoryItems] = useState([]);
  const [customSubCategory, setCustomSubCategory] = useState("");

  // Time states
  const [openTime, setOpenTime] = useState(null);
  const [closeTime, setCloseTime] = useState(null);
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);

  // Address states
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

  // ✅ FIXED: All useEffect hooks moved after state declarations and before early returns

  // Initialize main categories
  useEffect(() => {
    setMainCategoryItems(BUSINESS_CATEGORIES.main);
  }, []);

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
  const handleCreateBusiness = async () => {

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

    if (
      selectedMainCategory &&
      selectedMainCategory !== "other" &&
      !selectedSubCategory &&
      !customSubCategory
    ) {
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

      const finalMainCategory =
        selectedMainCategory === "other"
          ? customMainCategory
          : selectedMainCategory;
      formData.append("mainCategory", finalMainCategory || "");

      const finalSubCategory =
        selectedSubCategory === "other"
          ? customSubCategory
          : selectedSubCategory;
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

      const createdBusiness = res.data.data || res.data;
      console.log("Business created successfully:", createdBusiness);

      if (createdBusiness) {
        await selectBusiness(createdBusiness);
      }

      setSuccessMessage("Business created successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);

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
    setOpenTime(null);
    setCloseTime(null);
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


  const handleMainCategoryChange = (value) => {
    setSelectedMainCategory(value);
    setSelectedSubCategory(null);
    setCustomSubCategory("");

    if (value && value !== "other" && BUSINESS_CATEGORIES.sub[value]) {
      setSubCategoryItems(BUSINESS_CATEGORIES.sub[value]);
    } else {
      setSubCategoryItems([]);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
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
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
              <Svg width={15} height={44} viewBox="0 0 15 44" fill="none">
                <Path
                  d="M13.2656 10L1.73438 21.5312L13.2656 33.0625"
                  stroke="#672BBA"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.text}>Business Information</Text>
          </View>

          <View style={styles.imageContainer}>
      
            <Svg
              width={170}
              height={170}
              viewBox="0 0 170 170"
              style={styles.svgCircle}
            >
              <Circle
                cx="85"
                cy="85"
                r="80" 
                fill="white"
                stroke="#CAC8FF"
                strokeWidth={9}
              />
            </Svg>

            <Image
              source={
                image ? { uri: image } : require("../../assets/blank.png")
              }
              style={styles.logoImage}
            />

            <TouchableOpacity onPress={pickImage} style={styles.addButton}>
              <Text style={styles.addLogoText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View style={styles.innerInputContainer}>
                <Text style={styles.label}>Business name</Text>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View
                style={[
                  styles.innerInputContainer,
                  { zIndex: 6000, elevation: 6000 },
                ]}
              >
                <Text style={styles.label}>Main Category</Text>
                <DropDownPicker
                  open={openMainCategory}
                  value={selectedMainCategory}
                  items={mainCategoryItems}
                  setOpen={setOpenMainCategory}
                  setValue={setSelectedMainCategory}
                  setItems={setMainCategoryItems}
                  onSelectItem={(item) => handleMainCategoryChange(item.value)}
                  listMode="MODAL"
                  style={styles.dropdownInsideInput}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    { zIndex: 9999, elevation: 9999 },
                  ]}
                  placeholder="Select"
                  zIndex={6000}
                  zIndexInverse={1000}
                />
              </View>
            </LinearGradient>

            {selectedMainCategory === "other" && (
              <LinearGradient
                colors={["#B13BFF", "#5C0AE4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorderContainer}
              >
                <View style={styles.innerInputContainer}>
                  <Text style={styles.label}>Enter your main category</Text>
                  <TextInput
                    style={styles.input}
                    value={customMainCategory}
                    onChangeText={setCustomMainCategory}
                  />
                </View>
              </LinearGradient>
            )}


            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View
                style={[
                  styles.innerInputContainer,
                  { zIndex: 5500, elevation: 5500 },
                ]}
              >
                <Text style={styles.label}>Sub Category</Text>
                <DropDownPicker
                  open={openSubCategory}
                  value={selectedSubCategory}
                  items={subCategoryItems}
                  setOpen={setOpenSubCategory}
                  setValue={setSelectedSubCategory}
                  setItems={setSubCategoryItems}
                  listMode="MODAL"
                  style={styles.dropdownInsideInput}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    { zIndex: 9998, elevation: 9998 },
                  ]}
                  placeholder="Select"
                  zIndex={5500}
                  zIndexInverse={1000}
                />
              </View>
            </LinearGradient>


            {selectedSubCategory === "other" && (
              <LinearGradient
                colors={["#B13BFF", "#5C0AE4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorderContainer}
              >
                <View style={styles.innerInputContainer}>
                  <Text style={styles.label}>Enter your sub-category</Text>
                  <TextInput
                    style={styles.input}
                    value={customSubCategory}
                    onChangeText={setCustomSubCategory}
                  />
                </View>
              </LinearGradient>
            )}

            <Text style={styles.groupLabel}>Address</Text>

            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View
                style={[
                  styles.innerInputContainer,
                  { zIndex: 4000, elevation: 4000 },
                ]}
              >
                <Text style={styles.label}>Region</Text>
                <DropDownPicker
                  open={openRegion}
                  value={selectedRegion}
                  items={regions}
                  setOpen={setOpenRegion}
                  setValue={setSelectedRegion}
                  listMode="MODAL"
                  style={styles.dropdownInsideInput}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    { zIndex: 9997, elevation: 9997 },
                  ]}
                  placeholder="Select Region"
                  zIndex={4000}
                />
              </View>
            </LinearGradient>


            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View
                style={[
                  styles.innerInputContainer,
                  { zIndex: 3000, elevation: 3000 },
                ]}
              >
                <Text style={styles.label}>Province</Text>
                <DropDownPicker
                  open={openProvince}
                  value={selectedProvince}
                  items={provinces}
                  setOpen={setOpenProvince}
                  setValue={setSelectedProvince}
                  listMode="MODAL"
                  style={styles.dropdownInsideInput}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    { zIndex: 9996, elevation: 9996 },
                  ]}
                  placeholder="Select Province"
                  zIndex={3000}
                />
              </View>
            </LinearGradient>


            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View
                style={[
                  styles.innerInputContainer,
                  { zIndex: 2000, elevation: 2000 },
                ]}
              >
                <Text style={styles.label}>City/Municipality</Text>
                <DropDownPicker
                  open={openCity}
                  value={selectedCity}
                  items={cities}
                  setOpen={setOpenCity}
                  setValue={setSelectedCity}
                  listMode="MODAL"
                  style={styles.dropdownInsideInput}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    { zIndex: 9995, elevation: 9995 },
                  ]}
                  placeholder="Select City"
                  zIndex={2000}
                />
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View
                style={[
                  styles.innerInputContainer,
                  { zIndex: 1000, elevation: 1000 },
                ]}
              >
                <Text style={styles.label}>Barangay</Text>
                <DropDownPicker
                  open={openBarangay}
                  value={selectedBarangay}
                  items={barangays}
                  setOpen={setOpenBarangay}
                  setValue={setSelectedBarangay}
                  listMode="MODAL"
                  style={styles.dropdownInsideInput}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    { zIndex: 9994, elevation: 9994 },
                  ]}
                  placeholder="Select Barangay"
                  zIndex={1000}
                />
              </View>
            </LinearGradient>


            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View style={styles.innerInputContainer}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={4}
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </LinearGradient>


            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View style={styles.innerInputContainer}>
                <Text style={styles.label}>Address Details</Text>
                <TextInput
                  style={styles.input}
                  value={addressDetails}
                  onChangeText={setAddressDetails}
                />
              </View>
            </LinearGradient>

            <Text style={styles.groupLabel}>Operation Time</Text>


            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View style={styles.innerInputContainer}>
                <Text style={styles.label}>Open Time</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowOpenPicker(true)}
                >
                  {openTime ? (
                    <Text style={styles.timeText}>{formatTime(openTime)}</Text>
                  ) : (
                    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                      <Path
                        d="M10.6751 5.79051V10.7191L9.19657 13.1834M19.5466 10.7191C19.5466 15.6187 15.5747 19.5905 10.6751 19.5905C5.77559 19.5905 1.80371 15.6187 1.80371 10.7191C1.80371 5.81953 5.77559 1.84766 10.6751 1.84766C15.5747 1.84766 19.5466 5.81953 19.5466 10.7191Z"
                        stroke="#C5B8F4"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>

                {showOpenPicker && (
                  <DateTimePicker
                    value={openTime || new Date()}
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
            </LinearGradient>

            <LinearGradient
              colors={["#B13BFF", "#5C0AE4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorderContainer}
            >
              <View style={styles.innerInputContainer}>
                <Text style={styles.label}>Close Time</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowClosePicker(true)}
                >
                  {closeTime ? (
                    <Text style={styles.timeText}>{formatTime(closeTime)}</Text>
                  ) : (
                    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                      <Path
                        d="M10.6751 5.79051V10.7191L9.19657 13.1834M19.5466 10.7191C19.5466 15.6187 15.5747 19.5905 10.6751 19.5905C5.77559 19.5905 1.80371 15.6187 1.80371 10.7191C1.80371 5.81953 5.77559 1.84766 10.6751 1.84766C15.5747 1.84766 19.5466 5.81953 19.5466 10.7191Z"
                        stroke="#C5B8F4"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>

                {showClosePicker && (
                  <DateTimePicker
                    value={closeTime || new Date()}
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
            </LinearGradient>

            <TouchableOpacity
              onPress={handleCreateBusiness}
              style={{ width: "100%" }}
            >
              <LinearGradient
                colors={["#5C0AE4", "#6A13D8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 10,
  },

header: {
  flexDirection: "row",     
  alignItems: "center",   
  gap: 30,                   
  padding: 10,             
},
text: {
  fontSize: 27,
  fontFamily: "Roboto_800ExtraBold",
  color: "#fff",
  lineHeight: 44,            
},


  imageContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 150,
    height: 150,
    alignSelf: "center",
  },

  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "#fff",
  },

  svgCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -85 }, { translateY: -85 }], 
  },

  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#B00AFD",
    position: "absolute",
    bottom: -15,
    right: -15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  addLogoText: {
    color: "#fff",
    fontSize: 40,
    textAlign: "center",
  },

  form: {
    marginTop: 50,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },

inputContainer: {
  backgroundColor: "transparent", 
  borderRadius: 14,
  width: "100%",
  height: "100%",
  position: "relative",
},

gradientBorderContainer: {
  borderRadius: 15,
  padding: 1,           
  width: "100%",
  height: 65,
  overflow: "hidden", 
  alignSelf: "stretch",
  marginBottom: 8,
},

innerInputContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 14,
  paddingHorizontal: 16,
  height: "100%",
  width: "100%",
  position: "relative",

},


label: {
  position: "absolute",
  top: 8,
  left: 16,
  fontSize: 14,
  color: "#A397CF",
  fontFamily: "Roboto_400Regular",
  zIndex: 2,
},
input: {
  flex: 1,
  fontSize: 16,
  color: "#000",
  height: "100%",
  paddingTop: 22,
  paddingLeft: 0,
},

  dropdownInsideInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    height: "100%",
    paddingTop: 20,
    justifyContent: "center",
  },

  dropdownContainer: {
    borderColor: "#4B1AA9",
    borderRadius: 15,
    backgroundColor: "#fff",
    elevation: 1000,
  },

  timeInput: {
    height: "100%",
    justifyContent: "center",
    paddingTop: 16,
  },

  timeText: {
    fontSize: 16,
    color: "#000",
  },

  button: {
    height: 65,
    justifyContent: "center",
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    fontFamily: "Roboto_800ExtraBold",
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },

  cancelButton: {
    backgroundColor: "#fff",
    height: 65,
    justifyContent: "center",
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },

  cancelButtonText: {
    fontFamily: "Roboto_800ExtraBold",
    fontSize: 18,
    color: "#702BC7",
    fontWeight: "700",
  },

  groupLabel: {
    fontSize: 17,
    color: "#fff",
    fontFamily: "Roboto_600SemiBold",
    textAlign: "left",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
});
