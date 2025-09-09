import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  StatusBar,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../apiConfig";

export default function Verification() {
  const [documents, setDocuments] = useState({
    governmentID: null,
    businessPermit: null,
    DTI: null,
    taxID: null,
  });

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const [fontsLoaded] = useFonts({
    "HessGothic-Bold": require("../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
  });

useEffect(() => {
  const fetchBusinesses = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("⚠️ No token found in AsyncStorage");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/merchant/my-businesses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Businesses response:", response.data);

      setBusinesses(response.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching businesses:", err.message);
    }
  };

  fetchBusinesses();
}, []);

  if (!fontsLoaded) return null;
  
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const generateCleanFilename = (field, businessName) => {
    // Clean business name (remove special characters, spaces to dashes, lowercase)
    const cleanBusinessName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .trim();

    // Map field names to readable document types
    const documentTypeMap = {
      governmentID: 'government-id',
      businessPermit: 'business-permit', 
      DTI: 'dti-sec-papers',
      taxID: 'tax-id'
    };

    const documentType = documentTypeMap[field] || field;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    return `${cleanBusinessName}-${documentType}-${timestamp}.jpg`;
  };

  const pickImage = async (field) => {
    if (!selectedBusinessId) {
      alert("Please select a business first before uploading documents");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      let { uri } = result.assets[0];

      // Resize & compress
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // resize max width to 1024px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Find the selected business name
      const selectedBusiness = businesses.find(biz => biz.id === selectedBusinessId);
      const businessName = selectedBusiness?.businessName || 'unknown-business';

      // Generate clean filename
      const cleanFilename = generateCleanFilename(field, businessName);
      
      setDocuments((prev) => ({
        ...prev,
        [field]: { uri: manipResult.uri, name: cleanFilename },
      }));
    }
  };

  const handleUploadDocuments = async () => {
    try {
      if (!selectedBusinessId) {
        alert("Please select a business first");
        return;
      }

      console.log("🚀 Starting upload with businessId:", selectedBusinessId);
      console.log("📁 Documents to upload:", Object.keys(documents).filter(key => documents[key]));

      const formData = new FormData();
      
      // ✅ Add businessId as string, not object
      formData.append("businessId", selectedBusinessId.toString());

      // ✅ Add files with proper structure for React Native
      Object.keys(documents).forEach((field) => {
        if (documents[field]) {
          console.log(`📎 Adding ${field}:`, documents[field].name);
          formData.append(field, {
            uri: documents[field].uri,
            name: documents[field].name,
            type: "image/jpeg",
          });
        }
      });

      const token = await AsyncStorage.getItem("token");

      console.log("🌐 Making API call...");
      const response = await axios.post(
        `${API_BASE_URL}/api/merchant/upload-documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("✅ Upload response:", response.data);
      
      if (response.status === 200) {
        alert("Documents uploaded successfully!");
        // Reset documents after successful upload
        setDocuments({
          governmentID: null,
          businessPermit: null,
          DTI: null,
          taxID: null,
        });
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      if (err.response?.data?.error) {
        alert(`Upload failed: ${err.response.data.error}`);
      } else {
        alert("Failed to upload documents. Please try again.");
      }
    }
  };

  const DocumentUploadCard = ({ title, field, document }) => (
    <View style={styles.documentCard}>
      <Text style={styles.documentTitle}>{title}</Text>
      <TouchableOpacity
        onPress={() => pickImage(field)}
        style={[styles.uploadButton, document && styles.uploadButtonActive]}
      >
        <View style={styles.uploadButtonContent}>
          <Text style={styles.uploadIcon}>📁</Text>
          <Text style={[styles.uploadButtonText, document && styles.uploadButtonTextActive]}>
            {document ? "✓ " + document.name : "Choose File"}
          </Text>
        </View>
      </TouchableOpacity>
      {document && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: document.uri }} style={styles.preview} />
          <View style={styles.previewOverlay}>
            <Text style={styles.previewText}>Preview</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={["#ffce54", "#fda610", "#f75c3c"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Get Verified!</Text>
            <Text style={styles.subtitle}>
              Complete your verification to unlock full access. Verified accounts can start selling, 
              receive credits, and build trust with customers.
            </Text>
          </View>

          {/* Business Selection Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Your Business</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBusinessId}
                onValueChange={(itemValue) => {
                  console.log("🏢 Selected business ID:", itemValue);
                  setSelectedBusinessId(itemValue);
                }}
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
          </View>

          {/* Documents Upload Section */}
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            
            <DocumentUploadCard 
              title="Government ID" 
              field="governmentID" 
              document={documents.governmentID}
            />
            
            <DocumentUploadCard 
              title="Business Permit" 
              field="businessPermit" 
              document={documents.businessPermit}
            />
            
            <DocumentUploadCard 
              title="DTI / SEC Papers" 
              field="DTI" 
              document={documents.DTI}
            />
            
            <DocumentUploadCard 
              title="Tax ID" 
              field="taxID" 
              document={documents.taxID}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.shadowButton]}
              onPress={handleUploadDocuments}
            >
              <Text style={styles.primaryButtonText}>Submit Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  scrollContent: { 
    paddingBottom: 100 
  },
  
  // Header Styles
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "HessGothic-Bold",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  // Card Styles
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "HessGothic-Bold",
    marginBottom: 15,
  },

  // Picker Styles
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  picker: { 
    height: 50, 
    color: "#333"
  },

  // Documents Section
  documentsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "HessGothic-Bold",
    marginBottom: 20,
    textAlign: "center",
  },

  // Document Card Styles
  documentCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  documentTitle: {
    fontSize: 16,
    color: "#333",
    fontFamily: "HessGothic-Bold",
    marginBottom: 12,
  },

  // Upload Button Styles
  uploadButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e1e5e9",
    borderStyle: 'dashed',
  },
  uploadButtonActive: {
    backgroundColor: "#e8f5e8",
    borderColor: "#28a745",
    borderStyle: 'solid',
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  uploadButtonText: {
    color: "#666",
    fontSize: 14,
    fontFamily: "HessGothic-Bold",
  },
  uploadButtonTextActive: {
    color: "#28a745",
  },

  // Preview Styles
  previewContainer: {
    marginTop: 12,
    alignItems: 'center',
    position: 'relative',
  },
  preview: { 
    width: 120, 
    height: 120, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e1e5e9",
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    width: 120,
    alignSelf: 'center',
  },
  previewText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: "HessGothic-Bold",
  },

  // Action Buttons
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  shadowButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: { 
    color: "#f75c3c", 
    fontSize: 16, 
    fontFamily: "HessGothic-Bold" 
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontFamily: "HessGothic-Bold" 
  },
});