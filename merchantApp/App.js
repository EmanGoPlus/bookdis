import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LandingPage from "./pages/LandingPage"; 
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword"
import Register from "./pages/Register"
import Home from "./pages/Home";
import Default from "./pages/default"


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Login" component={Login} />
        
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

        <Stack.Screen name="Register" component={Register} />

        <Stack.Screen name="Home" component={Home} />
        
        <Stack.Screen name="Default" component={Default} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
