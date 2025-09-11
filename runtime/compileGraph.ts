import { AudioContext, AudioScheduledSourceNode } from 'react-native-audio-api';
import type { Connection } from "@/stores/connectionsAtoms";
import type { GraphNode } from "@/stores/graphDataAtoms";

export function compileAudioGraph(
  nodes: Map<string, GraphNode>,
  connections: Connection[],
  audioContext: AudioContext
) {
  const audioNodes = new Map<string, any>();
  let oscillatorNodeId: string | null = null;
  let gainNodeId: string | null = null;

  for (const [nodeId, node] of nodes.entries()) {
    switch (node.type) {
      case 'Oscillator':
        audioNodes.set(nodeId, audioContext.createOscillator());
        oscillatorNodeId = nodeId;
        break;
      case 'Gain':
        audioNodes.set(nodeId, audioContext.createGain());
        gainNodeId = nodeId;
        break;
      case 'AudioDestination':
        audioNodes.set(nodeId, audioContext.destination);
        break;
    }
  }

  for (const connection of connections) {
    const fromNode = audioNodes.get(connection.from.nodeId);
    const toNode = audioNodes.get(connection.to.nodeId);

    if (fromNode && toNode) {
      fromNode.connect(toNode);
    }
  }

  return {
    play: (time: number) => {
      if (!oscillatorNodeId || !gainNodeId) {
        console.warn("Graph must contain an Oscillator and a Gain node to play the sound.");
        return;
      }

      const oscillator = audioNodes.get(oscillatorNodeId);
      const gain = audioNodes.get(gainNodeId);
      
      const tone = 164;
      const decay = 0.2;
      const volume = 0.95;

      oscillator.frequency.setValueAtTime(tone, time);
      oscillator.frequency.exponentialRampToValueAtTime(0.001, time + decay);
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

      oscillator.start(time);
      oscillator.stop(time + decay);
    },
  };
}