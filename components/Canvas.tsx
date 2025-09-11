// Canvas.tsx
import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import ConnectionsOverlay from "@/components/ConnectionsOverlay";
import { GhostConnection } from "@/components/GhostConnection";

import { useAtomValue } from "jotai";
import { compiledGraphAtom, audioContextAtom } from "@/stores";

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
          <View style={styles.nodesWrapper}>
            {children}
          </View>

          <AudioPlayer />
        </View>
      </InteractionContext.Provider>
    </View>
  );
}


function AudioPlayer() {
  const audioContext = useAtomValue(audioContextAtom);
  const compiledGraph = useAtomValue(compiledGraphAtom);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const startingRef = React.useRef(false);

  useEffect(() => {
    return () => {
      try {
        if (compiledGraph && typeof compiledGraph.stop === "function") {
          compiledGraph.stop(audioContext.currentTime);
        }
      } catch (e) {
        console.warn("Error stopping graph on unmount:", e);
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!compiledGraph || typeof compiledGraph.play !== "function") {
      console.warn("Audio graph not ready.");
      return;
    }
    if (startingRef.current) return; // already starting
    startingRef.current = true;
    setIsLoading(true);

    try {
      await compiledGraph.play(audioContext.currentTime);
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play audio graph:", err);
    } finally {
      startingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (!compiledGraph || typeof compiledGraph.stop !== "function") return;
    try {
      compiledGraph.stop(audioContext.currentTime);
    } catch (err) {
      console.warn("Error while stopping graph:", err);
    }
    setIsPlaying(false);
    startingRef.current = false;
    setIsLoading(false);
  };

  const togglePlay = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }
    await handlePlay();
  };

  return (
    <View style={styles.playerContainer}>
      <Pressable
        onPress={togglePlay}
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
          isPlaying && styles.playButtonActive,
        ]}
        accessibilityLabel={isPlaying ? "Stop audio" : "Play audio"}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.playButtonText}>{isPlaying ? "Stop" : "Play"}</Text>
        )}
      </Pressable>


    </View>
  );
}

/* -------- styles -------- */
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
  nodesWrapper: {
    flex: 1,
  },

  /* audio player */
  playerContainer: {
    //position: "absolute",
    //right: 12,
    bottom: 18,
    backgroundColor: "rgba(28,28,30,0.85)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  playButton: {
    backgroundColor: "#33488e",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonPressed: {
    opacity: 0.85,
  },
  playButtonActive: {
    backgroundColor: "#8b5cf6",
  },
  playButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  playerHint: {
    marginTop: 8,
    color: "#cfcfe0",
    fontSize: 11,
    textAlign: "center",
  },
});
