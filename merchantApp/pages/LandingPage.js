import React from "react";
import {
  SafeAreaView,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";

export default function LandingPage({ navigation }) {
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
        <Image
          style={styles.image}
          source={require("../assets/bookdis-logo.png")}
        />
        <Text style={styles.text}>bookdis</Text>

        <SafeAreaView style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("MerchantLogin")}
          >
            <Text style={styles.buttonText}>Log in as Owner</Text>
          </TouchableOpacity>

               <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("EmployeeLogin")}
          >
            <Text style={styles.buttonText}>Log in as Employee</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.buttonText}>Create a new account</Text>
          </TouchableOpacity>
        </SafeAreaView>
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
    position: "relative",
    top: -60,
  },

  text: {
    fontSize: 50,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
  },

  buttonWrapper: {
    width: "100%",
    alignItems: "center",
  },

  button: {
    backgroundColor: "#FFD882",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    width: "80%",
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
  },
});
