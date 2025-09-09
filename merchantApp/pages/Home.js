import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../apiConfig";

export default function Home({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("⚠️ No token found in AsyncStorage");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/merchant/my-businesses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Businesses response:", response.data);

        setBusinesses(response.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching businesses:", err.message);
      }
    };

    fetchBusinesses();
  }, []);

  return (
    <LinearGradient
      colors={["#ffce54", "#fda610", "#f75c3c"]}
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
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Welcome to</Text>
          <Text style={styles.headerText}>Bookdis</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate("CreateBusiness")}
          >
            <Text style={styles.buttonText}>Add Business</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Your Business</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBusinessId}
                onValueChange={(itemValue) => {
                  console.log("🏢 Selected business ID:", itemValue);
                  setSelectedBusinessId(itemValue);
                }}
                style={styles.picker}
                dropdownIconColor="#666"
              >
                <Picker.Item label="-- Choose Business --" value="" />
                {businesses.map((biz) => (
                  <Picker.Item
                    key={biz.id}
                    label={biz.businessName}
                    value={biz.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate("Verification")}
          >
            <Text style={styles.buttonText}>Verification (Temporary)</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 120,
    gap: 20,
  },
  headerText: {
    fontSize: 48,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontFamily: "HessGothic-Bold",
    fontSize: 16,
    color: "#f75c3c",
    fontWeight: "600",
  },
  
  // Card Styles
  card: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "HessGothic-Bold",
    marginBottom: 16,
    textAlign: "center",
  },

  // Picker Styles
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  picker: { 
    height: 52, 
    color: "#495057"
  },
});