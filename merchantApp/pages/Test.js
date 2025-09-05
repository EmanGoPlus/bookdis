// App.js
import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, ScrollView } from "react-native";

export default function App() {
  const [direction, setDirection] = useState("row");
  const [justify, setJustify] = useState("flex-start");
  const [align, setAlign] = useState("flex-start");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Flexbox Playground</Text>

      <View style={[styles.flexContainer, { flexDirection: direction, justifyContent: justify, alignItems: align }]}>
        <View style={[styles.box, { backgroundColor: "#f28b82" }]}><Text>1</Text></View>
        <View style={[styles.box, { backgroundColor: "#fbbc04" }]}><Text>2</Text></View>
        <View style={[styles.box, { backgroundColor: "#34a853" }]}><Text>3</Text></View>
      </View>

      <ScrollView style={styles.controls} horizontal>
        <Button title="Row" onPress={() => setDirection("row")} />
        <Button title="Column" onPress={() => setDirection("column")} />
        <Button title="Flex-Start" onPress={() => setJustify("flex-start")} />
        <Button title="Center" onPress={() => setJustify("center")} />
        <Button title="Space-Between" onPress={() => setJustify("space-between")} />
        <Button title="Align Flex-Start" onPress={() => setAlign("flex-start")} />
        <Button title="Align Center" onPress={() => setAlign("center")} />
        <Button title="Align Stretch" onPress={() => setAlign("stretch")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  flexContainer: {
    height: 200,
    backgroundColor: "#e0e0e0",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  box: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  controls: {
    marginTop: 20,
  },
});
