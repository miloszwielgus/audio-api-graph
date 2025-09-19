import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAtom, useSetAtom } from 'jotai';
import React, { useContext } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CanvasTransformContext } from '@/components/Canvas';
import { Connectable } from '@/components/Connectable';
import { NodeTranslateCtx } from '@/components/NodeTranslateContext';
import {
  NodeRegistry,
  SelectorParameter,
  SliderParameter,
} from '@/runtime/nodeRegistry';
import {
  removeNodeAtom,
  topNodeAtom,
  updateNodeDataAtom,
  updateNodePositionAtom,
} from '@/stores';
import type { GraphNode } from '@/stores/graphDataAtoms';

const colors = {
  background: '#232736',
  surface: '#272b3c',
  surface2: '#30354a',
  border: '#7485bd',
  accent: '#b07eff',
  accent2: '#c49ffe',
  textPrimary: '#eef0ff',
  textSecondary: '#c1c6e5',
  textHint: '#abbcf5',
  danger: '#914f55',
  dangerText: '#ffb4b2',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

interface GraphNodeViewProps {
  node: GraphNode;
}

const capitalize = (s: string) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const nodeIcons: {
  [key: string]: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
} = {
  AudioDestination: 'volume-high',
  Speech: 'podcast',
  Music: 'music-note',
};
const defaultNodeIcon = 'cogs'; // fallback icon

const ExpandedParametersView = React.memo(
  ({ node, nodeImpl, onHeightChange }: any) => {
    const { id, data } = node;
    const updateNodeData = useSetAtom(updateNodeDataAtom);
    const [openPicker, setOpenPicker] = React.useState<string | null>(null);
    const [displayValues, setDisplayValues] =
      React.useState<Record<string, any>>(data);

    React.useEffect(() => {
      setDisplayValues(data);
    }, [data]);

    const handleLayout = (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      const PADDING_BOTTOM = 15;
      onHeightChange(height + PADDING_BOTTOM);
    };

    return (
      <View style={styles.parametersScrollView} onLayout={handleLayout}>
        {(nodeImpl.parameters ?? []).map((param: any, index: number) => {
          const currentValue = data[param.name] ?? (param as any).defaultValue;
          const displayValue =
            displayValues[param.name] ?? (param as any).defaultValue;
          if (param.type === 'slider') {
            const s = param as SliderParameter;
            const min = s.min ?? 0;
            const max = s.max ?? 1;
            const step = s.step ?? (Math.abs(max - min) / 100 || 0.01);
            return (
              <View key={param.name} style={styles.param}>
                <View style={styles.paramHeader}>
                  <Text style={styles.paramLabel}>
                    {capitalize(param.name)}
                  </Text>
                  <Text style={styles.paramValue}>
                    {Number(displayValue).toFixed(3)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={min}
                  maximumValue={max}
                  step={step}
                  value={Number(currentValue)}
                  onValueChange={(val) => {
                    setDisplayValues((prev) => ({
                      ...prev,
                      [param.name]: val,
                    }));
                  }}
                  onSlidingComplete={(val) => {
                    updateNodeData({
                      nodeId: id,
                      key: param.name,
                      value: val,
                    });
                  }}
                  thumbTintColor={colors.accent2}
                  minimumTrackTintColor={colors.accent}
                  maximumTrackTintColor={colors.surface2}
                />
              </View>
            );
          } else if (param.type === 'url') {
            return (
              <View key={param.name} style={styles.param}>
                <Text style={styles.paramLabel}>
                  {capitalize(param.name)}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={String(displayValue)}
                  multiline={true}
                  onChangeText={(text) => {
                    setDisplayValues((prev) => ({
                      ...prev,
                      [param.name]: text,
                    }));
                  }}
                  onEndEditing={(e) => {
                    updateNodeData({
                      nodeId: id,
                      key: param.name,
                      value: e.nativeEvent.text,
                    });
                  }}
                  placeholder="Enter stream URL (.m3u8)"
                  placeholderTextColor={colors.textHint}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            );
          } else {
            const s = param as SelectorParameter<string>;
            const items = (s.options ?? []).map((opt) => ({
              label: opt,
              value: opt,
            }));
            const isPickerOpen = openPicker === param.name;
            return (
              <View
                key={param.name}
                style={[
                  styles.param,
                  { zIndex: isPickerOpen ? 100 - index : 1 },
                ]}
              >
                <Text style={styles.paramLabel}>
                  {capitalize(param.name)}
                </Text>
                <DropDownPicker
                  open={isPickerOpen}
                  value={currentValue}
                  items={items}
                  listMode="FLATLIST"
                  setOpen={() =>
                    setOpenPicker(isPickerOpen ? null : param.name)
                  }
                  setValue={(callback) => {
                    const value = callback(currentValue);
                    updateNodeData({ nodeId: id, key: param.name, value });
                  }}
                  theme="DARK"
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  dropDownContainerStyle={styles.dropdownList}
                  listItemLabelStyle={styles.dropdownListItemLabel}
                  placeholder="Select an item"
                />
              </View>
            );
          }
        })}
      </View>
    );
  },
);
ExpandedParametersView.displayName = 'ExpandedParametersView';

export function GraphNodeView({ node }: GraphNodeViewProps) {
  const { id, type, x, y } = node;
  const canvasTransform = useContext(CanvasTransformContext);
  if (!canvasTransform) {
    throw new Error(
      'GraphNodeView must be used within a Canvas component that provides CanvasTransformContext',
    );
  }
  const { scale: canvasScale } = canvasTransform;

  const positionX = useSharedValue(x);
  const positionY = useSharedValue(y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [isExpanded, setExpanded] = React.useState(false);
  const [topNode, setTopNode] = useAtom(topNodeAtom);
  const removeNode = useSetAtom(removeNodeAtom);
  const setNodePosition = useSetAtom(updateNodePositionAtom);

  const nodeImpl = NodeRegistry.get(type);
  if (!nodeImpl) {
    throw new Error(`Node type "${type}" not found in registry`);
  }

  const numParameters = nodeImpl.parameters?.length ?? 0;
  const BASE_HEIGHT = 100;
  const PARAM_HEIGHT = 65;

  const [parametersHeight, setParametersHeight] = React.useState(
    numParameters * PARAM_HEIGHT,
  );

  const expandedHeight = BASE_HEIGHT + parametersHeight;

  const headerPanGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setTopNode)(id);
      startX.value = positionX.value;
      startY.value = positionY.value;
    })
    .onUpdate((e) => {
      positionX.value = startX.value + e.translationX / canvasScale.value;
      positionY.value = startY.value + e.translationY / canvasScale.value;
    })
    .onEnd(() => {
      runOnJS(setNodePosition)({ id, x: positionX.value, y: positionY.value });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: positionX.value },
        { translateY: positionY.value },
      ],
      height: withTiming(isExpanded ? expandedHeight : BASE_HEIGHT, {
        duration: 100,
      }),
    };
  });

  const handleLongPress = () => {
    if (numParameters === 0) return;
    setTopNode(id);
    setExpanded(!isExpanded);
  };

  const toggleExpandFromIcon = () => {
    if (numParameters === 0) return;
    setTopNode(id);
    setExpanded((v) => !v);
  };

  return (
    <Animated.View
      exiting={FadeOut}
      style={[styles.node, animatedStyle, { zIndex: topNode === id ? 2 : 1 }]}
    >
      <NodeTranslateCtx.Provider value={{ tx: positionX, ty: positionY }}>
        <View style={styles.nodeContent}>
          <GestureDetector gesture={headerPanGesture}>
            <View style={styles.header}>
              <Text style={styles.nodeTitle}>{nodeImpl.type}</Text>
            </View>
          </GestureDetector>

          <Pressable
            style={styles.bodyPressable}
            onLongPress={handleLongPress}
            android_ripple={{ color: colors.surface2 }}
          >
            {numParameters > 0 ? (
              <>
                {!isExpanded && (
                  <View style={styles.hintContainer}>
                    <Pressable
                      onPress={toggleExpandFromIcon}
                      style={({ pressed }) => [
                        styles.expandIcon,
                        pressed && styles.expandIconPressed,
                      ]}
                      accessibilityLabel="Expand parameters"
                    >
                      <Text
                        style={[
                          styles.expandIconText,
                          isExpanded && styles.expandIconTextExpanded,
                        ]}
                      >
                        {isExpanded ? '-' : '+'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {isExpanded && (
                  <Animated.View
                    style={styles.parametersContainer}
                    entering={FadeIn.duration(250).delay(50)}
                    exiting={FadeOut.duration(150)}
                  >
                    <ExpandedParametersView
                      node={node}
                      nodeImpl={nodeImpl}
                      onHeightChange={setParametersHeight}
                    />
                  </Animated.View>
                )}
              </>
            ) : (
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={nodeIcons[type] || defaultNodeIcon}
                  size={36}
                  color={colors.textHint}
                />
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.socketsContainer}>
          {(nodeImpl.inputs ?? []).map((input, index) => (
            <View
              key={`input-${id}-${input.name}`}
              style={[
                styles.socket,
                styles.inputSocket,
                { top: 40 + index * 25 },
              ]}
            >
              <Connectable nodeId={id} socket={input} type="input" />
            </View>
          ))}

          {node.type !== 'AudioDestination' &&
            (nodeImpl.outputs ?? []).map((output, index) => (
              <View
                key={`output-${id}-${output.name}`}
                style={[
                  styles.socket,
                  styles.outputSocket,
                  { top: 40 + index * 25 },
                ]}
              >
                <Connectable nodeId={id} socket={output} type="output" />
              </View>
            ))}
        </View>

        {type !== 'AudioDestination' && (
          <Pressable style={styles.removeButton} onPress={() => removeNode(id)}>
            <Text style={styles.removeButtonText}>×</Text>
          </Pressable>
        )}
      </NodeTranslateCtx.Provider>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeContent: {
    flex: 1,
    borderRadius: 9, 
  },
  header: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
  },
  nodeTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  bodyPressable: {
    flex: 1,
    justifyContent: 'center',
  },
  hintContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  expandIconPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  expandIconText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  expandIconTextExpanded: {
    transform: [{ rotate: '0deg' }],
  },
  hintText: {
    color: colors.textHint,
    fontSize: 11,
    fontStyle: 'italic',
  },
  socketsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  socket: {
    position: 'absolute',
    zIndex: 10,
    pointerEvents: 'auto',
  },
  inputSocket: {
    left: 0,
    transform: [{ translateX: -8 }],
  },
  outputSocket: {
    right: 0,
    transform: [{ translateX: 8 }],
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: colors.dangerText,
  },
  removeButtonText: {
    color: colors.dangerText,
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 20,
  },
  parametersContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  parametersScrollView: {},
  param: {
    marginVertical: 4,
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  paramLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  paramValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  slider: {
    width: '100%',
    height: 30,
  },
  dropdownContainer: {
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    height: 35,
    minHeight: 35,
  },
  dropdownList: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  dropdownListItemLabel: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  textInput: {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
});