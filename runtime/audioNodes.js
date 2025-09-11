import { registerNode } from './nodeRegistry.ts';

// No parameters for the destination node
registerNode({
  type: 'AudioDestination',
  inputs: [{ name: 'input', kind: 'audio' }],
  outputs: [],
  compute: () => ({}),
});

// --- UPDATED AND NEW NODES ---

registerNode({
  type: 'Gain',
  inputs: [
    { name: 'input', kind: 'audio' },
  ],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ // <-- ADDED PARAMETERS
    { name: 'gain', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.75 },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'Oscillator',
  inputs: [{ name: 'frequency', kind: 'param' }],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ // <-- ADDED PARAMETERS
    { name: 'frequency', type: 'slider', min: 20, max: 20000, step: 1, defaultValue: 440 },
    { name: 'type', type: 'selector', options: ['sine', 'square', 'sawtooth', 'triangle'], defaultValue: 'sine' },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'BiquadFilter',
  inputs: [
    { name: 'input', kind: 'audio' },
    { name: 'frequency', kind: 'param' },
    { name: 'Q', kind: 'param' },
  ],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ // <-- ADDED PARAMETERS
    { name: 'type', type: 'selector', options: ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'peaking', 'lowshelf', 'highshelf'], defaultValue: 'lowpass' },
    { name: 'frequency', type: 'slider', min: 20, max: 20000, step: 1, defaultValue: 350 },
    { name: 'Q', type: 'slider', min: 0.0001, max: 1000, step: 0.01, defaultValue: 1 },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'StereoPanner',
  inputs: [{ name: 'input', kind: 'audio' }],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ // <-- ADDED PARAMETERS
    { name: 'pan', type: 'slider', min: -1, max: 1, step: 0.01, defaultValue: 0 },
  ],
  compute: () => ({}),
});

// NOTE: AudioBufferSourceNode is special as it needs to load a sample.
// For now, we'll define its parameters. The actual buffer loading is a more complex topic.
registerNode({
  type: 'AudioBufferSource',
  inputs: [{ name: 'playbackRate', kind: 'param' }],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [
    { name: 'sample', type: 'selector', options: ['drum_loop', 'synth_pad', 'vocal_chop'], defaultValue: 'drum_loop' },
    { name: 'playbackRate', type: 'slider', min: 0.1, max: 4, step: 0.01, defaultValue: 1 },
  ],
  compute: () => ({}),
});