import React, { useContext, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import axios from "axios";
import { API_BASE_URL } from "../apiConfig";
import { UserContext } from "../context/AuthContext";

export default function DefaultPage() {
  const { user, business, userRole, logout, isEmployee } =
    useContext(UserContext);
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Login");
  };

  const handleClearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all stored data and log you out. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear ALL AsyncStorage data
              await AsyncStorage.clear();
              console.log("✅ AsyncStorage completely cleared");

              // Also call logout to clear context state
              await logout();

              // Navigate to login
              navigation.navigate("Login");
            } catch (error) {
              console.error("❌ Error clearing AsyncStorage:", error);
            }
          },
        },
      ]
    );
  };
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
        <Text style={styles.text}>This is the Default Page</Text>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, styles.logoutButtonText]}>
            NORMAL LOGOUT
          </Text>
        </TouchableOpacity>
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
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
  },
});
