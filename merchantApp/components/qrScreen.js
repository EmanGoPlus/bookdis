import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { CameraView, Camera } from "expo-camera";

export default function QrScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [promoData, setPromoData] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      parsedData = { content: data };
    }
    
    setPromoData(parsedData);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      ) : (
        <ScrollView style={styles.promoContainer}>
          <Text style={styles.title}>Promo Details</Text>
          
          {promoData && (
            <View style={styles.promoContent}>
              {promoData.title && (
                <View style={styles.field}>
                  <Text style={styles.label}>Title:</Text>
                  <Text style={styles.value}>{promoData.title}</Text>
                </View>
              )}
              
              {promoData.description && (
                <View style={styles.field}>
                  <Text style={styles.label}>Description:</Text>
                  <Text style={styles.value}>{promoData.description}</Text>
                </View>
              )}
              
              {promoData.discount && (
                <View style={styles.field}>
                  <Text style={styles.label}>Discount:</Text>
                  <Text style={styles.value}>{promoData.discount}</Text>
                </View>
              )}
              
              {promoData.validUntil && (
                <View style={styles.field}>
                  <Text style={styles.label}>Valid Until:</Text>
                  <Text style={styles.value}>{promoData.validUntil}</Text>
                </View>
              )}
              
              {promoData.code && (
                <View style={styles.field}>
                  <Text style={styles.label}>Promo Code:</Text>
                  <Text style={styles.codeValue}>{promoData.code}</Text>
                </View>
              )}
              
              {promoData.content && !promoData.title && (
                <View style={styles.field}>
                  <Text style={styles.label}>Content:</Text>
                  <Text style={styles.value}>{promoData.content}</Text>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, { position: 'relative', marginTop: 20 }]}
            onPress={() => {
              setScanned(false);
              setPromoData(null);
            }}
          >
            <Text style={styles.buttonText}>Scan Another</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { position: 'relative', marginTop: 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: 'black' }]}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {scanned && (
        <TouchableOpacity
          style={[styles.button, { bottom: 20 }]}
          onPress={() => {
            setScanned(false);
            setPromoData(null);
          }}
        >
          <Text style={styles.buttonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  button: {
    backgroundColor: "black",
    padding: 15,
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    borderRadius: 10,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  promoContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  promoContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});