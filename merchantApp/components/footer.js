import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function Footer() {
  const navigation = useNavigation();

const buttons = [
  { name: "Dashboard", icon: <MaterialIcons name="dashboard" size={24} color="#fff" /> },
  { name: "Products", icon: <FontAwesome5 name="box" size={24} color="#fff" /> },
  { name: "Promos", icon: <MaterialIcons name="local-offer" size={24} color="#fff" /> },
  { name: "Notifications", icon: <Ionicons name="notifications-outline" size={24} color="#fff" /> },
  { name: "Profile", icon: <FontAwesome5 name="user-alt" size={24} color="#fff" /> },
];


  return (
    <View style={styles.footerContainer}>
      {buttons.map((btn, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => navigation.navigate(btn.name)}
          activeOpacity={0.7}
        >
          {btn.icon}
          <Text style={styles.buttonText}>{btn.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#f75c3c",
    paddingVertical: 10,
    width: width,
    position: "absolute",
    bottom: 0,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
});
