import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert 
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
  
  const { user, userRole, isMerchant, isEmployee } = useContext(UserContext);

  // Setup Socket.io connection
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
      // Optionally show a toast or update UI
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
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
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
            <View style={styles.scanArea} />
            <Text style={styles.instructionText}>
              {isMerchant() ? "Scan customer's QR code to redeem promo" : "Scan customer's QR code"}
            </Text>
            {user && (
              <Text style={styles.userInfoText}>
                Scanning as: {user.firstName} {user.lastName}
              </Text>
            )}
          </View>
        </>
      ) : (
        <ScrollView style={styles.resultContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#4F0CBD" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : promoData ? (
            <>
              {promoData.success ? (
                <>
                  <View style={styles.successHeader}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.successTitle}>Promo Claimed!</Text>
                  </View>

                  <View style={styles.detailsCard}>
                    <View style={styles.field}>
                      <Text style={styles.label}>Promo Title</Text>
                      <Text style={styles.value}>{promoData.promoTitle}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.field}>
                      <Text style={styles.label}>Customer Name</Text>
                      <Text style={styles.value}>{promoData.customerName}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.field}>
                      <Text style={styles.label}>Claim ID</Text>
                      <Text style={styles.codeValue}>#{promoData.claimId}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.field}>
                      <Text style={styles.label}>Redeemed At</Text>
                      <Text style={styles.value}>
                        {formatDateTime(promoData.redeemedAt)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.successMessage}>
                    {promoData.message}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.errorHeader}>
                    <Text style={styles.errorIcon}>✕</Text>
                    <Text style={styles.errorTitle}>Redemption Failed</Text>
                  </View>

                  <View style={styles.detailsCard}>
                    <Text style={styles.errorMessage}>
                      {promoData.error}
                    </Text>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={resetScanner}
              >
                <Text style={styles.buttonText}>Scan Another QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Done
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

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
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 30,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  successHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  successIcon: {
    fontSize: 60,
    color: "#28a745",
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#28a745",
  },
  errorHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  errorIcon: {
    fontSize: 60,
    color: "#dc3545",
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#dc3545",
  },
  detailsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  field: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  codeValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4F0CBD",
    backgroundColor: "#f0e6ff",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  successMessage: {
    fontSize: 16,
    color: "#28a745",
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "500",
  },
  errorMessage: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    lineHeight: 24,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#4F0CBD",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButtonText: {
    color: "#333",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 20,
  },
  userInfoText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    opacity: 0.8,
  },
});