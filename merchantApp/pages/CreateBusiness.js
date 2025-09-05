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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";

export default function DefaultPage() {
  const [image, setImage] = useState(null);
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  // Logo picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Combined dropdown state
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [currentLevel, setCurrentLevel] = useState('main'); // 'main' or 'sub'
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState(''); // For "Other" input

  const mainItems = [
    { label: "Retail & Consumer Goods", value: "retail" },
    { label: "Food & Beverage", value: "food" },
    { label: "Services", value: "services" },
    { label: "Health & Fitness", value: "health" },
    { label: "Technology & IT", value: "tech" },
    { label: "Professional Services", value: "pro" },
    { label: "Transportation & Logistics", value: "transport" },
    { label: "Real Estate & Property", value: "realestate" },
    { label: "Arts & Entertainment", value: "arts" },
    { label: "Other", value: "other" },
  ];

  const subCategories = {
    retail: [
      { label: "← Back to Categories", value: "back" },
      { label: "Clothing & Apparel", value: "clothing" },
      { label: "Electronics", value: "electronics" },
      { label: "Grocery / Supermarket", value: "grocery" },
      { label: "Furniture & Home Decor", value: "furniture" },
      { label: "Beauty & Cosmetics", value: "beauty" },
      { label: "Jewelry & Accessories", value: "jewelry" },
      { label: "Books & Stationery", value: "books" },
      { label: "Other", value: "other" },
    ],
    food: [
      { label: "← Back to Categories", value: "back" },
      { label: "Restaurant", value: "restaurant" },
      { label: "Cafe / Coffee Shop", value: "cafe" },
      { label: "Bakery / Pastry Shop", value: "bakery" },
      { label: "Bar / Pub", value: "bar" },
      { label: "Fast Food", value: "fastfood" },
      { label: "Catering Services", value: "catering" },
      { label: "Other", value: "other" },
    ],
    services: [
      { label: "← Back to Categories", value: "back" },
      { label: "Hair & Beauty Salon", value: "salon" },
      { label: "Spa / Wellness", value: "spa" },
      { label: "Cleaning Services", value: "cleaning" },
      { label: "Photography / Videography", value: "photography" },
      { label: "Event Planning", value: "events" },
      { label: "Repair Services", value: "repair" },
      { label: "Tutoring / Education", value: "tutoring" },
      { label: "Other", value: "other" },
    ],
    health: [
      { label: "← Back to Categories", value: "back" },
      { label: "Gym / Fitness Center", value: "gym" },
      { label: "Yoga / Pilates Studio", value: "yoga" },
      { label: "Clinic / Healthcare Provider", value: "clinic" },
      { label: "Pharmacy", value: "pharmacy" },
      { label: "Other", value: "other" },
    ],
    tech: [
      { label: "← Back to Categories", value: "back" },
      { label: "Software Development", value: "software" },
      { label: "Web Design / Development", value: "web" },
      { label: "IT Support / Services", value: "itsupport" },
      { label: "E-commerce", value: "ecommerce" },
      { label: "Other", value: "other" },
    ],
    pro: [
      { label: "← Back to Categories", value: "back" },
      { label: "Accounting / Bookkeeping", value: "accounting" },
      { label: "Legal Services", value: "legal" },
      { label: "Consulting", value: "consulting" },
      { label: "Marketing / Advertising", value: "marketing" },
      { label: "Other", value: "other" },
    ],
    transport: [
      { label: "← Back to Categories", value: "back" },
      { label: "Taxi / Ride-hailing", value: "taxi" },
      { label: "Courier / Delivery Services", value: "courier" },
      { label: "Moving / Relocation Services", value: "moving" },
      { label: "Vehicle Rentals", value: "rentals" },
      { label: "Other", value: "other" },
    ],
    realestate: [
      { label: "← Back to Categories", value: "back" },
      { label: "Real Estate Agency", value: "agency" },
      { label: "Property Management", value: "property" },
      { label: "Construction & Contracting", value: "construction" },
      { label: "Other", value: "other" },
    ],
    arts: [
      { label: "← Back to Categories", value: "back" },
      { label: "Music / Dance Studio", value: "music" },
      { label: "Art Gallery", value: "art" },
      { label: "Theater / Cinema", value: "theater" },
      { label: "Gaming / eSports", value: "gaming" },
      { label: "Other", value: "other" },
    ],
  };

  // Initialize with main categories
  useEffect(() => {
    setItems(mainItems);
  }, []);

  // Handle selection
  const handleSelection = (selectedValue) => {
    if (selectedValue === "back") {
      // Go back to main categories
      setCurrentLevel('main');
      setItems(mainItems);
      setValue(null);
      setSelectedMainCategory(null);
      setCustomCategory(''); // Clear custom input
    } else if (selectedValue === "other") {
      // Selected "Other", keep the selection but don't navigate
      setValue(selectedValue);
      setCustomCategory(''); // Reset custom input when "Other" is selected
    } else if (currentLevel === 'main' && subCategories[selectedValue]) {
      // Selected a main category, show subcategories
      setCurrentLevel('sub');
      setSelectedMainCategory(selectedValue);
      setItems(subCategories[selectedValue]);
      setValue(null);
      setCustomCategory(''); // Clear custom input
    } else {

      setValue(selectedValue);
      setCustomCategory('');
    }
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
        <Text style={styles.text}>Business Information</Text>

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

        <Text style={styles.label}>
          {currentLevel === 'main' ? 'Category' : 'Sub-Category'}
        </Text>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          onSelectItem={(item) => handleSelection(item.value)}
          placeholder={
            currentLevel === 'main' 
              ? "Select main category" 
              : "Select sub-category"
          }
          zIndex={3000}
          zIndexInverse={1000}
        />

        {/* Show text input when "Other" is selected */}
        {value === "other" && (
          <View style={styles.otherInputContainer}>
            <Text style={styles.label}>
              Please specify your {currentLevel === 'main' ? 'category' : 'sub-category'}:
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Enter your ${currentLevel === 'main' ? 'category' : 'sub-category'}`}
              placeholderTextColor="#999"
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          </View>
        )}

        {/* Display selected values for debugging */}
        {selectedMainCategory && (
          <Text style={styles.debugText}>
            Main Category: {mainItems.find(item => item.value === selectedMainCategory)?.label}
          </Text>
        )}
        {value && value !== 'back' && currentLevel === 'sub' && value !== 'other' && (
          <Text style={styles.debugText}>
            Sub Category: {items.find(item => item.value === value)?.label}
          </Text>
        )}
        {value === 'other' && customCategory && (
          <Text style={styles.debugText}>
            Custom {currentLevel === 'main' ? 'Category' : 'Sub-Category'}: {customCategory}
          </Text>
        )}
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
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 15,
    alignSelf: "flex-start",
  },
  debugText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 10,
  },
  otherInputContainer: {
    marginTop: 15,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  form: { marginTop: 20, zIndex: 3000 },
});