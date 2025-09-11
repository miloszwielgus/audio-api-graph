// Canvas.tsx
import React from "react";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import  { useSharedValue, type SharedValue } from "react-native-reanimated";
import ConnectionsOverlay from "@/components/ConnectionsOverlay";
import { GhostConnection } from "@/components/GhostConnection";


export const InteractionContext = React.createContext<{
  isInteracting: SharedValue<number>;
} | null>(null);

interface CanvasProps {
  children: ReactNode;
}

export function Canvas({ children }: CanvasProps) {
  const isInteracting = useSharedValue(0);

  return (
    <View style={styles.container}>
      <InteractionContext.Provider value={{ isInteracting }}>
        <View style={styles.canvas}>
          <GhostConnection />
          <ConnectionsOverlay />
          <View>
            {children}
          </View>
        </View>
      </InteractionContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  canvas: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
