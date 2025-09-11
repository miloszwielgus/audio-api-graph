import { useAtom, useSetAtom } from "jotai";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Connectable } from "@/components/Connectable";
import { NodeTranslateCtx } from "@/components/NodeTranslateContext";
import { NodeRegistry } from "@/runtime/nodeRegistry";
import { removeNodeAtom, topNodeAtom, updateNodeDataAtom, updateNodePositionAtom } from "@/stores";
import type { GraphNode } from "@/stores/graphDataAtoms";

interface GraphNodeViewProps {
  node: GraphNode;
}

export function GraphNodeView({ node }: GraphNodeViewProps) {
  const { id, type, x, y } = node;
  const positionX = useSharedValue(x);
  const positionY = useSharedValue(y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [topNode, setTopNode] = useAtom(topNodeAtom);
  const removeNode = useSetAtom(removeNodeAtom);
  const setNodePosition = useSetAtom(updateNodePositionAtom);
 // const updateNodeData = useSetAtom(updateNodeDataAtom);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setTopNode)(id);
      startX.value = positionX.value;
      startY.value = positionY.value;
    })
    .onUpdate((e) => {
      positionX.value = startX.value + e.translationX;
      positionY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(setNodePosition)({ id, x: positionX.value, y: positionY.value });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value },
      { translateY: positionY.value },
    ],
  }));

  const nodeImpl = NodeRegistry.get(type);
  if (!nodeImpl) {
    throw new Error(`Node type "${type}" not found in registry`);
  }

  return (
    <GestureDetector gesture={panGesture}>
      <NodeTranslateCtx.Provider value={{ tx: positionX, ty: positionY }}>
        <Animated.View
          style={[
            styles.node,
            animatedStyle,
            { zIndex: topNode === id ? 1 : 0 },
          ]}
        >
          {type !== "AudioDestination" && (
            <Pressable
              style={styles.removeButton}
              onPress={() => removeNode(id)}
            >
              <Text style={styles.removeButtonText}>X</Text>
            </Pressable>
          )}
          <Text style={styles.nodeTitle}>{nodeImpl.type}</Text>

          <View style={styles.nodeBody}>
            <View style={styles.inputsContainer}>
              {nodeImpl.inputs.map((input) => (
                <Connectable
                  key={`input-${id}-${input.name}`}
                  nodeId={id}
                  socket={input}
                  type="input"
                />
              ))}
            </View>

            {node.type !== "AudioDestination" && (
              <View style={styles.outputsContainer}>
                {nodeImpl.outputs.map((output) => (
                  <Connectable
                    key={`output-${id}-${output.name}`}
                    nodeId={id}
                    socket={output}
                    type="output"
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </NodeTranslateCtx.Provider>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  node: {
    position: "absolute",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    minWidth: 150,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  nodeTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  nodeBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 40, 
  },
  inputsContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
    paddingRight: 10,
    flex: 1,
  },
  outputsContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 10,
    flex: 1,
  },
  inputField: {
    backgroundColor: "#333",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 4,
    padding: 4,
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8, 
    backgroundColor: "#ff3b30",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    lineHeight: 12,
    marginTop: -1, 
  },
});
