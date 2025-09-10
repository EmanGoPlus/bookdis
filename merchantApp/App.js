import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LandingPage from "./pages/LandingPage"; 
import Login from "./pages/Login";
import ForgotPasswordEmail from "./pages/ForgotPasswordEmail"
import ForgotPasswordNumber from "./pages/ForgotPasswordNumber"
import Register from "./pages/Register"
import Home from "./pages/Home";
import CreateBusiness from "./pages/CreateBusiness";
import Verification from "./pages/Verification";
import Profile from "./pages/Account/Profile";
import Dashboard from "./pages/Dashboard/Dashboard";
import Credits from "./pages/Dashboard/Credits"
import Default from "./pages/default";


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>

      <Stack.Navigator screenOptions={{ headerShown: false }}>

        <Stack.Screen name="Landing" component={LandingPage} />

        <Stack.Screen name="Login" component={Login} />
        
        <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmail} />

        <Stack.Screen name="ForgotPasswordNumber" component={ForgotPasswordNumber} />

        <Stack.Screen name="Register" component={Register} />

        <Stack.Screen name="Home" component={Home} />

        <Stack.Screen name="CreateBusiness" component={CreateBusiness} />

        <Stack.Screen name="Verification" component={Verification} />

        <Stack.Screen name="Profile" component={Profile} />

        <Stack.Screen name="Dashboard" component={Dashboard} />

        <Stack.Screen name="Credits" component={Credits} />
        
        <Stack.Screen name="Default" component={Default} />



      </Stack.Navigator>

    </NavigationContainer>
  );
}
