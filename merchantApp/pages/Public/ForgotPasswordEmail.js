import React from "react";
import {
  Text,
  StyleSheet,
  StatusBar,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Roboto_600SemiBold,
  Roboto_800ExtraBold,
  Roboto_400Regular,
} from "@expo-google-fonts/roboto";

export default function DefaultPage({ navigation }) {
  const [fontsLoaded] = useFonts({
    Roboto_600SemiBold,
    Roboto_800ExtraBold,
    Roboto_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#fff", "#fff", "#DDD7FB"]}
      locations={[0, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.navigate("Login")}
        >
          <Svg width={15} height={44} viewBox="0 0 15 44" fill="none">
            <Path
              d="M13.2656 10L1.73438 21.5312L13.2656 33.0625"
              stroke="#672BBA"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.headerText}>Find your Account</Text>

        <View style={styles.form}>
          <Text style={styles.instruction}>Enter your email address</Text>

          {/* Input */}
          {/* Input */}
          <LinearGradient
            colors={["#B13BFF", "#5C0AE4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBorderContainer}
          >
            <View style={styles.innerInputContainer}>
              {/* make label non-touchable so it won't block taps */}
              <Text style={styles.label} pointerEvents="none">
                Email
              </Text>

              {/* give the TextInput flex:1 so it actually has tappable area */}
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A9A2D9"
              />
            </View>
          </LinearGradient>

          {/* Button */}
          <LinearGradient
            colors={["#5C0AE4", "#6A13D8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <TouchableOpacity
              style={styles.buttonTouchable}
              onPress={() => console.log("Continue pressed")}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate("ForgotPasswordNumber");
          }}
        >
          <Text style={styles.switch}>Search by phone number instead</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },

  back: {
    // Add back button styles if needed
    padding: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },

  headerText: {
    fontSize: 34,
    color: "#380F7E",
    fontFamily: "Roboto_600SemiBold",
    fontWeight: "600",
    paddingHorizontal: 20,
  },

  form: {
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  instruction: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
    color: "#303030",
  },

  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#5C0AE4",
    marginBottom: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    height: 65,
    position: "relative",
  },

  gradientBorderContainer: {
    borderRadius: 15,
    padding: 1,
    width: "100%",
    height: 65,
  },

  innerInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: "100%",
    width: "100%", // <-- ensure it fills the gradient wrapper
    position: "relative", // label is absolutely positioned relative to this
  },

  label: {
    position: "absolute",
    top: 8,
    left: 16,
    fontSize: 14,
    color: "#A397CF",
    fontFamily: "Roboto_400Regular",
    zIndex: 2,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    height: "100%",
    paddingTop: 22,
    paddingLeft: 0,
  },

  button: {
    height: 65,
    justifyContent: "center",
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    overflow: "hidden",
  },

  buttonTouchable: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontFamily: "Roboto_600SemiBold",
    // fontFamily: "Roboto_800ExtraBold",
    fontSize: 18,
    color: "#fff",
  },

  switch: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textAlign: "center",
    color: "#8C7FAE",
  },
});
