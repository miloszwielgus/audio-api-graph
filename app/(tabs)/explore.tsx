import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NodeCardDisplay } from '@/components/NodeCardDisplay';
import { NodeRegistry } from '@/runtime/nodeRegistry';
import { addNodeAtom } from '@/stores/graphDataAtoms';

const nodeGroups = [
  {
    title: 'Sources',
    nodes: ['Oscillator', 'AudioBufferSource', 'Streamer'],
  },
  {
    title: 'Samples',
    nodes: ['Music', 'Speech', 'UrlMusic'],
  },
  {
    title: 'Effects',
    nodes: ['BiquadFilter', 'StereoPanner', 'Gain'],
  },
];

export default function NodeLibraryScreen() {
  const addNode = useSetAtom(addNodeAtom);
  const router = useRouter();

  const availableNodes = new Set(NodeRegistry.keys());

  const sections = nodeGroups
    .map((group) => ({
      title: group.title,
      data: group.nodes.filter((node) => availableNodes.has(node)),
    }))
    .filter((group) => group.data.length > 0);

  const handleAddNode = (type: string) => {
    addNode(type);
    router.push('/'); // Navigate back to the Graph tab
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.gridContainer}>
              {section.data.map((nodeType) => (
                <Pressable
                  key={nodeType}
                  onPress={() => handleAddNode(nodeType)}
                >
                  <NodeCardDisplay nodeType={nodeType} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d2c',
  },
  scrollContentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#eef0ff',
    marginLeft: 16,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});