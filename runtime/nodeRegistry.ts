import type { GraphNode } from "@/stores/graphDataAtoms";

export type SocketKind = "audio" | "param";
export interface Socket {
  name: string;
  kind: SocketKind;
}

export type SliderParameter = {
  type: 'slider';
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type SelectorParameter<T extends string> = {
  type: 'selector';
  name: string;
  options: readonly T[];
  defaultValue: T;
};

export type URLParameter = {
  type: 'url';
  name: string;
  defaultValue: string;
}

export type ParameterDefinition = SliderParameter | SelectorParameter<string> | URLParameter;

export interface NodeImpl {
  /** unique key, e.g. "input", "add", "noise" … */
  type: string;
  /** ordered list → left column in the node */
  inputs: Socket[];
  /** ordered list → right column in the node */
  outputs: Socket[];
  /** list of parameters to be controlled by the user */
  parameters?: ParameterDefinition[]; 
  compute(
    args: Record<string, string>,
    node: GraphNode,
  ): Record<string, string>;
}

/** central registry */
export const NodeRegistry = new Map<string, NodeImpl>();

export function registerNode(node: NodeImpl) {
  NodeRegistry.set(node.type, node);
}