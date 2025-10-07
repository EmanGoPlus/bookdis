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

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate("RecievedPromos")}
      >
        <Svg viewBox="0 0 24 24" width={28} height={28} fill="none">
          <Path
            d="M12 7V20M12 7H8.46429C7.94332 7 7.4437 6.78929 7.07533 6.41421C6.70695 6.03914 6.5 5.53043 6.5 5C6.5 4.46957 6.70695 3.96086 7.07533 3.58579C7.4437 3.21071 7.94332 3 8.46429 3C11.2143 3 12 7 12 7ZM12 7H15.5357C16.0567 7 16.5563 6.78929 16.9247 6.41421C17.293 6.03914 17.5 5.53043 17.5 5C17.5 4.46957 17.293 3.96086 16.9247 3.58579C16.5563 3.21071 16.0567 3 15.5357 3C12.7857 3 12 7 12 7ZM5 12H19V17.8C19 18.9201 19 19.4802 18.782 19.908C18.5903 20.2843 18.2843 20.5903 17.908 20.782C17.4802 21 16.9201 21 15.8 21H8.2C7.07989 21 6.51984 21 6.09202 20.782C5.71569 20.5903 5.40973 20.2843 5.21799 19.908C5 19.4802 5 18.9201 5 17.8V12ZM4.6 12H19.4C19.9601 12 20.2401 12 20.454 11.891C20.6422 11.7951 20.7951 11.6422 20.891 11.454C21 11.2401 21 10.9601 21 10.4V8.6C21 8.03995 21 7.75992 20.891 7.54601C20.7951 7.35785 20.6422 7.20487 20.454 7.10899C20.2401 7 19.9601 7 19.4 7H4.6C4.03995 7 3.75992 7 3.54601 7.10899C3.35785 7.20487 3.20487 7.35785 3.10899 7.54601C3 7.75992 3 8.03995 3 8.6V10.4C3 10.9601 3 11.2401 3.10899 11.454C3.20487 11.6422 3.35785 11.7951 3.54601 11.891C3.75992 12 4.03995 12 4.6 12Z"
            stroke="#000"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Add Friend Button */}
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
