import { atom } from "jotai";
import { AudioContext } from 'react-native-audio-api';

import "@/runtime/audioNodes"; 
import { compileAudioGraph } from "@/runtime/compileGraph"; 
import { connectionsAtom } from "./connectionsAtoms";

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  data?: Record<string, unknown>;
}

const initialNodes: GraphNode[] = [
  { id: "osc_1", type: "Oscillator", x: 50, y: 150 },
  { id: "gain_1", type: "Gain", x: 250, y: 150 },
  { id: "destination_1", type: "AudioDestination", x: 250, y: 50 },
];

export const audioContextAtom = atom(new AudioContext());

export const topNodeAtom = atom<string | null>(null);

export const graphNodesAtom = atom<GraphNode[]>(initialNodes);

export const addNodeAtom = atom(
  null, 
  (get, set, type: string) => {
    const currentNodes = get(graphNodesAtom);
    const newNode: GraphNode = {
      id: `${type}_${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      data: {},
    };
    set(graphNodesAtom, [...currentNodes, newNode]);
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