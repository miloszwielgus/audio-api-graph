import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NodeRegistry } from '@/runtime/nodeRegistry';

const colors = {
  background: '#232736',
  surface: '#272b3c',
  border: '#7485bd',
  accent: '#b07eff',
  textPrimary: '#eef0ff',
  textSecondary: '#c1c6e5',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

const HEADER_HEIGHT = 37;
const ROW_HEIGHT = 29;
const BODY_PADDING_TOP = 12;
const SOCKET_DIAMETER = 16;

interface NodeCardDisplayProps {
  nodeType: string;
}

export const NodeCardDisplay: React.FC<NodeCardDisplayProps> = ({
  nodeType,
}) => {
  const nodeImpl = NodeRegistry.get(nodeType);

  if (!nodeImpl) {
    throw new Error(`Node type "${nodeType}" not found in registry.`);
  }

  const getSocketPosition = (index: number) => {
    return (
      HEADER_HEIGHT +
      BODY_PADDING_TOP +
      index * ROW_HEIGHT +
      ROW_HEIGHT / 2 -
      SOCKET_DIAMETER / 2
    );
  };

  return (
    <View style={styles.nodeCard}>
      <View style={styles.header}>
        <Text style={styles.nodeTitle}>{nodeImpl.type}</Text>
      </View>

      <View style={styles.nodeBody}>
        <View style={styles.inputsContainer}>
          {(nodeImpl.inputs ?? []).map((input) => (
            <View key={input.name} style={styles.labelWrapper}>
              <Text style={styles.socketLabel}>{input.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.outputsContainer}>
          {(nodeImpl.outputs ?? []).map((output) => (
            <View key={output.name} style={styles.labelWrapper}>
              <Text style={[styles.socketLabel, styles.outputLabel]}>
                {output.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {(nodeImpl.inputs ?? []).map((input, index) => (
        <View
          key={`input-socket-${input.name}`}
          style={[
            styles.socket,
            styles.inputSocket,
            { top: getSocketPosition(index) },
          ]}
        >
          <View style={styles.socketInner} />
        </View>
      ))}
      {(nodeImpl.outputs ?? []).map((output, index) => (
        <View
          key={`output-socket-${output.name}`}
          style={[
            styles.socket,
            styles.outputSocket,
            { top: getSocketPosition(index) },
          ]}
        >
          <View style={styles.socketInner} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  nodeCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 160,
    margin: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 10,
    height: HEADER_HEIGHT,
  },
  nodeTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  nodeBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: BODY_PADDING_TOP,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  inputsContainer: {
    alignItems: 'flex-start',
    flex: 1,
  },
  outputsContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  labelWrapper: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  socketLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  outputLabel: {
    textAlign: 'right',
  },
  socket: {
    position: 'absolute',
    width: SOCKET_DIAMETER,
    height: SOCKET_DIAMETER,
    borderRadius: SOCKET_DIAMETER / 2,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  inputSocket: {
    left: 0,
    transform: [{ translateX: -SOCKET_DIAMETER / 2 }],
  },
  outputSocket: {
    right: 0,
    transform: [{ translateX: SOCKET_DIAMETER / 2 }],
  },
  socketInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});