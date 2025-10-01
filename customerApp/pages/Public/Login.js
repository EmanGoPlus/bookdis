import React, { useState, useContext } from "react"; // Fixed: useContext instead of userContext
import { CustomerContext } from "../../context/AuthContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_600SemiBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";
import axios from "axios";
import { API_BASE_URL } from "../../apiConfig";

export default function Login({ navigation }) {
  const { login } = useContext(CustomerContext);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
    Roboto_400Regular,
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username/Phone is required");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError(null); 
    if (!validateForm()) return; 

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/customer-login`,
        formData
      );

      if (response.data.message === "Login successful") {
        const { token, customer, memberships } = response.data;
        
        await login({ ...customer, token }, memberships);
        
        setFormData({ username: "", password: "" });
        

        navigation.navigate("Home");
      } else {
        setError(response.data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        setError(err.response.data.error || "Login failed");
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <LinearGradient
        colors={["#23143C", "#4F0CBD", "#6D08B1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.background, styles.centered]}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Login</Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(val) => handleChange("username", val)}
              placeholder="Phone or Username *"
              placeholderTextColor="#666"
              keyboardType="default"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(val) => handleChange("password", val)}
              placeholder="Password *"
              placeholderTextColor="#666"
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#4F0CBD" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signupLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 30, marginTop: 20 },
  headerText: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "Roboto_800ExtraBold",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderColor: "rgba(255, 0, 0, 0.3)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textAlign: "center",
  },
  sectionContainer: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "Roboto_600SemiBold",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  loginButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#4F0CBD",
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
  },
  forgotText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textAlign: "center",
    marginTop: 15,
    textDecorationLine: "underline",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  signupText: { color: "#fff", fontFamily: "Roboto_400Regular" },
  signupLink: { color: "#fff", fontFamily: "Roboto_600SemiBold" },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    marginTop: 10,
  },
});