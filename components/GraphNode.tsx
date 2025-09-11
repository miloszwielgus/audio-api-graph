// GraphNodeView.tsx
import React from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";

import { Connectable } from "@/components/Connectable";
import { NodeTranslateCtx } from "@/components/NodeTranslateContext";
import { NodeRegistry, SelectorParameter, SliderParameter } from "@/runtime/nodeRegistry";
import { removeNodeAtom, topNodeAtom, updateNodeDataAtom, updateNodePositionAtom } from "@/stores";
import type { GraphNode } from "@/stores/graphDataAtoms";
import { InteractionContext } from "./Canvas";

interface GraphNodeViewProps {
  node: GraphNode;
}

export function GraphNodeView({ node }: GraphNodeViewProps) {
  const { id, type, x, y, data } = node;
  // Interaction context: present if Canvas provided it (keeps compatibility)
  const interactionCtx = React.useContext(InteractionContext);
  if (!interactionCtx) { throw new Error("GraphNodeView must be used within an InteractionContext provider"); }
  
  // fallback local shared value (safe if context was removed)
  const isInteracting = interactionCtx?.isInteracting;

  const positionX = useSharedValue(x);
  const positionY = useSharedValue(y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const [isModalOpen, setModalOpen] = React.useState(false);

  const [topNode, setTopNode] = useAtom(topNodeAtom);
  const removeNode = useSetAtom(removeNodeAtom);
  const setNodePosition = useSetAtom(updateNodePositionAtom);
  const updateNodeData = useSetAtom(updateNodeDataAtom);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isInteracting?.value === 1) return;
      runOnJS(setTopNode)(id);
      startX.value = positionX.value;
      startY.value = positionY.value;
    })
    .onUpdate((e) => {
      if (isInteracting?.value === 1) return;
      positionX.value = startX.value + e.translationX;
      positionY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      if (isInteracting?.value === 1) return;
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

  const openModal = () => {
    isInteracting.value = 1;
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    isInteracting.value = 0;
  };

  return (
    <NodeTranslateCtx.Provider value={{ tx: positionX, ty: positionY }}>
      <Animated.View
        style={[
          styles.node,
          animatedStyle,
          { zIndex: topNode === id ? 1 : 0 },
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.header}>
            {type !== "AudioDestination" && (
              <Pressable
                style={styles.removeButton}
                onPress={() => removeNode(id)}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </Pressable>
            )}

            <View style={styles.headerInner}>
              <Text style={styles.nodeTitle}>{nodeImpl.type}</Text>
            </View>
          </View>
        </GestureDetector>

        <Pressable
          style={styles.bodyPressable}
          onLongPress={openModal}
          android_ripple={{ color: "#333", borderless: false }}
        >
          <View style={styles.nodeBody}>
            <View style={styles.inputsContainer}>
              {(nodeImpl.inputs ?? []).map((input) => (
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
                {(nodeImpl.outputs ?? []).map((output) => (
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

          <View style={styles.hintRow}>
            <Text style={styles.hintText}>Long-press to edit</Text>
          </View>
        </Pressable>

        <Modal
          visible={isModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{nodeImpl.type}</Text>
                <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalPorts}>
                  <View style={styles.modalPortList}>
                    {nodeImpl.inputs?.map((inpt) => (
                      <Text key={inpt.name} style={styles.modalPortText}>In: {inpt.name}</Text>
                    ))}
                  </View>
                  <View style={styles.modalPortList}>
                    {nodeImpl.outputs?.map((outp) => (
                      <Text key={outp.name} style={styles.modalPortText}>Out: {outp.name}</Text>
                    ))}
                  </View>
                </View>

                {(nodeImpl.parameters ?? []).map((param) => {
                  const currentValue = data[param.name] ?? (param as any).defaultValue;
                  if (param.type === "slider") {
                    const s = param as SliderParameter;
                    const min = s.min ?? 0;
                    const max = s.max ?? 1;
                    const step = s.step ?? ((Math.abs(max - min) / 100) || 0.01);
                    const numericValue = Number(currentValue);
                    return (
                      <View key={param.name} style={styles.modalParam}>
                        <View style={styles.modalParamHeader}>
                          <Text style={styles.modalParamLabel}>{param.name}</Text>
                          <Text style={styles.modalParamValue}>
                            {Number.isFinite(numericValue) ? numericValue.toFixed(3) : String(currentValue)}
                          </Text>
                        </View>

                        <Slider
                          style={styles.modalSlider}
                          minimumValue={min}
                          maximumValue={max}
                          step={step}
                          value={numericValue}
                          onSlidingStart={() => { isInteracting.value = 1; }}
                          onValueChange={(val) => updateNodeData({ nodeId: id, key: param.name, value: val })}
                          onSlidingComplete={(val) => { isInteracting.value = 0; updateNodeData({ nodeId: id, key: param.name, value: val }); }}
                          thumbTintColor="#fff"
                        />
                      </View>
                    );
                  } else { 
                    const s = param as SelectorParameter<string>;
                    const options = s.options ?? [];
                    return (
                      <View key={param.name} style={styles.modalParam}>
                        <Text style={styles.modalParamLabel}>{param.name}</Text>

                        <View style={styles.modalPickerWrapper}>
                          <Picker
                            selectedValue={currentValue}
                            onValueChange={(val) => updateNodeData({ nodeId: id, key: param.name, value: val })}
                            mode="dropdown"
                            style={styles.modalPicker}
                          >
                            {options.map((opt) => (
                              <Picker.Item key={opt} label={opt} value={opt} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </NodeTranslateCtx.Provider>
  );
}

const styles = StyleSheet.create({
  node: {
    position: "absolute",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    minWidth: 220,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    marginBottom: 6,
  },
  headerInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  nodeTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  bodyPressable: {
    paddingVertical: 8,
    paddingHorizontal: 6,
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
    paddingRight: 8,
    flex: 1,
  },
  outputsContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 8,
    flex: 1,
  },

  hintRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  hintText: {
    color: '#9a9a9a',
    fontSize: 11,
  },

  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#ff3b30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    lineHeight: 12,
  },

  // ---- Modal styles ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
  },
  modalContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#202020",
    maxHeight: "86%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalClose: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalBody: {
    padding: 12,
    paddingBottom: 28,
  },

  modalPorts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalPortList: {
    flex: 1,
  },
  modalPortText: {
    color: "#bbb",
    fontSize: 12,
  },

  modalParam: {
    marginBottom: 16,
  },
  modalParamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalParamLabel: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: "600",
  },
  modalParamValue: {
    color: "#aaa",
    fontSize: 13,
  },

  modalSlider: {
    width: "100%",
    height: 48,
  },

  modalPickerWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#2b2b2b",
    overflow: "hidden",
    minHeight: 48,
    justifyContent: "center",
  },
  modalPicker: {
    height: 48,
    width: "100%",
    alignSelf: "stretch",
  },
});
