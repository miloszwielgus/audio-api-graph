import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioParam,
  AudioScheduledSourceNode,
} from 'react-native-audio-api';

import * as bufferManager from '@/runtime/bufferManager';
import {
  audioContextAtom,
  connectionsAtom,
  nodesMapAtom,
  type GraphNode,
} from '@/stores';

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

export function useAudioEngine() {
  const audioContext = useAtomValue(audioContextAtom);
  const nodesMap = useAtomValue(nodesMapAtom);
  const connections = useAtomValue(connectionsAtom);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activeNodesRef = useRef(new Map<string, any>());

  useEffect(() => {
    if (!isPlaying) return;

    const activeNodes = activeNodesRef.current;
    nodesMap.forEach((nodeData: GraphNode, nodeId: string) => {
      const audioNode = activeNodes.get(nodeId);
      if (!audioNode) return;

      for (const key in nodeData.data) {
        const newValue = nodeData.data[key] as any;
        if (newValue === undefined) continue;

        if (audioNode[key] instanceof AudioParam) {
          if (audioNode[key].value !== newValue) {
            audioNode[key].setTargetAtTime(
              newValue,
              audioContext.currentTime,
              0.015,
            );
          }
        } else if (
          audioNode[key] !== undefined &&
          !(audioNode[key] instanceof AudioParam) &&
          audioNode[key] !== newValue
        ) {
          audioNode[key] = newValue;
        }
      }
    });
  }, [nodesMap, isPlaying, audioContext]);

  const handleStop = useCallback(() => {
    const activeNodes = activeNodesRef.current;
    if (activeNodes.size === 0) return;

    const stopTime = audioContext.currentTime;

    for (const node of activeNodes.values()) {
      if (node instanceof AudioScheduledSourceNode) {
        try {
          node.stop(stopTime);
        } catch (_e) {
          console.warn(_e)
        }
      }
    }

    setTimeout(() => {
      for (const node of activeNodes.values()) {
        if (node.disconnect && node !== audioContext.destination) {
          node.disconnect();
        }
      }
      activeNodes.clear();
    }, 100);

    setIsPlaying(false);
    setIsLoading(false);
  }, [audioContext]);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    if (activeNodesRef.current.size > 0) {
      handleStop();
    }
    const activeNodes = activeNodesRef.current;
    activeNodes.clear();

    for (const [nodeId, node] of nodesMap.entries()) {
      let audioNode: any;
      switch (node.type) {
        case 'Oscillator':
          audioNode = audioContext.createOscillator();
          if (node.data.frequency)
            audioNode.frequency.value = node.data.frequency;
          if (node.data.type) audioNode.type = node.data.type as OscillatorType;
          break;
        case 'Gain':
          audioNode = audioContext.createGain();
          if (node.data.gain !== undefined)
            audioNode.gain.value = node.data.gain;
          break;
        case 'BiquadFilter':
          audioNode = audioContext.createBiquadFilter();
          if (node.data.type)
            audioNode.type = node.data.type as BiquadFilterType;
          if (node.data.frequency)
            audioNode.frequency.value = node.data.frequency;
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
                const loaded = await bufferManager.loadBufferForKey(
                  audioContext,
                  sampleKey,
                );
                source.buffer = loaded;
              } catch (e) {
                console.warn(
                  `Failed to load buffer for sample "${sampleKey}":`,
                  e,
                );
              }
            }
          }
          const playback = toNumber(node.data.playbackRate);
          if (playback !== undefined) {
            if (source.playbackRate as AudioParam)
              (source.playbackRate as AudioParam).value = playback;
          }
          audioNode = source;
          break;
        }
        case 'AudioDestination':
          audioNode = audioContext.destination;
          break;
      }
      if (audioNode) {
        activeNodes.set(nodeId, audioNode);
      }
    }

    for (const connection of connections) {
      const fromNode = activeNodes.get(connection.from.nodeId);
      const toNode = activeNodes.get(connection.to.nodeId);
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

    for (const node of activeNodes.values()) {
      if (node instanceof AudioScheduledSourceNode) {
        node.start(audioContext.currentTime);
      }
    }

    setIsPlaying(true);
    setIsLoading(false);
  }, [nodesMap, connections, audioContext, handleStop]);

  useEffect(() => {
    return () => handleStop();
  }, [handleStop]);

  const togglePlay = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  return { isPlaying, isLoading, togglePlay };
}