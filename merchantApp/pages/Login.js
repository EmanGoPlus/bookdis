import React, { useState, useEffect } from "react";
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
import ErrorModal from "../components/errorModal";
import SuccessModal from "../components/successModal";

export default function LandingPage({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [keyboardOffset] = useState(new Animated.Value(0));

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        Animated.timing(keyboardOffset, {
          duration: Platform.OS === 'ios' ? event.duration : 250,
          toValue: -event.endCoordinates.height / 2,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        Animated.timing(keyboardOffset, {
          duration: Platform.OS === 'ios' ? event.duration : 250,
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
    if (!phone || !password) {
      setError("Please fill in all required fields");
      setShowErrorModal(true);
      return;
    }

    const response = await axios.post(
      "http://192.168.1.20:5000/api/users/merchant-login",
      { phone, password },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );

    console.log("Login response:", response.data);

    // Show success modal
    setSuccessMessage("Login successful!");
    setShowSuccessModal(true);

    // Navigate after closing modal
    // This will be handled in the SuccessModal onClose prop
  } catch (err) {
    console.error("Full error object:", err);
    console.error("Login error:", err.response?.data || err.message);

    let errorMessage = "Login failed. Please try again.";

    if (err.response) {
      errorMessage = err.response.data?.error || err.response.data?.details || errorMessage;
    } else if (err.request) {
      errorMessage = "Network error. Please check your connection.";
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
              source={require("../assets/bookdis-logo.png")}
            />

            <Text style={styles.title}>Welcome Back!</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log in</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linkRow}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("ForgotPassword");
                }}
              >
                <Text style={styles.link}>Forgot password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("");
                }}
              >
                <Text style={styles.link}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ScrollView>
      </Animated.View>

      {/* Using the ErrorModal component */}
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
        onClose={() => {
          setShowSuccessModal(false);
          navigation.navigate("Home"); // navigate after closing
        }}
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
    justifyContent: 'center',
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
});