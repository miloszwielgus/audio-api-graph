import { useAtomValue } from "jotai";
import { Button, View, Text } from "react-native";
import { useState } from "react";
import { compiledGraphAtom, audioContextAtom } from "@/stores";

export function AudioPlayer() {
  const audioContext = useAtomValue(audioContextAtom);
  const compiledGraph = useAtomValue(compiledGraphAtom);
  const [isPlaying,setIsPlaying] = useState(false)

  const togglePlay = () => {
    if(!compiledGraph) {
      console.warn("The audio graph is not compiled yet or is invalid.");
      return;
    }
    if (!isPlaying &&  typeof compiledGraph.play === 'function') {
      compiledGraph.play(audioContext.currentTime);
      setIsPlaying(true)
      return;
    } 
    if(isPlaying) {
      compiledGraph.stop(audioContext.currentTime)
      setIsPlaying(false)
      return;
    }

  };

  return (
    <View style={{ padding: 20 }}>
      <Button title={isPlaying ? "Stop" : "Play"} onPress={togglePlay} />
      <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>
        Build a graph with an Oscillator and a Gain node, then press play!
      </Text>
    </View>
  );
}