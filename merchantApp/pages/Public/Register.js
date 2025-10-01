import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import ErrorModal from "../../components/errorModal";
import SuccessModal from "../../components/successModal";
import { API_BASE_URL } from "../../apiConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

export default function Register({ navigation }) {
  const [checked, setChecked] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Birthday state - set to a reasonable default (25 years ago)
  const [birthday, setBirthday] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "merchant",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      setShowErrorModal(true);
      return false;
    }
    return true;
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long.";
    }
    if (!hasLetter) {
      return "Password must contain at least one letter.";
    }
    if (!hasNumber) {
      return "Password must contain at least one number.";
    }
    return null;
  };

  const validateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      return "You must be at least 18 years old to register as a merchant.";
    }
    if (age > 120) {
      return "Please enter a valid birth date.";
    }
    return null;
  };

  const validatePhone = (phone) => {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length !== 11) {
      return "Phone number must be exactly 11 digits.";
    }
    return null;
  };

  const handleSignup = async () => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        role,
      } = formData;

      // Validation checks
      if (!firstName || !lastName || !email || !phone || !password || !birthday) {
        setError("Please fill in all required fields including birthday");
        setShowErrorModal(true);
        return;
      }

      if (!validateEmail(email)) return;

      const phoneError = validatePhone(phone);
      if (phoneError) {
        setError(phoneError);
        setShowErrorModal(true);
        return;
      }

      const ageError = validateAge(birthday);
      if (ageError) {
        setError(ageError);
        setShowErrorModal(true);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setShowErrorModal(true);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setShowErrorModal(true);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/user/register`,
        { 
          firstName, 
          lastName, 
          password, 
          email, 
          phone: phone.replace(/\D/g, ""),
          birthday: formatDateForAPI(birthday),
          role 
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      setSuccessMessage("Your merchant account has been created successfully!");
      setShowSuccessModal(true);
    } catch (err) {
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

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  return (
    <LinearGradient
      colors={["#23143C", "#4F0CBD", "#6D08B1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Svg width={15} height={24} viewBox="0 0 15 24" fill="none">
                <Path
                  d="M13.2656 2L1.73438 13.5312L13.2656 25.0625"
                  stroke="#672BBA"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.title}>Create Merchant Account</Text>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an Account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.form}>
              {/* First Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange("firstName", value)}
                  autoCapitalize="words"
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange("lastName", value)}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone (11 digits)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange("phone", value)}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              {/* Birthday */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Birthday (18+ required)</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>{formatDate(birthday)}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange("password", value)}
                    secureTextEntry={!showPassword}
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
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange("confirmPassword", value)}
                    secureTextEntry={!showConfirmPassword}
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
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setChecked(!checked)}
              >
                <View style={[styles.checkbox, checked && styles.checkedBox]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                  <Text style={styles.termsText}>Terms and Agreements</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, !checked && styles.disabledButton]}
                onPress={checked ? handleSignup : null}
                disabled={!checked}
              >
                <Text style={styles.submitButtonText}>
                  Create Merchant Account
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Birthday</Text>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={birthday}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                textColor="#000"
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.termsContent}>
              <Text style={styles.termsContentText}>
                By creating a merchant account, you agree to our terms of service...
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptTerms}
            >
              <Text style={styles.acceptButtonText}>Accept Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        title="Registration Failed"
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
  },
  signInContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  signInText: {
    fontSize: 16,
    color: "#AACBFD",
  },
  signInLink: {
    fontSize: 16,
    color: "#AACBFD",
    textDecorationLine: "underline",
  },
  form: {
    flex: 1,
    gap: 15,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: "#000",
    paddingVertical: 5,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#B13BFF",
    backgroundColor: "#fff",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkedBox: {
    backgroundColor: "#B13BFF",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  termsText: {
    color: "#FDD6D1",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  submitButton: {
    backgroundColor: "#5C0AE4",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "90%",
    maxHeight: "50%",
  },
  termsModal: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "90%",
    maxHeight: "70%",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
  },
  doneButton: {
    backgroundColor: "#5C0AE4",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  datePicker: {
    backgroundColor: "#fff",
  },
  termsContent: {
    padding: 20,
    maxHeight: 300,
  },
  termsContentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: "#5C0AE4",
    margin: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});