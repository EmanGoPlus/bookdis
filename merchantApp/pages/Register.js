import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import ErrorModal from "../components/errorModal";
import SuccessModal from "../components/successModal";

export default function Register({ navigation }) {
  const [checked, setChecked] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "merchant",
  });

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignup = async () => {
    try {
      const { firstName, lastName, email, phone, password, role } = formData;

      if (!firstName || !lastName || !email || !phone || !password) {
        setError("Please fill in all required fields");
        setShowErrorModal(true);
        return;
      }

      console.log("Sending data:", { firstName, lastName, email, phone, role });

      const response = await axios.post(
        "http://192.168.1.20:5000/api/users/merchant-register",
        { firstName, lastName, password, email, phone, role },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      console.log("Register:", response.data);

      setSuccessMessage("Your account has been created successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Signup error:", err.response?.data || err.message);

      let errorMessage = "Signup failed. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data?.error ||
          err.response.data?.details ||
          errorMessage;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      setShowErrorModal(true);
    }
  };

  const handleAcceptTerms = () => {
    setChecked(true);
    setShowTermsModal(false);
  };

  const handleDeclineTerms = () => {
    setChecked(false);
    setShowTermsModal(false);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Image
                style={styles.image}
                source={require("../assets/bookdis-logo.png")}
              />
              <Text style={styles.title}>Sign Up</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange("firstName", value)}
                keyboardType="default"
                returnKeyType="next"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange("lastName", value)}
                keyboardType="default"
                returnKeyType="next"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                returnKeyType="next"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                keyboardType="phone-pad"
                returnKeyType="next"
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
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

              <Text style={styles.label}>Re-enter Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  onPress={() => setConfirmShowPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setChecked(!checked)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, checked && styles.checkedBox]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.checkboxLabel}>I agree to the </Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <Text style={styles.seeMoreText}>Terms & Conditions</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, !checked && styles.disabledButton]}
                onPress={checked ? handleSignup : null}
                activeOpacity={checked ? 0.8 : 1}
                disabled={!checked}
              >
                <Text
                  style={[
                    styles.buttonText,
                    !checked && styles.disabledButtonText,
                  ]}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.termsContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.termsText}>
                <Text style={styles.boldText}>
                  1. Acceptance of Terms{"\n"}
                </Text>
                By accessing and using this application, you accept and agree to
                be bound by the terms and provision of this agreement.{"\n\n"}
                <Text style={styles.boldText}>2. Privacy Policy{"\n"}</Text>
                We respect your privacy and are committed to protecting your
                personal data. We collect information you provide directly to
                us, such as when you create an account or contact us for
                support.{"\n\n"}
                <Text style={styles.boldText}>3. User Accounts{"\n"}</Text>
                You are responsible for safeguarding the password and for all
                activities that occur under your account. You must notify us
                immediately upon becoming aware of any breach of security.
                {"\n\n"}
                <Text style={styles.boldText}>4. Prohibited Uses{"\n"}</Text>
                You may not use our service for any illegal or unauthorized
                purpose. You must not transmit any worms or viruses or any code
                of a destructive nature.{"\n\n"}
                <Text style={styles.boldText}>5. Content{"\n"}</Text>
                Our service allows you to post, link, store, share and otherwise
                make available certain information, text, graphics, videos, or
                other material. You are responsible for the content that you
                post.{"\n\n"}
                <Text style={styles.boldText}>6. Termination{"\n"}</Text>
                We may terminate or suspend your account and bar access to the
                service immediately, without prior notice or liability, under
                our sole discretion, for any reason whatsoever.{"\n\n"}
                <Text style={styles.boldText}>
                  7. Limitation of Liability{"\n"}
                </Text>
                In no event shall BookDis, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, punitive, consequential, or similar
                damages.{"\n\n"}
                <Text style={styles.boldText}>8. Changes to Terms{"\n"}</Text>
                We reserve the right to modify these terms at any time. We will
                notify users of any changes by posting the new terms on this
                page.{"\n\n"}
                <Text style={styles.boldText}>
                  9. Contact Information{"\n"}
                </Text>
                If you have any questions about these Terms & Conditions, please
                contact us at support@bookdis.com.
              </Text>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineTerms}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptTerms}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        title="Login Failed"
        message={error}
        buttonText="Try Again"
        onClose={closeErrorModal}
        iconColor="#ff4757"
        button
        Color="#ff4757"
      />

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.navigate("Login");
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    marginBottom: 10,
    marginTop: 30,
  },

  image: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },

  title: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    marginLeft: 15,
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
    height: 35, // slightly smaller
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 12, // left/right padding
    paddingVertical: 6, // smaller vertical padding
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    fontSize: 16,
    textAlignVertical: "center", // important for Android
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },

  passwordInput: {
    flex: 1,
    height: 35,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    textAlignVertical: "center",
  },

  eyeButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 20,
    marginBottom: 10,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  checkedBox: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },

  checkmark: {
    color: "#f75c3c",
    fontWeight: "bold",
    fontSize: 16,
  },

  termsTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },

  checkboxLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  seeMoreText: {
    color: "#FFD882",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  button: {
    backgroundColor: "#FFD882",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 40,
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

  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },

  disabledButtonText: {
    color: "#666666",
  },

  // Terms Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  termsModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    height: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },

  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    fontSize: 18,
    color: "#6c757d",
    fontWeight: "bold",
  },

  termsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  termsText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
    textAlign: "justify",
  },

  boldText: {
    fontWeight: "bold",
    color: "#2c3e50",
  },

  modalButtons: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 10,
  },

  declineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#6c757d",
    alignItems: "center",
  },

  declineButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f75c3c",
    alignItems: "center",
  },

  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
