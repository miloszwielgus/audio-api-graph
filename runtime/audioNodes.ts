import { registerNode } from './nodeRegistry.ts';

registerNode({
  type: 'AudioDestination',
  inputs: [{ name: 'input', kind: 'audio' }],
  outputs: [],
  compute: () => ({}),
});


registerNode({
  type: 'Gain',
  inputs: [
    { name: 'input', kind: 'audio' },
  ],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ 
    { name: 'gain', type: 'slider', min: 0, max: 20, step: 0.01, defaultValue: 15 },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'Oscillator',
  inputs: [],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ 
    { name: 'frequency', type: 'slider', min: 20, max: 3000, step: 10, defaultValue: 440 },
    { name: 'type', type: 'selector', options: ['sine', 'square', 'sawtooth', 'triangle'], defaultValue: 'sine' },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'BiquadFilter',
  inputs: [
    { name: 'input', kind: 'audio' },
  ],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ 
    { name: 'type', type: 'selector', options: ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'peaking', 'lowshelf', 'highshelf'], defaultValue: 'lowpass' },
    { name: 'frequency', type: 'slider', min: 20, max: 3000, step: 10, defaultValue: 440 },
    { name: 'Q', type: 'slider', min: 0.1, max: 20, step: 0.1, defaultValue: 1 },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'StereoPanner',
  inputs: [{ name: 'input', kind: 'audio' }],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [ 
    { name: 'pan', type: 'slider', min: -1, max: 1, step: 0.01, defaultValue: 0 },
  ],
  compute: () => ({}),
});

registerNode({
  type: 'AudioBufferSource',
  inputs: [],
  outputs: [{ name: 'output', kind: 'audio' }],
  parameters: [
    { name: 'sample', type: 'selector', options: ['speech','music'], defaultValue: 'music' },
    { name: 'playbackRate', type: 'slider', min: 0.1, max: 4, step: 0.01, defaultValue: 1 },
  ],
  compute: () => ({}),
});