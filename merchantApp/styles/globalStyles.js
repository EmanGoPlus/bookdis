// // globalStyles.js
// import { StyleSheet, Platform } from "react-native";


// export const colors = {
//   primary: "#4B1AA9",
//   secondary: "#C0CAFE",
//   white: "#fff",
//   black: "#333",
//   placeholder: "#D4CAF8",
//   error: "#ff4757",
//   link: "#007AFF",
// };

// export const fonts = {
//   bold: "Roboto_800ExtraBold",
//   regular: "Roboto_400Regular",
// };

// export const globalStyles = StyleSheet.create({
//   background: {
//     flex: 1,
//   },
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   logo: {
//     width: 250,
//     height: 250,
//     resizeMode: "contain",
//     marginTop: -60,
//   },
//   form: {
//     marginTop: 100,
//     width: "100%",
//     maxWidth: 400,
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: colors.white,
//     borderRadius: 15,
//     borderWidth: 1,
//     borderColor: colors.primary,
//     marginBottom: 16,
//     paddingHorizontal: 16,
//     width: "100%",
//     height: 60,
//     ...Platform.select({
//       ios: {},
//       android: {},
//     }),
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: colors.black,
//     paddingVertical: 0,
//     paddingLeft: 12,
//   },
//   eyeButton: {
//     padding: 8,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loginButton: {
//     backgroundColor: colors.primary,
//     paddingVertical: 18,
//     borderRadius: 15,
//     width: "100%",
//     alignItems: "center",
//     marginTop: 8,
//   },
//   loginButtonText: {
//     fontFamily: fonts.bold,
//     fontSize: 16,
//     color: colors.white,
//     fontWeight: "700",
//   },
//   linkRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "100%",
//     maxWidth: 400,
//     marginTop: 24,
//     paddingHorizontal: 20,
//   },
//   link: {
//     color: colors.link,
//     fontSize: 15,
//     fontWeight: "500",
//     textDecorationLine: "underline",
//   },
// });
