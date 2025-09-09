import React from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";

export default function Home({ navigation }) {
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
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Welcome to</Text>
          <Text style={styles.headerText}>Bookdis</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button}onPress={() => {
                  navigation.navigate("CreateBusiness");
                }}>
            <Text style={styles.buttonText}>Add Business</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Select Business</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => {
                  navigation.navigate("Verification");
                }}>
            <Text style={styles.buttonText}>Delete</Text>
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
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 150,
  },
  headerText: {
    fontSize: 52,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
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
});