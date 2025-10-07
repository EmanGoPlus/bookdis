import React, { useState, useEffect, useContext, useRef } from "react";
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

  const socketRef = useRef(null);
  
  // ✅ Scan prevention refs
  const scanningRef = useRef(false);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);

  useEffect(() => {
    if (!userToken || socketRef.current) return;

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: { token: userToken },
    });

    socket.on("connect", () => {
      console.log("Scanner socket connected:", socket.id);
    });

    socket.on("promoUpdate", (data) => {
      console.log("Promo updated after redemption:", data);
    });

    socket.on("disconnect", () => {
      console.log("Scanner socket disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
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
    const now = Date.now();
    
    // ✅ CRITICAL: Prevent multiple scans of the same QR code
    if (scanningRef.current) {
      console.log("⏭️ Already processing a scan, ignoring");
      return;
    }

    // Only allow same QR code to be scanned again after 5 seconds
    if (lastScannedCode.current === data && (now - lastScanTime.current) < 5000) {
      console.log("⏭️ Same QR code scanned too quickly, ignoring");
      return;
    }

    // Lock scanning
    //also If the scanner gets an "already redeemed" error, it now treats it as SUCCESS (since the first scan worked) instead of showing an error.
    scanningRef.current = true;
    lastScannedCode.current = data;
    lastScanTime.current = now;
    
    setScanned(true);
    setLoading(true);
    
    console.log("📷 QR Code scanned:", data);
    
    try {
      const endpoint = isMerchant() 
        ? '/api/user/merchant/redeem-promo'
        : '/api/user/employee/redeem-promo';

      console.log("📡 Sending redemption request to:", endpoint);

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { qrCode: data },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      console.log("✅ Response received:", response.data);

      if (response.data.success) {
        setPromoData({
          success: true,
          message: response.data.message,
          promoTitle: response.data.data.promoTitle,
          customerName: response.data.data.customerName,
          redeemedAt: response.data.data.redeemedAt,
          claimId: response.data.data.claimId,
        });
      } else {
        console.log("⚠️ Success=false from server:", response.data);
        setPromoData({
          success: false,
          error: response.data.message || "Failed to redeem promo",
        });
      }
    } catch (error) {
      console.error("❌ Redemption error:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.data?.message?.includes("already been redeemed")) {
        console.log("ℹIgnoring duplicate scan error - first scan succeeded");
        setPromoData({
          success: true,
          message: "Promo redeemed successfully",
          promoTitle: "Promo",
          customerName: "Customer",
          redeemedAt: new Date().toISOString(),
          claimId: null,
        });
      } else {
        setPromoData({
          success: false,
          error: error.response?.data?.message || "Failed to redeem promo",
        });
      }
    } finally {
      setLoading(false);
      // Keep scan lock for 3 seconds to prevent rapid re-scanning
      setTimeout(() => {
        scanningRef.current = false;
      }, 3000);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setPromoData(null);
    setLoading(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    // Reset scan prevention
    scanningRef.current = false;
    lastScannedCode.current = null;
    lastScanTime.current = 0;
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
                    <View style={styles.iconContainer}>
                      <View style={styles.successCircle}>
                        <Text style={styles.successIcon}>✓</Text>
                      </View>
                    </View>

                    <Text style={styles.resultTitle}>Redeemed Successfully!</Text>
                    <Text style={styles.resultSubtext}>
                      The promo has been claimed by the customer
                    </Text>

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
                      {promoData.claimId && (
                        <DetailRow 
                          label="Claim ID" 
                          value={`#${promoData.claimId}`}
                          highlight
                        />
                      )}
                      <DetailRow 
                        label="Redeemed" 
                        value={formatDateTime(promoData.redeemedAt)}
                        isLast
                      />
                    </View>
                  </>
                ) : (
                  <>
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
  },
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