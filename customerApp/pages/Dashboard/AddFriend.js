import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { CustomerContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import Svg, { Path } from "react-native-svg";
import Header from "../../components/header";

const AddFriend = ({ navigation }) => {
  const { customer } = useContext(CustomerContext) || {};
  const token = customer?.token || "";
  const customerId = customer?.id || null;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/user/customer/search/${phoneNumber.trim()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success && res.data.data) {
        if (res.data.data.id === customerId) {
          Alert.alert("Error", "You cannot add yourself as a friend");
          setSearchResult(null);
        } else {
          setSearchResult(res.data.data);
        }
      } else {
        Alert.alert("Not Found", "No user found with this phone number");
        setSearchResult(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      if (err.response?.status === 404) {
        Alert.alert("Not Found", "No user found with this phone number");
      } else {
        Alert.alert("Error", "Failed to search for user");
      }
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult || !token || !customerId) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/customer/friends/add`,
        {
          customerId: customerId,
          friendId: searchResult.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        Alert.alert(
          "Success",
          "Friend added successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", res.data.message || "Failed to add friend");
      }
    } catch (err) {
      console.error("Add friend error:", err);
      
      if (err.response?.status === 409) {
        Alert.alert("Info", err.response.data.message || "Friend already added");
      } else {
        Alert.alert("Error", "Failed to add friend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 -960 960 960"
              fill="#333"
            >
              <Path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Friend</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.label}>Enter Phone Number</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., 09171234567"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    viewBox="0 -960 960 960"
                    fill="#fff"
                  >
                    <Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Result */}
          {searchResult && (
            <View style={styles.resultCard}>
              <View style={styles.userInfo}>
                {searchResult.profilePic ? (
                  <Image
                    source={{ uri: `${API_BASE_URL}/${searchResult.profilePic}` }}
                    style={styles.profilePic}
                  />
                ) : (
                  <View style={[styles.profilePic, styles.placeholderPic]}>
                    <Text style={styles.placeholderText}>
                      {searchResult.firstName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {searchResult.firstName} {searchResult.lastName}
                  </Text>
                  <Text style={styles.userCode}>
                    Phone: {searchResult.phone}
                  </Text>
                  {searchResult.email && (
                    <Text style={styles.userEmail}>{searchResult.email}</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddFriend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      viewBox="0 -960 960 960"
                      fill="#fff"
                      style={{ marginRight: 8 }}
                    >
                      <Path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
                    </Svg>
                    <Text style={styles.addButtonText}>Add Friend</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How to add friends:</Text>
            <Text style={styles.infoText}>
              • Enter your friend's phone number
            </Text>
            <Text style={styles.infoText}>
              • Search for their account
            </Text>
            <Text style={styles.infoText}>
              • Click "Add Friend" to bookmark them
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddFriend;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: "#007bff",
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  placeholderPic: {
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userCode: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#999",
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#e7f3ff",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
});