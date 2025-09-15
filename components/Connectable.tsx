import { CanvasTransformContext } from '@/components/Canvas'; // <-- NEW
import { NodeTranslateCtx } from '@/components/NodeTranslateContext';
import type { Socket } from '@/runtime/nodeRegistry';
import {
  addConnectionAtom,
  ghostConnectionEnd,
  ghostConnectionSnapTarget,
  ghostConnectionStart,
  isConnecting,
  nodePositionsData,
  removeConnectionsAtom,
} from '@/stores';
import { useSetAtom } from 'jotai';
import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useDerivedValue,
} from 'react-native-reanimated';

const colors = {
  background: '#2a2a2a',
  accent: '#fd79a8',
};

interface ConnectableProps {
  nodeId: string;
  socket: Socket;
  type: 'input' | 'output';
}

export function Connectable({ nodeId, socket, type }: ConnectableProps) {
  const addConnection = useSetAtom(addConnectionAtom);
  const removeConnections = useSetAtom(removeConnectionsAtom);
  const ref = useAnimatedRef<Animated.View>();
  const { tx, ty } = useContext(NodeTranslateCtx)!;

  const canvas = useContext(CanvasTransformContext);

  // Recompute the socket's *screen/page* position whenever node tx/ty OR
  // the canvas transform changes. This keeps nodePositionsData in screen coords
  // and prevents drift when the canvas is panned/zoomed.
  useDerivedValue(() => {
    const m = measure(ref);
    if (!m) return;

    // Use pageX/pageY (screen coords). Add half width/height to store center point.
    const centerX = m.pageX + m.width / 2;
    const centerY = m.pageY + m.height / 2;

    nodePositionsData.value = {
      ...nodePositionsData.value,
      [`${nodeId}-${socket.name}`]: {
        x: centerX,
        y: centerY,
        width: m.width,
        height: m.height,
        type,
      },
    };
  }, [tx, ty, canvas?.translateX, canvas?.translateY, canvas?.scale]);

  const longPressGesture = Gesture.LongPress().onStart(() => {
    runOnJS(removeConnections)(nodeId, socket.name);
  });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      const m = measure(ref);
      if (!m) return;
      isConnecting.value = true;
      ghostConnectionStart.value = {
        x: m.pageX + m.width / 2,
        y: m.pageY + m.height / 2,
      };
    })
    .onUpdate((e) => {
      ghostConnectionEnd.value = { x: e.absoluteX, y: e.absoluteY };

      let closestNode: string | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const [otherId, otherPos] of Object.entries(
        nodePositionsData.value,
      )) {
        if (otherId === `${nodeId}-${socket.name}` || otherPos.type === type) {
          continue;
        }
        const distance = Math.hypot(
          e.absoluteX - otherPos.x,
          e.absoluteY - otherPos.y,
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNode = otherId;
        }
      }

      if (closestNode && closestDistance < 50) {
        ghostConnectionSnapTarget.value = closestNode;
      } else {
        ghostConnectionSnapTarget.value = null;
      }
    })
    .onEnd((e) => {
      isConnecting.value = false;
      ghostConnectionStart.value = null;
      ghostConnectionEnd.value = null;
      ghostConnectionSnapTarget.value = null;

      const pos = { pageX: e.absoluteX, pageY: e.absoluteY };
      let closestNode: string | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const [otherId, otherPos] of Object.entries(
        nodePositionsData.value,
      )) {
        if (otherId === `${nodeId}-${socket.name}` || otherPos.type === type) {
          continue;
        }
        const distance = Math.hypot(
          pos.pageX - otherPos.x,
          pos.pageY - otherPos.y,
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNode = otherId;
        }
      }
      if (closestNode) {
        const [targetNodeId, targetSocketName] = closestNode.split('-');
        if (closestDistance < 50) {
          runOnJS(addConnection)({
            from: {
              nodeId: type === 'output' ? nodeId : targetNodeId,
              socket: type === 'output' ? socket.name : targetSocketName,
            },
            to: {
              nodeId: type === 'input' ? nodeId : targetNodeId,
              socket: type === 'input' ? socket.name : targetSocketName,
            },
          });
        }
      }
    });

  const combinedGesture = Gesture.Race(longPressGesture, panGesture);

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View ref={ref} style={styles.socket}>
        <View style={styles.socketInner} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  socket: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socketInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
