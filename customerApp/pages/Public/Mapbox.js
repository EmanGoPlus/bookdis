import MapView, { Marker, UrlTile } from "react-native-maps";
import { View, Text, Image, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import * as Location from "expo-location";

export default function PartnerMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mapRegion, setMapRegion] = useState({
    latitude: 13.94,
    longitude: 121.62,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const partners = [
    // Restaurants
    { id: 1, name: "Bookdis", address: "Calmar Homes Lucena", lat: 13.9416, lng: 121.6235, category: "restaurant" },
    { id: 2, name: "Go Plus", address: "Lucena City Proper", lat: 13.937, lng: 121.617, category: "restaurant" },
    { id: 3, name: "Bahay Ko", address: "Near SM City Lucena", lat: 13.941, lng: 121.6175, category: "restaurant" },
    { id: 4, name: "Kape Tayo", address: "Quezon Avenue", lat: 13.9385, lng: 121.6195, category: "restaurant" },
    { id: 5, name: "Lola's", address: "Dalahican Road", lat: 13.9425, lng: 121.6245, category: "restaurant" },
    
    // Grocery
    { id: 6, name: "Fresh Mart", address: "Maharlika Highway", lat: 13.9395, lng: 121.6165, category: "grocery" },
    { id: 7, name: "City Grocery", address: "Rizal Avenue", lat: 13.9405, lng: 121.6185, category: "grocery" },
    { id: 8, name: "Super Save", address: "Ibabang Dupay", lat: 13.9375, lng: 121.6155, category: "grocery" },
    { id: 9, name: "Quick Shop", address: "Gulang-Gulang", lat: 13.9445, lng: 121.6225, category: "grocery" },
    { id: 10, name: "Family Mart", address: "Bocohan", lat: 13.9365, lng: 121.6205, category: "grocery" },
    
    // Gas Stations
    { id: 11, name: "Shell", address: "Pacific Mall Area", lat: 13.9355, lng: 121.6145, category: "gas" },
    { id: 12, name: "Petron", address: "Diversion Road", lat: 13.9435, lng: 121.6215, category: "gas" },
    { id: 13, name: "Caltex", address: "Mayao Crossing", lat: 13.9415, lng: 121.6125, category: "gas" },
    { id: 14, name: "Phoenix", address: "Baguio District", lat: 13.9385, lng: 121.6135, category: "gas" },
    { id: 15, name: "Seaoil", address: "Market View", lat: 13.9395, lng: 121.6115, category: "gas" },
    
    // Pharmacies
    { id: 16, name: "Mercury", address: "SM City Lucena", lat: 13.9405, lng: 121.6175, category: "pharmacy" },
    { id: 17, name: "Watsons", address: "Pacific Mall", lat: 13.9355, lng: 121.6145, category: "pharmacy" },
    { id: 18, name: "Rose Pharmacy", address: "Perez Park Area", lat: 13.9425, lng: 121.6195, category: "pharmacy" },
  ];

  const categories = [
    { key: "all", label: "All", color: "#4F0CBD" },
    { key: "restaurant", label: "Restaurant", color: "#FF6B35" },
    { key: "grocery", label: "Grocery", color: "#2ECC71" },
    { key: "gas", label: "Gas", color: "#E74C3C" },
    { key: "pharmacy", label: "Pharmacy", color: "#3498DB" },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to show your position");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not get your location");
    }
  };

  const filteredPartners = selectedCategory === "all" 
    ? partners 
    : partners.filter(p => p.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.filterButton,
              { backgroundColor: selectedCategory === cat.key ? cat.color : "#fff" }
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={[
              styles.filterText,
              { color: selectedCategory === cat.key ? "#fff" : cat.color }
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maximumZ={19}
        />

        {filteredPartners.map((p) => (
<Marker
  key={p.id}
  coordinate={{ latitude: p.lat, longitude: p.lng }}
  anchor={{ x: 0.5, y: 1 }} // center bottom of the marker
>
  <View style={{ alignItems: "center", maxWidth: 140 }}>
    <Text
      style={{
        fontSize: 10,
        fontWeight: "600",
        textAlign: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
      }}
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {p.name}
    </Text>
    <Image
      source={require("../../assets/pin.png")}
      style={{ width: 30, height: 30 }}
      resizeMode="contain"
    />
  </View>
</Marker>

        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 70,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    width: 100,
    // Remove fixed height, let it size naturally
  },
textContainer: {
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  borderRadius: 4,
  paddingHorizontal: 6,
  paddingVertical: 3,
  marginBottom: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 3,
  maxWidth: 120,        // increase a bit so text fits nicely
  alignSelf: "center",
},
markerText: {
  fontSize: 10,
  fontWeight: "600",
  textAlign: "center",
  color: "#333",
  flexWrap: "wrap",
  width: '100%',        // fill the container width to wrap correctly
},

  pinImage: {
    width: 30,
    height: 30,
  },
});