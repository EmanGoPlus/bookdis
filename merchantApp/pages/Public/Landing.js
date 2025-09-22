import React from "react";
import {
  Text,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Roboto_800ExtraBold, Roboto_600SemiBold } from "@expo-google-fonts/roboto";

export default function LandingPage({ navigation }) {
  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold
  });

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <Image
          style={styles.image}
          source={require("../../assets/bookdis-final-logo.png")}
        />

        <Text style={styles.title}>Bookdis</Text>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.buttonBase, styles.loginButton]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonBase, styles.signUpButton]}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.signUpButtonText}>I'm New, sign me up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          By logging in or registering, you agree to our{" "}
          <Text style={styles.linkText}>Terms of Service</Text> and{" "}
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: -40,
  },
  title: {
        paddingHorizontal: 20,
    marginTop: 30,
    fontSize: 50,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Roboto_800ExtraBold",
    marginBottom: 30,
  },
  buttonWrapper: {
    marginTop: 100,
    width: "100%",
    alignItems: "center",
  },
  buttonBase: {
      height: 65,
  justifyContent: "center",
    borderRadius: 15,
    marginTop: 20,
    width: "90%",
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#fff",
  },
  loginButtonText: {
    fontFamily: "Roboto_600SemiBold",
    fontSize: 16,
    color: "#4B1AA9",
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: "#8D4BFF",
  },
  signUpButtonText: {
    fontFamily: "Roboto_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  footerText: {
    marginTop: 30,
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  linkText: {
    textDecorationLine: "underline",
    fontWeight: "bold",
    color: "#4EB8FA",
  },
});
