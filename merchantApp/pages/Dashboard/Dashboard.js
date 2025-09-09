import React from "react";
import { SafeAreaView, Text, StyleSheet, StatusBar, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import axios from "axios";
import Footer from "../../components/footer";
import { API_BASE_URL } from "../../apiConfig";

export default function DefaultPage() {
  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
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
        <Text style={styles.text}>My Dashboard</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Verification")}
        >
          <Text style={styles.buttonText}>CREDITS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.buttonText}>SALES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Verification")}
        >
          <Text style={styles.buttonText}>MEMBERS</Text>
        </TouchableOpacity>

<TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate("Dashboard")}
>
  <Text style={[styles.buttonText]}>QR SCANNER</Text>
</TouchableOpacity>
  <Footer />
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
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginTop: 20,
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
    fontSize: 60,
    color: "#f75c3c",
    fontWeight: "600",
  },
});
