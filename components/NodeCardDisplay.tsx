import type React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NodeRegistry, type Socket } from "@/runtime/nodeRegistry";

const colors = {
  background: "#232736", 
  surface: "#272b3c",   
  border: "#7485bd",      
  accent: "#b07eff",      
  textPrimary: "#eef0ff",
  textSecondary: "#c1c6e5",
  shadow: "rgba(0, 0, 0, 0.5)",
};

interface NodeCardDisplayProps {
  nodeType: string;
}

const SocketDisplay: React.FC<{ socket: Socket; type: "input" | "output" }> = ({
  socket,
  type,
}) => {
  const isInput = type === "input";
  const marginStyle = isInput ? styles.inputMargin : styles.outputMargin;

  return (
    <View style={styles.socketRow}>
      {isInput && (
        <View style={[styles.socket, marginStyle]}>
          <View style={styles.socketInner} />
        </View>
      )}
      <Text style={styles.socketLabel}>{socket.name}</Text>
      {!isInput && (
        <View style={[styles.socket, marginStyle]}>
          <View style={styles.socketInner} />
        </View>
      )}
    </View>
  );
};

export const NodeCardDisplay: React.FC<NodeCardDisplayProps> = ({
  nodeType,
}) => {
  const nodeImpl = NodeRegistry.get(nodeType);

  if (!nodeImpl) {
    throw new Error(`Node type "${nodeType}" not found in registry.`);
  }

  return (
    <View style={styles.nodeCard}>
      <Text style={styles.nodeTitle}>{nodeImpl.type}</Text>
      <View style={styles.nodeBody}>
        <View style={styles.inputsContainer}>
          {nodeImpl.inputs.map((input) => (
            <SocketDisplay key={input.name} socket={input} type="input" />
          ))}
        </View>
        <View style={styles.outputsContainer}>
          {nodeImpl.outputs.map((output) => (
            <SocketDisplay key={output.name} socket={output} type="output" />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nodeCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minWidth: 140,
    margin: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nodeTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nodeBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  inputsContainer: {
    flex: 1,
    alignItems: "flex-start",
    paddingRight: 6,
  },
  outputsContainer: {
    flex: 1,
    alignItems: "flex-end",
    paddingLeft: 6,
  },
  socketRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  // FIXED: Replaced old styles with the "hardware jack" styles
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
  inputMargin: {
    marginRight: 8,
  },
  outputMargin: {
    marginLeft: 8,
  },
  socketLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});