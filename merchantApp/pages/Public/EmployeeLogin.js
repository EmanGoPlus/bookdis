import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import axios from "axios";
import ErrorModal from "../../components/errorModal";
import SuccessModal from "../../components/successModal";
import { API_BASE_URL } from "../../apiConfig";
import { UserContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function Login({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [keyboardOffset] = useState(new Animated.Value(0));

  const { login } = useContext(UserContext);

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        Animated.timing(keyboardOffset, {
          duration: Platform.OS === "ios" ? event.duration : 250,
          toValue: -event.endCoordinates.height / 2,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        Animated.timing(keyboardOffset, {
          duration: Platform.OS === "ios" ? event.duration : 250,
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [keyboardOffset]);

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    try {
      if (!username || !password) {
        setError("Please enter both username and password");
        setShowErrorModal(true);
        return;
      }

      console.log("Starting employee login...");
      console.log("API URL:", `${API_BASE_URL}/api/user/employee-login`);

      const response = await axios.post(
        `${API_BASE_URL}/api/user/employee-login`,
        { username, password },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      console.log(
        "Full response data:",
        JSON.stringify(response.data, null, 2)
      );

      const { token, user } = response.data;

      console.log("User object:", user);
      console.log("User businessId:", user.businessId);
      console.log("businessId type:", typeof user.businessId);

      if (!user.businessId) {
        console.error("businessId is missing or falsy:", user.businessId);
        setError("Employee account setup incomplete. Contact admin.");
        setShowErrorModal(true);
        return;
      }

      console.log(`Fetching business data for businessId: ${user.businessId}`);

      const businessResponse = await axios.get(
        `${API_BASE_URL}/api/user/business/${user.businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log(
        "Business response:",
        JSON.stringify(businessResponse.data, null, 2)
      );

      const businessData = businessResponse.data.data || businessResponse.data;

      console.log("Final business data:", businessData);

      await login(user, token, "employee", businessData);

      console.log("Employee login complete");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response?.data);

      let errorMessage = "Login failed. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data?.error ||
          err.response.data?.message ||
          err.response.data?.details ||
          errorMessage;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setShowErrorModal(true);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  return (
    <LinearGradient
      colors={["#ffce54", "#fda610", "#f75c3c"]}
      style={styles.background}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <Animated.View
        style={[
          styles.animatedContainer,
          { transform: [{ translateY: keyboardOffset }] },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView style={styles.container}>
            <Image
              style={styles.image}
              source={require("../../assets/bookdis-logo.png")}
            />

            <Text style={styles.title}>Welcome Back!</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                keyboardType="default"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log in</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linkRow}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("ForgotPasswordEmail");
                }}
              >
                <Text style={styles.link}>Forgot password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("Register");
                }}
              >
                <Text style={styles.link}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ScrollView>
      </Animated.View>

      <ErrorModal
        visible={showErrorModal}
        title="Login Failed"
        message={error}
        buttonText="Try Again"
        onClose={closeErrorModal}
        iconColor="#ff4757"
        buttonColor="#ff4757"
      />

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  animatedContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
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
    marginTop: -60,
  },

  title: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    marginBottom: 20,
    marginTop: 40,
  },

  form: {
    width: "80%",
    alignItems: "center",
  },

  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 5,
    marginTop: 15,
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "transparent",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    fontSize: 16,
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

  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginTop: 20,
  },

  link: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "transparent",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    fontSize: 16,
    marginBottom: 15, // optional to match spacing
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },

  eyeButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
