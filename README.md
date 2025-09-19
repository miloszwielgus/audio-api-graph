# AudioAPI Graph 

The project is a visual graph playground for the [react-native-audio-api](https://github.com/software-mansion/react-native-audio-api/). Allowing you to see how the audio graph is built.  
[video showcasing the basic functionalities]

## Credits

The implementation of the interactive graph canvas is based on the [typegpu-graph](https://github.com/reczkok/typegpu-graph/) project. Massive thanks to [reczkok](https://github.com/reczkok/)

## Features

- **Visual AudioApi Graph Editor:** Create, connect, and adjust parameters of the nodes
- **Drag & Drop Interaface:** Use gestures to move nodes, the whole graph, zoom in/out on the canvas
- **Audio Graph Compilation:** The graph is compiled into a single sound that you can play

## Nodes 

The app features three categories of nodes: 
- Sources
   - [AudioBufferSourceNode](https://docs.swmansion.com/react-native-audio-api/docs/sources/audio-buffer-source-node)
   - [OscillatorNode](https://docs.swmansion.com/react-native-audio-api/docs/sources/oscillator-node)
   - [StreamerNode](https://docs.swmansion.com/react-native-audio-api/docs/sources/streamer-node)
- Effects
   - [BiquadFilterNode](https://docs.swmansion.com/react-native-audio-api/docs/effects/biquad-filter-node)
   - [StereoPannerNode](https://docs.swmansion.com/react-native-audio-api/docs/effects/stereo-panner-node)
   - [GainNode](https://docs.swmansion.com/react-native-audio-api/docs/effects/gain-node)
- Samples - these are not actual [react-native-audio-api](https://github.com/software-mansion/react-native-audio-api/) nodes, they are added only for better visual representation of the graph, they all need to be connected to the [AudioBufferSourceNode](https://docs.swmansion.com/react-native-audio-api/docs/sources/audio-buffer-source-node)
   - Music 
   - Speech 
   - UrlMusic - allows you to play a sound from an url
- Destinations 
   - [AudioDestinationNode](https://docs.swmansion.com/react-native-audio-api/docs/destinations/audio-destination-node)
## Getting Started

1.  **Install dependencies:**

    ```bash
    yarn install
    ```

2.  **Prebuild and start the Expo project:**

    ```bash
    npx expo prebuild
    npx expo start
    ```

## Play your first sound

1. **Oscillator example**. 

To run this example you only need the default nodes which pop up on the graph screen on app startup.  
You just need to connect them (**Oscillator** -> **Gain** -> **AudioDestination**) and hit play.  
Then you can press on the nodes with the '+' symbol to expand them and adjust their paramters to see how they affect the sound.  
[screenshot]

2. **BiquadFilter example**

In this example we are going to use nodes from the **Node Library**. First you can delete the **Gain** and **Oscillator** nodes.  
Then open the **Node Library** tab and get the **Music**, **AudioBufferSource** and **BiquadFilter** nodes. Now all that is left to do is connect them (**Music** -> **AudioBufferSource** -> **BiquadFilter** -> **AudioDestination**) and hit play. Now you can press on the nodes with the '+' symbol to expand them and adjust their paramters to see how they affect the sound.  
[screenshot]