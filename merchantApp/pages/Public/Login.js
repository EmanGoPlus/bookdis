import React, { useState, useEffect, useContext } from "react";
import {
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import ErrorModal from "../../components/errorModal";
import SuccessModal from "../../components/successModal";
import { API_BASE_URL } from "../../apiConfig";
import { UserContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";
import {
  useFonts,
  Roboto_800ExtraBold,
  Roboto_600SemiBold,
} from "@expo-google-fonts/roboto";

export default function Login({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [keyboardOffset] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_800ExtraBold,
    Roboto_600SemiBold,
  });

  // Get context after hooks
  const { login } = useContext(UserContext);

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

  const handleLogin = async () => {
    try {
      if (!username || !password) {
        setError("Please enter both username/phone and password");
        setShowErrorModal(true);
        return;
      }

      console.log("Starting combined login...");
      console.log("API URL:", `${API_BASE_URL}/api/user/login`);

      const response = await axios.post(
        `${API_BASE_URL}/api/user/login`,
        { username, password }, // username can be either username or phone
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      console.log(
        "Full response data:",
        JSON.stringify(response.data, null, 2)
      );

      const { token, user, userType, business } = response.data;

      console.log("User object:", user);
      console.log("User type:", userType);

      if (userType === "employee") {
        if (!user.businessId) {
          console.error("businessId is missing for employee:", user.businessId);
          setError("Employee account setup incomplete. Contact admin.");
          setShowErrorModal(true);
          return;
        }

        // If business data wasn't included in response, fetch it
        let businessData = business;
        if (!businessData && user.businessId) {
          console.log(
            `Fetching business data for businessId: ${user.businessId}`
          );
          try {
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
            businessData = businessResponse.data.data || businessResponse.data;
          } catch (businessError) {
            console.error("Failed to fetch business data:", businessError);
          }
        }

        await login(user, token, "employee", businessData);
      } else if (userType === "merchant") {
        await login(user, token, "merchant", business);
      }

      console.log("Login complete");
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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
              style={styles.logo}
              source={require("../../assets/logo2.png")}
            />

            <View style={styles.form}>
              {/* Username input */}
              <LinearGradient
                colors={["#B13BFF", "#5C0AE4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorderContainer}
              >
                <View style={styles.innerInputContainer}>
                  <Svg width={19} height={29} viewBox="0 0 19 29" fill="none">
                    <Path
                      d="M13.7 1.89999H5.29998C2.98038 1.89999 1.09998 3.7804 1.09998 6.09999V22.9C1.09998 25.2196 2.98038 27.1 5.29998 27.1H13.7C16.0196 27.1 17.9 25.2196 17.9 22.9V6.09999C17.9 3.7804 16.0196 1.89999 13.7 1.89999Z"
                      stroke="#C047F8"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* small circle at the bottom center */}
                    <Circle
                      cx={9.5} // center horizontally (width / 2)
                      cy={22} // vertical position near bottom
                      r={1.2} // radius of the dot
                      fill="#C047F8" // same color as stroke
                    />
                  </Svg>

                  <TextInput
                    style={styles.input}
                    placeholder="Phone / Username"
                    value={username}
                    onChangeText={setUsername}
                    keyboardType="default"
                    autoCapitalize="none"
                    placeholderTextColor="#9D87FF"
                  />
                </View>
              </LinearGradient>
              {/* Password input */}
              <LinearGradient
                colors={["#B13BFF", "#5C0AE4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorderContainer}
              >
                <View style={styles.innerInputContainer}>
                  <Svg width={21} height={26} viewBox="0 0 21 26" fill="none">
                    <Path
                      d="M10.5 17V20.2M16.8333 10.6V7.4C16.8333 5.70261 16.1661 4.07475 14.9783 2.87452C13.7906 1.67428 12.1797 1 10.5 1C8.8203 1 7.20939 1.67428 6.02166 2.87452C4.83393 4.07475 4.16667 5.70261 4.16667 7.4V10.6M18.4167 25H2.58333C2.16341 25 1.76068 24.8314 1.46375 24.5314C1.16681 24.2313 1 23.8243 1 23.4V12.2C1 11.7757 1.16681 11.3687 1.46375 11.0686C1.76068 10.7686 2.16341 10.6 2.58333 10.6H18.4167C18.8366 10.6 19.2393 10.7686 19.5363 11.0686C19.8332 11.3687 20 11.7757 20 12.2V23.4C20 23.8243 19.8332 24.2313 19.5363 24.5314C19.2393 24.8314 18.8366 25 18.4167 25Z"
                      stroke="#C047F8"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>

                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder="Password"
                    placeholderTextColor="#9D87FF"
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
              </LinearGradient>
              <LinearGradient
                colors={["#5C0AE4", "#6A13D8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <TouchableOpacity
                  onPress={handleLogin}
                  style={{ width: "100%", alignItems: "center" }}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <View style={styles.linkRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPasswordEmail")}
              >
                <Text style={styles.link}>Forgot password</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
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

  logo: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginTop: -60,
  },

  form: {
    marginTop: 100,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    width: "100%",
    height: 65,
  },
  gradientBorderContainer: {
    borderRadius: 15,
    padding: 1,
    marginBottom: 16,
    width: "100%",
    height: 65,
  },

  innerInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: "100%",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
    paddingLeft: 12,
  },
  eyeButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  loginButton: {
      height: 65,
  justifyContent: "center",
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    overflow: "hidden",
  },
  loginButtonText: {
    fontFamily: "Roboto_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },

  // Link Styles
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 400,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  link: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
