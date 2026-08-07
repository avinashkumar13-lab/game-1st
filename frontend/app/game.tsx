import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";

import { GameHost } from "@/src/game/GameHost";

export default function GameScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B0A12" }}>
      <StatusBar style="light" />
      <GameHost />
    </View>
  );
}
