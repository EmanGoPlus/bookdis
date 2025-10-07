import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomerProvider, CustomerContext } from "./context/AuthContext";
import { ActivityIndicator, View, StyleSheet } from "react-native";

// Public Screens
import Landing from "./pages/Public/Landing";
import Login from "./pages/Public/Login";
import Register from "./pages/Public/Register";

// import PartnerMap from "./pages/Public/Mapbox";

import Home from "./pages/Dashboard/Home";
import AddFriend from "./pages/Dashboard/AddFriend"
import ClaimedPromos from "./pages/Dashboard/ClaimedPromos"
import RecievedPromos from "./pages/Dashboard/RecievedPromos"

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4F0CBD" />
    </View>
  );
}

function CustomerNavigator() {
  const { customer, loading } = useContext(CustomerContext);

  console.log("CustomerNavigator - Current state:", {
    customer: customer ? `${customer.name || customer.firstName} (${customer.phone || customer.email})` : "null",
    loading,
  });

  if (loading) return <LoadingScreen />;

  if (!customer) {
    console.log("CustomerNavigator - No customer, showing auth screens");
  } else {
    console.log("CustomerNavigator - Customer logged in, showing dashboard screens");
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!customer ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Landing" component={Landing} />
          
            <Stack.Screen name="Register" component={Register} />
            {/* <Stack.Screen name="Map" component={PartnerMap} /> */}
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={Home} />
             <Stack.Screen name="AddFriend" component={AddFriend} />
                <Stack.Screen name="ClaimedPromos" component={ClaimedPromos} />
                <Stack.Screen name="RecievedPromos" component={RecievedPromos} />
            {/* <Stack.Screen name="Map" component={PartnerMap} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default function CustomerApp() {
  return (
    <CustomerProvider>
      <CustomerNavigator />
    </CustomerProvider>
  );
}