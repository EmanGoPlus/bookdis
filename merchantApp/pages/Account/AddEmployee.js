import React, { useContext, useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../apiConfig";
import { UserContext } from "../../context/AuthContext";
import ErrorModal from "../../components/errorModal";
import * as Clipboard from "expo-clipboard";

export default function AddEmployee({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const { user, userRole, isMerchant } = useContext(UserContext);

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  useEffect(() => {
    if (!isMerchant()) {
      navigation.navigate("Default");
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.navigate("Login");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/user/merchant/my-businesses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setBusinesses(response.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching businesses:", err.message);
      }
    };

    fetchBusinesses();
  }, []);

  const closeErrorModal = () => setShowErrorModal(false);
  const closeSuccessModal = () => setShowSuccessModal(false);

  const handleAddEmployee = async () => {
    if (!firstName || !lastName || !selectedBusinessId) {
      setErrorMessage("⚠️ Please fill all fields and select a business.");
      setShowErrorModal(true);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setErrorMessage("Session Expired. Please Login Again");
        setShowErrorModal(true);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/user/employee-register`,
        {
          firstName,
          lastName,
          businessId: selectedBusinessId,
          role: "employee", 
          createdBy: user?.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedUsername(response.data.employee.username);
      setGeneratedPassword(response.data.employee.password);
      setShowSuccessModal(true);

      setFirstName("");
      setLastName("");
      setSelectedBusinessId("");
    } catch (err) {
      let msg = "❌ Failed to register employee.";
      if (err.response?.data?.error) msg = err.response.data.error;
      setErrorMessage(msg);
      setShowErrorModal(true);
    }
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
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.title}>Add Employee</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#ccc"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#ccc"
            value={lastName}
            onChangeText={setLastName}
          />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Your Business</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBusinessId}
                onValueChange={(itemValue) => setSelectedBusinessId(itemValue)}
                style={styles.picker}
                dropdownIconColor="#666"
              >
                <Picker.Item label="-- Choose Business --" value="" />
                {businesses.map((biz) => (
                  <Picker.Item
                    key={biz.id}
                    label={biz.businessName}
                    value={biz.id}
                  />
                ))}
              </Picker>
            </View>
            {businesses.length === 0 && (
              <Text style={styles.noBusiness}>
                No businesses found. Add your first business!
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAddEmployee}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <ErrorModal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        buttonText="Try Again"
        onClose={closeErrorModal}
        iconColor="#ff4757"
        buttonColor="#ff4757"
      />

      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✅ Employee Registered!</Text>
            <Text>Username: {generatedUsername}</Text>
            <Text>Password: {generatedPassword}</Text>

            <TouchableOpacity
              onPress={() =>
                Clipboard.setStringAsync(
                  `Username: ${generatedUsername}\nPassword: ${generatedPassword}`
                )
              }
              style={styles.copyButton}
            >
              <Text style={styles.copyButtonText}>📋 Copy Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeSuccessModal}
              style={styles.okButton}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },
  form: { flexGrow: 1, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontFamily: "HessGothic-Bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    marginTop: 15,
    backgroundColor: "#FFD882",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontSize: 16, fontFamily: "HessGothic-Bold" },
  card: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "HessGothic-Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  picker: { height: 52, color: "#495057" },
  noBusiness: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  copyButton: {
    marginTop: 15,
    backgroundColor: "#FFD882",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  okButton: {
    marginTop: 10,
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
