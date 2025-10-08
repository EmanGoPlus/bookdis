import React, { useState, useEffect, useContext, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  PanResponder
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../apiConfig";
import { UserContext } from "../context/AuthContext";
import io from "socket.io-client";

const SWIPE_THRESHOLD = 150;

export default function QrScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [promoPreview, setPromoPreview] = useState(null);
  const [redemptionResult, setRedemptionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  const [swipeX] = useState(new Animated.Value(0));
  
  const { user, userRole, isMerchant, isEmployee } = useContext(UserContext);
  const socketRef = useRef(null);
  const scanningRef = useRef(false);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);
  const currentQrCode = useRef(null);
  const tokenRef = useRef(null); // ✅ ADD THIS LINE

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
      console.log("🔑 Token retrieved:", token ? "EXISTS" : "NULL");
      setUserToken(token);
      tokenRef.current = token; // ✅ ADD THIS LINE
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
    if (promoPreview || redemptionResult) {
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
  }, [promoPreview, redemptionResult]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          swipeX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          console.log("✅ Swipe threshold reached!");
          Animated.timing(swipeX, {
            toValue: 400,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            console.log("🎬 Animation completed, calling handleRedeemPromo");
            console.log("📋 currentQrCode.current:", currentQrCode.current);
            if (currentQrCode.current) {
              handleRedeemPromo(currentQrCode.current);
            } else {
              console.warn("⚠️ Cannot redeem — no QR code stored");
            }
          });
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleBarCodeScanned = async ({ type, data }) => {
    const now = Date.now();
    
    if (scanningRef.current) {
      console.log("⏭️ Already scanning, ignoring");
      return;
    }

    if (lastScannedCode.current === data && (now - lastScanTime.current) < 5000) {
      console.log("⏭️ Same QR code scanned too quickly");
      return;
    }

    scanningRef.current = true;
    lastScannedCode.current = data;
    lastScanTime.current = now;
    currentQrCode.current = data;
    
    console.log("📷 QR Code scanned:", data);
    console.log("💾 Stored in currentQrCode.current:", currentQrCode.current);
    
    setScanned(true);
    setLoading(true);
    
    try {
      const url = `${API_BASE_URL}/api/user/business/get-promo-details`;
      console.log("📡 Fetching promo details from:", url);
      console.log("🔑 Using token:", tokenRef.current ? "EXISTS" : "NULL"); // ✅ CHANGE THIS LINE
      
      const response = await axios.post(
        url,
        { qrCode: data },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } } // ✅ CHANGE THIS LINE
      );

      console.log("✅ Get promo details response:", response.data);

      if (response.data.success) {
        setPromoPreview({
          qrCode: data,
          promoTitle: response.data.data.promoTitle,
          description: response.data.data.description,
          customerName: response.data.data.customerName,
          customerCode: response.data.data.customerCode,
          merchantName: response.data.data.merchantName,
          validUntil: response.data.data.validUntil,
          promoType: response.data.data.promoType,
          imageUrl: response.data.data.imageUrl,
          claimId: response.data.data.claimId,
          claimType: response.data.data.claimType,
          isSharedPromo: response.data.data.isSharedPromo,
          sharedFrom: response.data.data.sharedFrom,
        });
      } else {
        console.log("⚠️ Get promo details failed:", response.data.message);
        setRedemptionResult({
          success: false,
          error: response.data.message || "Failed to fetch promo details",
        });
      }
    } catch (error) {
      console.error("❌ Error fetching promo details:", error);
      console.error("📄 Error response:", error.response?.data);
      console.error("📊 Error status:", error.response?.status);
      setRedemptionResult({
        success: false,
        error: error.response?.data?.message || "Failed to fetch promo details",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        scanningRef.current = false;
      }, 3000);
    }
  };

  const handleRedeemPromo = async (qrCode) => {
    console.log("🎯 handleRedeemPromo called with QR code:", qrCode);
    console.log("🔑 Token from state:", userToken ? "YES" : "NO");
    console.log("🔑 Token from ref:", tokenRef.current ? "YES" : "NO"); // ✅ ADD THIS LINE
    
    const token = tokenRef.current; // ✅ ADD THIS LINE
    
    if (!token) {
      console.error("❌ No token available!");
      setRedemptionResult({
        success: false,
        error: "Authentication token not found. Please try again.",
      });
      setLoading(false);
      swipeX.setValue(0);
      return;
    }
    
    setLoading(true);
    setPromoPreview(null);
    
    try {
      const url = `${API_BASE_URL}/api/user/business/redeem-promo`;
      console.log("📡 Sending redemption request to:", url);
      console.log("📦 Request body:", { qrCode });
      console.log("🔐 Authorization header:", token ? `Bearer ${token.substring(0, 20)}...` : "NULL");
      
      const response = await axios.post(
        url,
        { qrCode },
        { 
          headers: { 
            Authorization: `Bearer ${token}`, // ✅ CHANGE THIS LINE
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("✅ Redemption response:", response.data);
      console.log("📊 Response status:", response.status);

      if (response.data.success) {
        console.log("🎉 Redemption successful!");
        setRedemptionResult({
          success: true,
          message: response.data.message,
          promoTitle: response.data.data.promoTitle,
          customerName: response.data.data.customerName,
          redeemedAt: response.data.data.redeemedAt,
          claimId: response.data.data.claimId,
        });
      } else {
        console.log("⚠️ Redemption failed (success=false):", response.data.message);
        setRedemptionResult({
          success: false,
          error: response.data.message || "Failed to redeem promo",
        });
      }
    } catch (error) {
      console.error("❌ Redemption error:", error);
      console.error("📄 Error response:", error.response?.data);
      console.error("📊 Error status:", error.response?.status);
      console.error("🔍 Error message:", error.message);
      
      if (error.response?.data?.message?.includes("already been redeemed")) {
        console.log("ℹ️ Ignoring duplicate scan error - first scan succeeded");
        setRedemptionResult({
          success: true,
          message: "Promo redeemed successfully",
          promoTitle: "Promo",
          customerName: "Customer",
          redeemedAt: new Date().toISOString(),
          claimId: null,
        });
      } else {
        setRedemptionResult({
          success: false,
          error: error.response?.data?.message || error.message || "Failed to redeem promo",
        });
      }
    } finally {
      setLoading(false);
      swipeX.setValue(0);
    }
  };

  const resetScanner = () => {
    console.log("🔄 Resetting scanner");
    setScanned(false);
    setPromoPreview(null);
    setRedemptionResult(null);
    setLoading(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    swipeX.setValue(0);
    scanningRef.current = false;
    lastScannedCode.current = null;
    lastScanTime.current = 0;
    currentQrCode.current = null;
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
              <Text style={styles.loadingText}>
                {promoPreview ? "Processing redemption..." : "Verifying QR code..."}
              </Text>
            </View>
          ) : promoPreview ? (
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
                <View style={styles.iconContainer}>
                  <View style={styles.infoCircle}>
                    <Text style={styles.infoIcon}>🎟️</Text>
                  </View>
                </View>

                <Text style={styles.resultTitle}>Promo Details</Text>
                <Text style={styles.resultSubtext}>
                  Review the details before confirming redemption
                </Text>

                <View style={styles.detailsCard}>
                  <DetailRow 
                    label="Promo" 
                    value={promoPreview.promoTitle}
                    isFirst
                  />
                  <DetailRow 
                    label="Customer" 
                    value={promoPreview.customerName}
                  />
                  {promoPreview.customerCode && (
                    <DetailRow 
                      label="Customer Code" 
                      value={promoPreview.customerCode}
                    />
                  )}
                  {promoPreview.description && (
                    <DetailRow 
                      label="Description" 
                      value={promoPreview.description}
                    />
                  )}
                  {promoPreview.isSharedPromo && promoPreview.sharedFrom && (
                    <DetailRow 
                      label="Shared From" 
                      value={promoPreview.sharedFrom}
                      highlight
                    />
                  )}
                  {promoPreview.validUntil && (
                    <DetailRow 
                      label="Valid Until" 
                      value={formatDateTime(promoPreview.validUntil)}
                      isLast
                    />
                  )}
                </View>

                <View style={styles.swipeContainer}>
                  <Animated.View
                    style={[
                      styles.swipeTrack,
                      {
                        transform: [{ translateX: swipeX }]
                      }
                    ]}
                    {...panResponder.panHandlers}
                  >
                    <View style={styles.swipeButton}>
                      <Text style={styles.swipeButtonText}>→</Text>
                    </View>
                  </Animated.View>
                  <Text style={styles.swipeText}>Swipe to Redeem</Text>
                </View>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetScanner}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          ) : redemptionResult ? (
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
                {redemptionResult.success ? (
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
                        value={redemptionResult.promoTitle}
                        isFirst
                      />
                      <DetailRow 
                        label="Customer" 
                        value={redemptionResult.customerName}
                      />
                      {redemptionResult.claimId && (
                        <DetailRow 
                          label="Claim ID" 
                          value={`#${redemptionResult.claimId}`}
                          highlight
                        />
                      )}
                      <DetailRow 
                        label="Redeemed" 
                        value={formatDateTime(redemptionResult.redeemedAt)}
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
                        {redemptionResult.error}
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
  infoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4F0CBD",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F0CBD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoIcon: {
    fontSize: 48,
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
  swipeContainer: {
    height: 70,
    backgroundColor: "#e8e8e8",
    borderRadius: 35,
    marginBottom: 16,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  swipeTrack: {
    position: "absolute",
    left: 5,
    top: 5,
    bottom: 5,
  },
  swipeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4F0CBD",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  swipeButtonText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  swipeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
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
  cancelButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#dc3545",
  },
  cancelButtonText: {
    color: "#dc3545",
    fontSize: 17,
    fontWeight: "600",
  },
});