import { atom } from "jotai";
import { AudioContext } from 'react-native-audio-api';

import { NodeRegistry } from "@/runtime/nodeRegistry";
import "@/runtime/audioNodes"; 
import { compileAudioGraph } from "@/runtime/compileGraph"; 
import { connectionsAtom } from "./connectionsAtoms";

export type NodeData = Record<string, number | string>;

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  data: NodeData; 
}

const initialNodes: GraphNode[] = [
  { id: "osc_1", type: "Oscillator", x: 50, y: 150, data: { frequency: 440, type: 'sine' } },
  { id: "gain_1", type: "Gain", x: 250, y: 150, data: { gain: 20} },
  { id: "destination_1", type: "AudioDestination", x: 250, y: 50, data: {} },
];

export const audioContextAtom = atom(new AudioContext());

export const topNodeAtom = atom<string | null>(null);

export const graphNodesAtom = atom<GraphNode[]>(initialNodes);

export const addNodeAtom = atom(
  null,
  (get, set, type: string) => {
    const nodeImpl = NodeRegistry.get(type);
    if (!nodeImpl) {
      console.error(`Node type "${type}" not found in registry.`);
      return;
    }

    const initialData: NodeData = {};
    if (nodeImpl.parameters) {
      for (const param of nodeImpl.parameters) {
        initialData[param.name] = param.defaultValue;
      }
    }

    const currentNodes = get(graphNodesAtom);
    const newNode: GraphNode = {
      id: `${type}_${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      data: initialData, 
    };
    set(graphNodesAtom, [...currentNodes, newNode]);
  }
);

export const updateNodeDataAtom = atom(
  null,
  (get, set, { nodeId, key, value }: { nodeId: string, key: string, value: number | string }) => {
    const prev = get(graphNodesAtom) ?? [];
    set(
      graphNodesAtom,
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    );
  }
);

export const removeNodeAtom = atom(
  null, 
  (get, set, nodeId: string) => {
    if (nodeId === "destination_1") {
      return;
    }

    const currentNodes = get(graphNodesAtom);
    const filteredNodes = currentNodes.filter((node) => node.id !== nodeId);
    set(graphNodesAtom, filteredNodes);

    const currentConnections = get(connectionsAtom);
    const filteredConnections = currentConnections.filter(
      (conn) => conn && conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
    );
    set(connectionsAtom, filteredConnections);

    if (get(topNodeAtom) === nodeId) {
      set(topNodeAtom, null);
    }
  }
);

export const updateNodePositionAtom = atom(
  null,
  (get, set, payload: { id: string; x: number; y: number }) => {
    if (!payload) return;
    const { id, x, y } = payload;
    const prev = get(graphNodesAtom) ?? [];
    set(
      graphNodesAtom,
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  }
);


export const nodesMapAtom = atom((get) => {
  const nodes = get(graphNodesAtom);
  const map = new Map<string, GraphNode>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
});

export const compiledGraphAtom = atom((get) => {
  const nodes = get(nodesMapAtom);
  const connections = get(connectionsAtom);
  const audioContext = get(audioContextAtom);

  return compileAudioGraph(nodes, connections, audioContext);
});