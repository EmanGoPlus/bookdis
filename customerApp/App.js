import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Public Screens
import Register from "./pages/Public/Register";
import Landing from "./pages/Public/Landing";
import PartnerMap from "./pages/Public/Mapbox"; // ✅ corrected import

const Stack = createNativeStackNavigator();

function CustomerNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Map" component={PartnerMap} />
        <Stack.Screen name="Register" component={Register} />
  

        <Stack.Screen name="Landing" component={Landing} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function CustomerApp() {
  return <CustomerNavigator />;
}
