// Canvas.tsx — replacement (keep other imports the same)
import React, { createContext, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { AudioPlayer } from '@/components/AudioPlayer';
import ConnectionsOverlay from '@/components/ConnectionsOverlay';
import { GhostConnection } from '@/components/GhostConnection';

interface CanvasTransform {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
}

export const CanvasTransformContext = createContext<CanvasTransform | null>(
  null,
);

interface CanvasProps {
  children: ReactNode;
}

export function Canvas({ children }: CanvasProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const prevTranslateX = useSharedValue(0);
  const prevTranslateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const prevScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      prevTranslateX.value = translateX.value;
      prevTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = prevTranslateX.value + e.translationX;
      translateY.value = prevTranslateY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      prevScale.value = scale.value;
    })
    .onUpdate((e) => {
      const [minScale, maxScale] = [0.5, 3];
      scale.value = Math.min(
        maxScale,
        Math.max(minScale, prevScale.value * e.scale),
      );
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Nodes layer transform — apply the animated transform to the nodes layer.
  const nodesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Gesture surface (captures pan/pinch on empty canvas) */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.gestureSurface} pointerEvents="auto" />
      </GestureDetector>

      {/* Overlay layer: draws wires & ghost using screen/page coordinates (UNTRANSFORMED).
          pointerEvents none so touches fall through to gestureSurface or nodes. */}
      <View style={styles.overlayLayer} pointerEvents="none">
        <ConnectionsOverlay />
        <GhostConnection />
      </View>

      {/* Nodes layer: above overlay so nodes/sockets render on top.
          pointerEvents="box-none" so container does not block touches on empty areas;
          its children (nodes) still receive touches. */}
      <CanvasTransformContext.Provider
        value={{ translateX, translateY, scale }}
      >
        <Animated.View
          style={[styles.nodesLayer, nodesAnimatedStyle]}
          pointerEvents="box-none"
        >
          {children}
        </Animated.View>
      </CanvasTransformContext.Provider>

      <View style={styles.playerWrapper}>
        <AudioPlayer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },

  // Transparent gesture capture surface (not transformed)
  gestureSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  // Overlay layer: draws the SVG wires in screen coordinates.
  overlayLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  // Nodes layer: actual nodes get transformed here, above overlay.
  nodesLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },

  playerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
});
