import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { CustomerContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const Header = () => {
  const { customer, logout } = useContext(CustomerContext);
  const navigation = useNavigation();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        Welcome, {customer.firstName || customer.name || "Guest"}!
      </Text>

      {/* 🧾 Claimed Promos Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate("ClaimedPromos")}
      >
        <Svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000"
          strokeWidth={1.9}
          strokeMiterlimit={10}
          strokeLinecap="square"
        >
          <Path d="M22.5 4.36V19.64H1.5V14.86a2.86 2.86 0 0 0 0-5.72V4.36Z" />
          <Line x1="8.18" y1="8.18" x2="10.09" y2="8.18" />
          <Line x1="8.18" y1="12" x2="10.09" y2="12" />
          <Line x1="8.18" y1="15.82" x2="10.09" y2="15.82" />
        </Svg>
      </TouchableOpacity>

      {/* 👥 Add Friend Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate("AddFriend")}
      >
        <Svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000"
          strokeWidth={1.5}
        >
          <Path d="M15 12v-2h-2V8h2V6h2v2h2v2h-2v2h-2zm-7 1a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM2 18v-1.5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V18z" />
        </Svg>
      </TouchableOpacity>

      {/* 🚪 Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  iconButton: {
    marginHorizontal: 8,
  },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
