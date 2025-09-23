import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Path, G, Defs, ClipPath } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function Header() {
  return (
    <View style={styles.header}>

      <Image
        source={require("../assets/logo-with-text.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.rightContainer}>

        <View style={styles.blankWrapper}>
          <Image
            source={require("../assets/blank.png")}
            style={styles.blankImage}
            resizeMode="contain"
          />

          <View style={styles.switch}>
            <Svg width={36} height={26} viewBox="0 0 36 26" fill="none">
              <Rect y="0.5" width="36" height="25" rx="12.5" fill="#B13BFF" />
              <G clipPath="url(#clip0_56_867)">
                <Path d="M27 4H9V22H27V4Z" fill="white" fillOpacity="0.01" />
                <Path
                  d="M24.75 11.125H11.25"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M20.25 6.625L24.75 11.125"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M11.5496 14.875H25.0496"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M11.5496 14.875L16.0496 19.375"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
              <Defs>
                <ClipPath id="clip0_56_867">
                  <Rect
                    width="18"
                    height="18"
                    fill="white"
                    transform="translate(9 4)"
                  />
                </ClipPath>
              </Defs>
            </Svg>
          </View>
        </View>


        <View style={styles.notif}>
          <Svg width={35} height={35.875} viewBox="0 0 40 41" fill="none">
            <Rect
              y="0.5"
              width="40"
              height="40"
              rx="20"
              fill="#4C24C2"
              fillOpacity="0.5"
            />
            <Path
              d="M16.8661 30H23.1338M26.2677 16.9111C26.2677 15.3434 25.6074 13.8399 24.4319 12.7313C23.2565 11.6228 21.6623 11 20 11C18.3377 11 16.7435 11.6228 15.568 12.7313C14.3926 13.8399 13.7322 15.3434 13.7322 16.9111C13.7322 19.7465 13.0259 21.7493 12.194 23.1247C11.3883 24.4569 10.9854 25.123 11.0004 25.296C11.0172 25.4904 11.0552 25.5588 11.2106 25.6747C11.3489 25.7778 12.0061 25.7778 13.3207 25.7778H26.6793C27.9938 25.7778 28.6511 25.7778 28.7894 25.6747C28.9448 25.5588 28.9828 25.4904 28.9996 25.296C29.0145 25.123 28.6116 24.4569 27.806 23.1247C26.9741 21.7493 26.2677 19.7465 26.2677 16.9111Z"
              stroke="#D83DF0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    height: 120,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  logo: {
    width: 170,
    height: 40,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center", 
  },
  blankWrapper: {
    width: 60,
    height: 60,
    position: "relative",
    marginRight: 10, 
  },
  blankImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  switch: {
    position: "absolute",
    bottom: 0,
    left: -10,
    width: 36,
    height: 26,
  },
  notif: {
    width: 40,
    height: 41,
  },
});
