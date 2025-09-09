import React from "react";
import { SafeAreaView, Text, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import axios from "axios";
import { API_BASE_URL } from "../apiConfig";

export default function DefaultPage() {
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

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
        <Text style={styles.text}>This is the Default Page</Text>
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
    justifyContent: "center", // center vertically
    alignItems: "center",     // center horizontally
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
  },
});
