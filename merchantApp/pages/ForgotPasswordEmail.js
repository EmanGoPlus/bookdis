import React from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import Svg, { Path } from "react-native-svg";

export default function DefaultPage({ navigation }) {
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
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate("Login")}
        >
          <Svg
            width={50}
            height={50}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.7071 4.29289C12.0976 4.68342 12.0976 5.31658 11.7071 5.70711L6.41421 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H6.41421L11.7071 18.2929C12.0976 18.6834 12.0976 19.3166 11.7071 19.7071C11.3166 20.0976 10.6834 20.0976 10.2929 19.7071L3.29289 12.7071C3.10536 12.5196 3 12.2652 3 12C3 11.7348 3.10536 11.4804 3.29289 11.2929L10.2929 4.29289C10.6834 3.90237 11.3166 3.90237 11.7071 4.29289Z"
              fill="#FFFFFF"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.headerText}>Find your Account</Text>

        <View style={styles.form}>
          <Text style={styles.instruction}>Enter your email address</Text>
          <TextInput
            style={styles.input}
            placeholder="Your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate("ForgotPasswordNumber");
          }}
        >
          <Text style={styles.switch}>Search by phone number instead</Text>
        </TouchableOpacity>

        <Image
          style={styles.image}
          source={require("../assets/bookdis-logo.png")}
        />
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
    justifyContent: "flex-start",
    marginTop: 40,
    paddingHorizontal: 20,
  },

  headerText: {
    fontSize: 26,
    color: "#fff",
    marginTop: 20,
    fontFamily: "HessGothic-Bold",
  },
  form: {
    width: "100%",
    marginBottom: 20,
  },
  instruction: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
    color: "#fff", // adjust depending on background
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#FFD882",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonText: {
    fontFamily: "HessGothic-Bold",
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },

  switch: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },

  image: {
    width: 70,
    height: 70,
    resizeMode: "contain",
    position: "absolute", // 👈 take it out of normal layout
    bottom: 20, // distance from bottom
    right: 20, // distance from right,
    marginBottom: 30,
  },
});
