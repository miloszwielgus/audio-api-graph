import { useAtomValue } from 'jotai';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, type PathProps } from 'react-native-svg';

import { connectionsAtom, nodePositionsData } from '@/stores';
import { isPlayingAtom } from '@/stores/audioEngineAtoms';
import type { Connection } from '@/stores/connectionsAtoms';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PORT_OFFSET = 10;
const CURVE_RADIUS = 128;

export default function ConnectionsOverlay() {
  const connections = useAtomValue(connectionsAtom);

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {connections.map((conn) => (
        <Wire
          key={`${conn.from.nodeId}-${conn.from.socket}-${conn.to.nodeId}-${conn.to.socket}`}
          connection={conn}
        />
      ))}
    </Svg>
  );
}

function Wire({ connection }: { connection: Connection }) {
  const isPlaying = useAtomValue(isPlayingAtom);
  const dashOffset = useSharedValue(0);
  const isAnimating = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      isAnimating.value = 1;
      dashOffset.value = withRepeat(
        withTiming(-30, { duration: 400, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      isAnimating.value = 0;
      cancelAnimation(dashOffset);
      dashOffset.value = 0;
    }
  }, [isPlaying, dashOffset, isAnimating]);

  const animatedProps = useAnimatedProps<PathProps>(() => {
    const out =
      nodePositionsData.value[
        `${connection.from.nodeId}-${connection.from.socket}`
      ];
    const inp =
      nodePositionsData.value[
        `${connection.to.nodeId}-${connection.to.socket}`
      ];

    if (!out || !inp) {
      return { d: '', strokeWidth: 0 };
    }

    const startX = out.x + PORT_OFFSET;
    const startY = out.y;
    const endX = inp.x - PORT_OFFSET;
    const endY = inp.y;

    const dx = Math.abs(endX - startX);
    const radius = Math.min(CURVE_RADIUS, dx / 2);

    const cp1X = startX + radius;
    const cp1Y = startY;
    const cp2X = endX - radius;
    const cp2Y = endY;

    const d =
      `M ${out.x} ${out.y} ` +
      `L ${startX} ${startY} ` +
      `C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY} ` +
      `L ${inp.x} ${inp.y}`;

    return {
      d,
      strokeWidth: 4,
      stroke: '#00BFFF',
      fill: 'none',
      strokeDasharray: isAnimating.value ? '10 20' : '10 0',
      strokeDashoffset: dashOffset.value,
    };
  });

  return <AnimatedPath animatedProps={animatedProps} />;
}