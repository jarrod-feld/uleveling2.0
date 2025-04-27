import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Barbell, Brain } from 'phosphor-react-native';
import { scale as s } from '@/constants/scaling';
import { Goal } from '@/mock/roadmapData';

// Log imported icons immediately
console.log('Imported Brain:', typeof Brain);
console.log('Imported Barbell:', typeof Barbell);

export default function GoalRow({ goal }: { goal: Goal }) {
  // Log the received goal object
  console.log('GoalRow rendering with goal:', JSON.stringify(goal));

  const Icon = goal.category === 'INT' ? Brain : Barbell;
  const iconSize = s(16);
  const iconColor = '#fff';

  // Log icon details before rendering
  console.log(`GoalRow rendering Icon: ${goal.category === 'INT' ? 'Brain' : 'Barbell'}, Size: ${iconSize}, Color: ${iconColor}`);

  return (
    <View style={styles.row}>
      <Icon size={iconSize} color={iconColor} />
      <Text style={styles.txt} numberOfLines={2}>{goal.title}</Text>
    </View>
  );
}
const styles=StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',borderWidth:2,borderColor:'#fff',padding:s(8),marginHorizontal:s(20),marginTop:s(12)},
  txt:{fontFamily:'PressStart2P',fontSize:s(10),color:'#fff',marginLeft:s(6),flexShrink:1}
}); 