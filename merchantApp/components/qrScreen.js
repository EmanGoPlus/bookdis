import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../apiConfig";
import { UserContext } from "../context/AuthContext";
import io from "socket.io-client";

export default function QrScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [promoData, setPromoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [socket, setSocket] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  
  const { user, userRole, isMerchant, isEmployee } = useContext(UserContext);

  useEffect(() => {
    if (!userToken) return;

    const newSocket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: { token: userToken },
    });

    newSocket.on("connect", () => {
      console.log("Scanner socket connected:", newSocket.id);
    });

    newSocket.on("promoUpdate", (data) => {
      console.log("Promo updated after redemption:", data);
    });

    newSocket.on("disconnect", () => {
      console.log("Scanner socket disconnected");
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userToken]);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("token");
      setUserToken(token);
    };
    getToken();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Animate result screen entrance
  useEffect(() => {
    if (promoData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [promoData]);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);
    
    try {
      const endpoint = isMerchant() 
        ? '/api/user/merchant/redeem-promo'
        : '/api/user/employee/redeem-promo';

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { qrCode: data },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      if (response.data.success) {
        setPromoData({
          success: true,
          message: response.data.message,
          promoTitle: response.data.data.promoTitle,
          customerName: response.data.data.customerName,
          redeemedAt: response.data.data.redeemedAt,
          claimId: response.data.data.claimId,
        });
      }
    } catch (error) {
      setPromoData({
        success: false,
        error: error.response?.data?.message || "Failed to redeem promo",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setPromoData(null);
    setLoading(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F0CBD" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={styles.errorTitle}>Camera Access Needed</Text>
          <Text style={styles.errorSubtext}>
            Please enable camera permissions in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          
          {/* Overlay with scanning frame */}
          <View style={styles.overlay}>
            <View style={styles.topOverlay}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.middleContent}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            <View style={styles.bottomOverlay}>
              <Text style={styles.instructionTitle}>Scan QR Code</Text>
              <Text style={styles.instructionText}>
                {isMerchant() 
                  ? "Position the customer's QR code within the frame" 
                  : "Align the QR code within the scanning area"}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F0CBD" />
              <Text style={styles.loadingText}>Verifying QR code...</Text>
            </View>
          ) : promoData ? (
            <Animated.View 
              style={[
                styles.resultContent,
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {promoData.success ? (
                  <>
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                      <View style={styles.successCircle}>
                        <Text style={styles.successIcon}>✓</Text>
                      </View>
                    </View>

                    <Text style={styles.resultTitle}>Redeemed Successfully!</Text>
                    <Text style={styles.resultSubtext}>
                      The promo has been claimed by the customer
                    </Text>

                    {/* Details Card */}
                    <View style={styles.detailsCard}>
                      <DetailRow 
                        label="Promo" 
                        value={promoData.promoTitle}
                        isFirst
                      />
                      <DetailRow 
                        label="Customer" 
                        value={promoData.customerName}
                      />
                      <DetailRow 
                        label="Claim ID" 
                        value={`#${promoData.claimId}`}
                        highlight
                      />
                      <DetailRow 
                        label="Redeemed" 
                        value={formatDateTime(promoData.redeemedAt)}
                        isLast
                      />
                    </View>
                  </>
                ) : (
                  <>
                    {/* Error Icon */}
                    <View style={styles.iconContainer}>
                      <View style={styles.errorCircle}>
                        <Text style={styles.errorIconText}>✕</Text>
                      </View>
                    </View>

                    <Text style={[styles.resultTitle, styles.errorTitle]}>
                      Redemption Failed
                    </Text>
                    
                    <View style={styles.errorCard}>
                      <Text style={styles.errorMessage}>
                        {promoData.error}
                      </Text>
                    </View>
                  </>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={resetScanner}
                  >
                    <Text style={styles.primaryButtonText}>Scan Another</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.secondaryButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// Helper component for detail rows
const DetailRow = ({ label, value, highlight, isFirst, isLast }) => (
  <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[
      styles.detailValue, 
      highlight && styles.detailValueHighlight
    ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  errorContainer: {
    alignItems: "center",
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  
  // Camera Overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  topOverlay: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  middleContent: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#4F0CBD",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  userBadge: {
    backgroundColor: "rgba(79, 12, 189, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  userBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Results Screen
  resultContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  resultContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    fontSize: 56,
    color: "#fff",
    fontWeight: "bold",
  },
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIconText: {
    fontSize: 56,
    color: "#fff",
    fontWeight: "bold",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  
  // Details Card
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 18,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  detailValueHighlight: {
    color: "#4F0CBD",
    fontSize: 20,
  },
  
  // Error Card
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  errorMessage: {
    fontSize: 16,
    color: "#dc3545",
    lineHeight: 24,
    fontWeight: "500",
  },
  
  // Buttons
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#4F0CBD",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4F0CBD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 17,
    fontWeight: "600",
  },
});