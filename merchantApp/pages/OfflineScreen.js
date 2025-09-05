import React from "react";
import { SafeAreaView, Text, Image, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  return (
    <LinearGradient
      colors={["#ffce54", "#fda610", "#f75c3c"]}
      start={{ x: 0, y: 0 }} // top-left
      end={{ x: 0, y: 1 }} // bottom-left
      style={styles.background}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.text}>This is OFFLINE</Text>
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
  text: {
    fontSize: 20,
    color: "#fff",
  },
});
