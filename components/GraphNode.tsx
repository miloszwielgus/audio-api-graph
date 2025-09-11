// GraphNodeView.tsx
import Slider from "@react-native-community/slider";
import { useAtom, useSetAtom } from "jotai";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Connectable } from "@/components/Connectable";
import { NodeTranslateCtx } from "@/components/NodeTranslateContext";
import { NodeRegistry, SelectorParameter, SliderParameter } from "@/runtime/nodeRegistry";
import { removeNodeAtom, topNodeAtom, updateNodeDataAtom, updateNodePositionAtom } from "@/stores";
import type { GraphNode } from "@/stores/graphDataAtoms";
import { InteractionContext } from "./Canvas";

interface GraphNodeViewProps {
  node: GraphNode;
}

const capitalize = (s: string) => {
  if (typeof s !== 'string' || s.length === 0) {
    return '';
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};


const ExpandedParametersView = React.memo(({ node, nodeImpl, isInteracting }: any) => {
  const { id, data } = node;
  const updateNodeData = useSetAtom(updateNodeDataAtom);

  const [openPicker, setOpenPicker] = React.useState<string | null>(null);

  return (
    <View
      style={styles.parametersScrollView}
    >
      {(nodeImpl.parameters ?? []).map((param: any) => {
        const currentValue = data[param.name] ?? (param as any).defaultValue;
        if (param.type === "slider") {
          const s = param as SliderParameter;
          const min = s.min ?? 0;
          const max = s.max ?? 1;
          const step = s.step ?? ((Math.abs(max - min) / 100) || 0.01);
          const numericValue = Number(currentValue);
          return (
            <View key={param.name} style={styles.param}>
              <View style={styles.paramHeader}>
                <Text style={styles.paramLabel}>{capitalize(param.name)}</Text>
                <Text style={styles.paramValue}>
                  {Number.isFinite(numericValue) ? numericValue.toFixed(3) : String(currentValue)}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={min}
                maximumValue={max}
                step={step}
                value={numericValue}
                onSlidingStart={() => { isInteracting.value = 1; }}
                onValueChange={(val) => updateNodeData({ nodeId: id, key: param.name, value: val })}
                onSlidingComplete={() => { isInteracting.value = 0; }}
                thumbTintColor="#e0e0e0"
                minimumTrackTintColor="#a56de2"
                maximumTrackTintColor="#555"
              />
            </View>
          );
        } else { // selector
                    const s = param as SelectorParameter<string>;
          const items = (s.options ?? []).map(opt => ({ label: opt, value: opt }));
          const currentValue = data[param.name] ?? s.defaultValue;

          return (
            <View key={param.name} style={[styles.param, { zIndex: 100 }]}>
              <Text style={styles.paramLabel}>{capitalize(param.name)}</Text>
              <View style={styles.dropdownWrapper}>
                <DropDownPicker
                  open={openPicker === param.name}
                  value={currentValue}
                  items={items}
                  listMode="FLATLIST"
                  setOpen={() => setOpenPicker(openPicker === param.name ? null : param.name)}
                  setValue={(callback) => {
                    const value = callback(currentValue); // Get the new value
                    updateNodeData({ nodeId: id, key: param.name, value });
                  }}
                  // Styling props
                  theme="DARK"
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  dropDownContainerStyle={styles.dropdownList}
                  listItemLabelStyle={styles.dropdownListItemLabel}
                  placeholder="Select an item"
                />
              </View>
            </View>
          );
        }
      })}
    </View>
  );
});

ExpandedParametersView.displayName = 'ExpandedParametersView';


export function GraphNodeView({ node }: GraphNodeViewProps) {
  const { id, type, x, y } = node;
  const interactionCtx = React.useContext(InteractionContext);
  if (!interactionCtx) { throw new Error("GraphNodeView must be used within an InteractionContext provider"); }
  
  const isInteracting = interactionCtx.isInteracting;

  const positionX = useSharedValue(x);
  const positionY = useSharedValue(y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const [isExpanded, setExpanded] = React.useState(false);

  const [topNode, setTopNode] = useAtom(topNodeAtom);
  const removeNode = useSetAtom(removeNodeAtom);
  const setNodePosition = useSetAtom(updateNodePositionAtom);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      //if (isInteracting?.value === 1) return;
      runOnJS(setTopNode)(id);
      startX.value = positionX.value;
      startY.value = positionY.value;
    })
    .onUpdate((e) => {
      //if (isInteracting?.value === 1 || isExpanded) return;
      positionX.value = startX.value + e.translationX;
      positionY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      //if (isInteracting?.value === 1 || isExpanded) return;
      runOnJS(setNodePosition)({ id, x: positionX.value, y: positionY.value });
    });
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: positionX.value },
        { translateY: positionY.value },
      ],
      width: withTiming(isExpanded ? 300 : 220, { duration: 250 }),
      height: withTiming(isExpanded ? 350 : 120, { duration: 250 }),
    };
  });

  const nodeImpl = NodeRegistry.get(type);
  if (!nodeImpl) {
    throw new Error(`Node type "${type}" not found in registry`);
  }

  const handleLongPress = () => {
    setTopNode(id);
    setExpanded(!isExpanded);
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
                <Text style={styles.removeButtonText}>×</Text>
              </Pressable>
            )}

            <View style={styles.headerInner}>
              <Text style={styles.nodeTitle}>{nodeImpl.type}</Text>
            </View>
          </View>
        </GestureDetector>

        <Pressable
          style={styles.bodyPressable}
          onLongPress={handleLongPress}
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
            <Text style={styles.hintText}>
              Long-press to {isExpanded ? "collapse" : "edit"}
            </Text>
          </View>
        </Pressable>

        {isExpanded && (
          <ExpandedParametersView
            node={node}
            nodeImpl={nodeImpl}
            isInteracting={isInteracting}
          />
        )}
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
    overflow: 'hidden',
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    marginBottom: 6,
  },
  headerInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  nodeTitle: {
    color: "#f0f0f0",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  bodyPressable: {},
  nodeBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 6,
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
    paddingBottom: 4, 
  },
  hintText: {
    color: '#9a9a9a',
    fontSize: 11,
  },
  removeButton: {
    position: "absolute",
    top: -10, 
    right: -10,
    backgroundColor: '#382b2b', 
    width: 28, 
    height: 28,
    borderRadius: 8, 
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 1, 
    borderColor: '#5c4040', 
  },
  removeButtonText: {
    color: "#ff8f8f", 
    fontWeight: "bold",
    fontSize: 14, 
    lineHeight: 16, 
  },
  parametersScrollView: {
    flex: 1,
    marginTop: 10,
  },
  parametersContent: {
    paddingBottom: 16,
  },
  param: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  paramHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 4,
  },
  paramLabel: {
    color: "#e0e0e0",
    fontSize: 13,
    fontWeight: "600",
  },
  paramValue: {
    color: "#aaa",
    fontSize: 12,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  pickerWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#2b2b2b",
    overflow: "hidden",
    marginTop: 4,
    height: 48, 
  },
  picker: {
    height: 48,
    width: "100%",
    color: '#fff',
    backgroundColor: 'transparent', 
  },
dropdownContainer: {
  marginTop: 4,
},
dropdown: {
  backgroundColor: '#2b2b2b',
  borderColor: '#444',
},
dropdownList: {
  backgroundColor: '#2b2b2b',
  borderColor: '#444',
},
dropdownListItemLabel: {
  color: '#fff',
},
dropdownWrapper: {
  position: "absolute",   // escape clipping
  left: 0,
  right: 0,
  top: 20,                // adjust so it lines up with your label
  zIndex: 9999,
  elevation: 9999,
},
});