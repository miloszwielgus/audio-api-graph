import { useAtomValue } from "jotai";
import { Button, View, Text } from "react-native";
import { compiledGraphAtom, audioContextAtom } from "@/stores";

export function AudioPlayer() {
  const audioContext = useAtomValue(audioContextAtom);
  const compiledGraph = useAtomValue(compiledGraphAtom);

  const playSound = () => {
    if (compiledGraph && typeof compiledGraph.play === 'function') {
      compiledGraph.play(audioContext.currentTime);
      compiledGraph.stop(audioContext.currentTime + 2); // Play for 2 seconds
      console.log("pozdro dla chlopakow")
    } else {
      console.warn("The audio graph is not compiled yet or is invalid.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Play Sound From Graph" onPress={playSound} />
      <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>
        Build a graph with an Oscillator and a Gain node, then press play!
      </Text>
    </View>
  );
}