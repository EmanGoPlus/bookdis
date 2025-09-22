import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UserProvider, UserContext } from "./context/AuthContext";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import Landing from "./pages/Public/Landing"
import Login from "./pages/Public/Login";
import ForgotPasswordEmail from "./pages/Public/ForgotPasswordEmail";
import ForgotPasswordNumber from "./pages/Public/ForgotPasswordNumber";
import Register from "./pages/Public/Register";
import Home from "./pages/Account/Home";
import CreateBusiness from "./pages/Account/CreateBusiness";
import Verification from "./pages/Verification";
import Profile from "./pages/Account/Profile";
import Dashboard from "./pages/Dashboard/Dashboard";
import Credits from "./pages/Dashboard/Credits";
import AddEmployee from "./pages/Account/AddEmployee";
import Default from "./pages/default";

//to delete

import AddPromo from "./pages/addpromo"

const Stack = createNativeStackNavigator();

// Loading screen while checking async storage
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f75c3c" />
    </View>
  );
}

// Navigator with role-based and auth-aware routing
function AppNavigator() {
  const { user, userRole, business, loading } = useContext(UserContext);

  console.log("AppNavigator - Current state:", {
    user: user ? `${user.firstName} (${user.phone})` : "null",
    userRole,
    business: business ? business.businessName : "null",
    loading,
  });

  if (loading) return <LoadingScreen />;

  if (!user) {
    console.log("🔄 AppNavigator - No user, showing auth screens");
  } else if (userRole === "merchant") {
    console.log("🔄 AppNavigator - Merchant user, showing Home first");
  } else if (userRole === "employee") {
    console.log("🔄 AppNavigator - Employee user, showing Dashboard first");
  } else {
    console.log("AppNavigator - Unknown role or missing role, showing Default");
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Guest / Auth Stack
          <>
          {/* <Stack.Screen name="Landing" component={Landing} /> */}
            <Stack.Screen name="Landing" component={Landing} />{/* remove */}
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen
              name="ForgotPasswordEmail"
              component={ForgotPasswordEmail}
            />
            <Stack.Screen
              name="ForgotPasswordNumber"
              component={ForgotPasswordNumber}
            />
            <Stack.Screen name="Register" component={Register} />
          </>
        ) : userRole === "merchant" ? (
          // Merchant Flow - Home first, then other screens
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="AddPromo" component={AddPromo} />
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="CreateBusiness" component={CreateBusiness} />
            <Stack.Screen name="Verification" component={Verification} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Credits" component={Credits} />
            <Stack.Screen name="AddEmployee" component={AddEmployee} />
          </>
        ) : userRole === "employee" ? (
          // Employee Flow - Dashboard first, then other screens
          <>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Credits" component={Credits} />
          </>
        ) : (
          // Fallback for unknown roles
          <>
            <Stack.Screen name="Default" component={Default} />
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

export default function App() {
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}
