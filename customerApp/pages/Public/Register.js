import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Register() {

 const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
 });

  const handleRegiter = () => {

    try {

    } catch (err) {

    }

  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is a blank page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "#333",
  },
});
