// app/(tabs)/fullscreen-shader.tsx

import { StyleSheet } from "react-native";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ThemedView } from "@/components/ThemedView";

export default function FullscreenAudioScreen() {
  return (
    <ThemedView style={styles.container}>
      <AudioPlayer />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});