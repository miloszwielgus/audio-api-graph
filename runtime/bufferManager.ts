import { AudioContext, type AudioBuffer } from 'react-native-audio-api';
import { MUSIC_EXAMPLE, SPEECH_EXAMPLE } from '@/constants/AudioSources';

const SAMPLE_URLS: Record<string, string> = {
  speech:
    SPEECH_EXAMPLE,
  music:
    MUSIC_EXAMPLE
};

const bufferCache: Map<string, AudioBuffer> = new Map();
const loadPromises: Map<string, Promise<AudioBuffer>> = new Map();

export function getCachedBuffer(key: string): AudioBuffer | undefined {
  return bufferCache.get(key);
}

export async function loadBufferForKey(
  audioContext: AudioContext,
  key: string,
): Promise<AudioBuffer> {
  if (bufferCache.has(key)) {
    return bufferCache.get(key)!;
  }

  if (loadPromises.has(key)) {
    return loadPromises.get(key)!;
  }

  const url = SAMPLE_URLS[key];
  if (!url) {
    return Promise.reject(
      new Error(`No URL configured for sample key "${key}"`),
    );
  }

  const p = (async () => {
    // fetch -> arrayBuffer -> decode
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio at ${url}: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer);
    bufferCache.set(key, decoded);
    loadPromises.delete(key);
    return decoded;
  })();

  loadPromises.set(key, p);
  return p;
}

export async function loadBufferForUrl(
  audioContext: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  if (bufferCache.has(url)) {
    return bufferCache.get(url)!;
  }

  if (loadPromises.has(url)) {
    return loadPromises.get(url)!;
  }

  const p = (async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio at ${url}: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer);

    bufferCache.set(url, decoded);
    loadPromises.delete(url);
    return decoded;
  })();

  loadPromises.set(url, p);
  return p;
}

export async function ensureBuffersForNodes(
  audioContext: AudioContext,
  nodes: Map<string, any>,
): Promise<void> {
  const keys = new Set<string>();
  for (const node of nodes.values()) {
    if (node.type === 'AudioBufferSource') {
      const sampleKey = node.data?.sample ?? null;
      if (typeof sampleKey === 'string') {
        keys.add(sampleKey);
      }
    }
  }

  await Promise.all(
    Array.from(keys).map((k) => loadBufferForKey(audioContext, k)),
  );
}
