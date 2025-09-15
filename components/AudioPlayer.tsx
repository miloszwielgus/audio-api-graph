import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAudioEngine } from '@/hooks/useAudioEngine';

export function AudioPlayer() {
  const { isPlaying, isLoading, togglePlay } = useAudioEngine();

  return (
    <View style={styles.playerContainer}>
      <Pressable
        onPress={togglePlay}
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
          isPlaying && styles.playButtonActive,
        ]}
        accessibilityLabel={isPlaying ? 'Stop audio' : 'Play audio'}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.playButtonText}>
            {isPlaying ? 'Stop' : 'Play'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    bottom: 18,
    backgroundColor: 'rgba(28,28,30,0.85)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  playButton: {
    backgroundColor: '#33488e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPressed: {
    opacity: 0.85,
  },
  playButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});