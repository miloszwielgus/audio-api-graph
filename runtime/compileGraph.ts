import { AudioContext, AudioParam, AudioScheduledSourceNode } from 'react-native-audio-api';
import type { Connection } from "@/stores/connectionsAtoms";
import type { GraphNode } from "@/stores/graphDataAtoms";
import * as bufferManager from './bufferManager';


function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') {
    if (Number.isFinite(v)) return v;
    return undefined;
  }
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return undefined;
}

export function compileAudioGraph(
  nodes: Map<string, GraphNode>,
  connections: Connection[],
  audioContext: AudioContext
) {
  let activeAudioNodes = new Map<string, any>();
  let cleanupTimeout: number | null = null;

  const stop = (time?: number) => {
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
    }
    
    const stopTime = time === undefined ? audioContext.currentTime : time;
    const delayInMs = Math.max(0, (stopTime - audioContext.currentTime) * 1000);

    for (const node of activeAudioNodes.values()) {
      if (node instanceof AudioScheduledSourceNode && node.stop) {
        try {
          node.stop(stopTime);
        } catch (e) {
          console.warn("Error stopping node:", e);
        }
      }
    }

    cleanupTimeout = setTimeout(() => {
      for (const node of activeAudioNodes.values()) {
        if (node.disconnect && node !== audioContext.destination) {
          node.disconnect();
        }
      }
      activeAudioNodes.clear();
      cleanupTimeout = null;
    }, delayInMs);
  };

  const play = async (time: number) => {
    for (const [nodeId, node] of nodes.entries()) {
      let audioNode: any;
      switch (node.type) {
        case 'Oscillator':
          audioNode = audioContext.createOscillator();
          if (node.data.frequency) audioNode.frequency.value = node.data.frequency;
          if (node.data.type) audioNode.type = node.data.type as OscillatorType;
          break;
        case 'Gain':
          audioNode = audioContext.createGain();
          if (node.data.gain !== undefined) audioNode.gain.value = node.data.gain;
          break;
        case 'BiquadFilter':
          audioNode = audioContext.createBiquadFilter();
          if (node.data.type) audioNode.type = node.data.type as BiquadFilterType;
          if (node.data.frequency) audioNode.frequency.value = node.data.frequency;
          if (node.data.Q) audioNode.Q.value = node.data.Q;
          break;
        case 'StereoPanner':
          audioNode = audioContext.createStereoPanner();
          if (node.data.pan) audioNode.pan.value = node.data.pan;
          break;
        case 'AudioBufferSource': {
          const source = audioContext.createBufferSource();
          const sampleKey = node.data?.sample as string | undefined;
          if (sampleKey) {
            const buf = bufferManager.getCachedBuffer(sampleKey);
            if (buf) {
              source.buffer = buf;
            } else {
              try {
                const loaded = await bufferManager.loadBufferForKey(audioContext, sampleKey);
                source.buffer = loaded;
              } catch (e) {
                console.warn(`Failed to load buffer for sample "${sampleKey}":`, e);
              }
            }
          }
          const playback = toNumber(node.data.playbackRate);
          if (playback !== undefined) {
            if ((source.playbackRate as AudioParam)) (source.playbackRate as AudioParam).value = playback;
          }
          audioNode = source;
          break;
        }
        case 'AudioDestination':
          audioNode = audioContext.destination;
          break;
      }
      if (audioNode) {
        activeAudioNodes.set(nodeId, audioNode);
      }
    }

    for (const connection of connections) {
      const fromNode = activeAudioNodes.get(connection.from.nodeId);
      const toNode = activeAudioNodes.get(connection.to.nodeId);
      const toSocketName = connection.to.socket;

      if (fromNode && toNode) {
        const destination = toNode[toSocketName];
        if (destination instanceof AudioParam) {
          fromNode.connect(destination);
        } else {
          fromNode.connect(toNode);
        }
      }
    }

    for (const node of activeAudioNodes.values()) {
      if (node instanceof AudioScheduledSourceNode) {
        node.start(time);
      }
    }
  };

  return { play, stop };
}

