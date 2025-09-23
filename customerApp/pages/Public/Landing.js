import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import axios from "axios";
import { API_BASE_URL } from "../../apiConfig";
import QRCode from "react-native-qrcode-svg";

export default function HomeScreen() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimedQr, setClaimedQr] = useState(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/customer/promos`);
        if (res.data.success) {
          setPromos(res.data.data);
        }
      } catch (err) {
        console.error("Fetch promos error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, []);

const claimPromo = async (promoId) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/user/customer/claim-promo/${promoId}`
    );

    if (res.data.success) {
      setClaimedQr(res.data.data.qrCode);
    }
  } catch (err) {
    console.error("Claim promo error:", err);
  }
};


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Loading promos...</Text>
      </View>
    );
  }

  if (claimedQr) {
    // show QR after claiming
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ marginBottom: 20 }}>Show this QR to the merchant:</Text>
        <QRCode value={claimedQr} size={200} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Available Promos
      </Text>
      <FlatList
        data={promos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              marginBottom: 10,
              backgroundColor: "#f2f2f2",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {item.title}
            </Text>
            <Text>{item.description}</Text>
            <Text>
              {item.discountType}: {item.discountValue}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 10,
                backgroundColor: "blue",
                padding: 10,
                borderRadius: 5,
              }}
              onPress={() => claimPromo(item.id)}
            >
              <Text style={{ color: "white", textAlign: "center" }}>
                Claim Promo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
