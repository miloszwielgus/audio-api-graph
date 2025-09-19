import React, {useEffect} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSetAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioEngine } from '@/hooks/useAudioEngine';
import { isPlayingAtom } from '@/stores/audioEngineAtoms';

const BOTTOM_OFFSET = 18;

export function AudioPlayer() {
  const { isPlaying, isLoading, togglePlay } = useAudioEngine();
  const insets = useSafeAreaInsets(); 

  const setIsPlayingGlobally = useSetAtom(isPlayingAtom);

  useEffect(() => {
    setIsPlayingGlobally(isPlaying);
  }, [isPlaying, setIsPlayingGlobally]);

  return (
    <View 
      style={[
        styles.playerContainer, 
        { bottom: insets.bottom + BOTTOM_OFFSET }
      ]}
    >
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
    position: 'absolute', 
    alignSelf: 'center', 
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
    paddingBottom: 18
  },
  playButton: {
    backgroundColor: '#33488e',
    paddingVertical: 12,
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